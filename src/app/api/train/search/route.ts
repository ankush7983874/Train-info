import { NextRequest, NextResponse } from 'next/server';
import { MOCK_TRAINS } from '@/lib/mockData';
import { CONFIG } from '@/lib/config';
import { Train } from '@/types/train';

interface ParsedMasterTrain extends Train {
  searchable: string;
}

let masterTrainsCache: ParsedMasterTrain[] | null = null;
let lastMasterFetchTime = 0;
const MASTER_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours server cache

const searchCache = new Map<string, { timestamp: number; data: Train[] }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour search query cache

/**
 * Fetches and caches the complete official 13,591 train compressed master dataset
 * directly from RailRadar API (`/v1/lookup/trains/compressed` & `/v1/lookup/stations`).
 */
async function getRailRadarMasterTrains(): Promise<ParsedMasterTrain[]> {
  if (masterTrainsCache && Date.now() - lastMasterFetchTime < MASTER_TTL_MS) {
    return masterTrainsCache;
  }

  if (CONFIG.RAILRADAR_API_KEY) {
    try {
      const [trainsRes, stationsRes] = await Promise.all([
        fetch('https://api.railradar.in/v1/lookup/trains/compressed', {
          headers: { Authorization: `Bearer ${CONFIG.RAILRADAR_API_KEY}` },
          next: { revalidate: 86400 },
        }),
        fetch('https://api.railradar.in/v1/lookup/stations', {
          headers: { Authorization: `Bearer ${CONFIG.RAILRADAR_API_KEY}` },
          next: { revalidate: 86400 },
        }),
      ]);

      if (trainsRes.ok && stationsRes.ok) {
        const trainsJson = await trainsRes.json();
        const stationsJson = await stationsRes.json();

        const stationMap: Record<string, string> =
          stationsJson.success && stationsJson.data ? stationsJson.data : {};

        if (trainsJson.success && typeof trainsJson.data === 'string') {
          const lines = trainsJson.data.trim().split('\n');
          const parsedList: ParsedMasterTrain[] = lines.map((line: string) => {
            const [number, name, sourceCode, destCode] = line.split('|');
            const sourceName = stationMap[sourceCode] || sourceCode || 'Source';
            const destName = stationMap[destCode] || destCode || 'Destination';

            return {
              id: number,
              number,
              name: name || `Train ${number}`,
              source: { code: sourceCode, name: sourceName, city: sourceName },
              destination: { code: destCode, name: destName, city: destName },
              totalDistanceKm: 0,
              runsOn: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
              classes: ['1A', '2A', '3A', 'SL'],
              avgSpeedKmH: 60,
              searchable: `${number} ${name} ${sourceCode} ${sourceName} ${destCode} ${destName}`.toLowerCase(),
            };
          });

          masterTrainsCache = parsedList;
          lastMasterFetchTime = Date.now();
          return parsedList;
        }
      }
    } catch (err) {
      console.error('Failed to fetch RailRadar compressed master lookup dataset:', err);
    }
  }

  // Fallback to MOCK_TRAINS if API key missing or request fails
  return MOCK_TRAINS.map((t) => ({
    ...t,
    searchable: `${t.number} ${t.name} ${t.source.code} ${t.source.name} ${t.destination.code} ${t.destination.name}`.toLowerCase(),
  }));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawQuery = searchParams.get('q') || '';
  const query = rawQuery.trim();
  const cleanDigits = query.replace(/\D/g, '');
  const cleanQuery = query.replace(/\s+/g, '');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const cacheKey = query.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  }

  const masterList = await getRailRadarMasterTrains();
  const qLower = query.toLowerCase();
  const tokens = qLower.split(/\s+/).filter(Boolean);

  // Search across RailRadar master dataset of 13,591 real trains!
  const localResults: Train[] = masterList.filter((train) => {
    if (cleanDigits && cleanDigits.length >= 3 && train.number.includes(cleanDigits)) {
      return true;
    }
    return tokens.every((token) => train.searchable.includes(token));
  });

  const results: Train[] = [...localResults];

  // If input is a 3 to 5 digit train number, fetch exact live details from RailRadar if needed
  const isNumeric = /^\d{3,5}$/.test(cleanDigits) || /^\d{3,5}$/.test(cleanQuery);
  const targetNumber = cleanDigits || cleanQuery;

  if (isNumeric && CONFIG.RAILRADAR_API_KEY) {
    const exactMatch = results.find((t) => t.number === targetNumber);
    if (!exactMatch) {
      try {
        const response = await fetch(`https://api.railradar.in/v1/trains/${targetNumber}`, {
          headers: {
            Authorization: `Bearer ${CONFIG.RAILRADAR_API_KEY}`,
            Accept: 'application/json',
          },
          next: { revalidate: 3600 },
        });

        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data?.train) {
            const t = json.data.train;
            const apiTrain: Train = {
              id: t.number,
              number: t.number,
              name: t.name || `Train ${t.number}`,
              source: {
                code: t.source?.code || 'SRC',
                name: t.source?.name || 'Source Station',
                city: t.source?.name || 'Source',
              },
              destination: {
                code: t.destination?.code || 'DST',
                name: t.destination?.name || 'Destination Station',
                city: t.destination?.name || 'Destination',
              },
              totalDistanceKm: Math.round(t.distance || 0),
              runsOn: t.runDays ? t.runDays.map((d: string) => d.slice(0, 3).toUpperCase()) : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
              classes: t.classes || ['1A', '2A', '3A', 'SL'],
              avgSpeedKmH: Math.round(t.avgSpeed || 60),
            };

            results.unshift(apiTrain);
          }
        }
      } catch (err) {
        console.error(`RailRadar train lookup failed for ${targetNumber}:`, err);
      }
    }
  }

  // Deduplicate by train number
  const uniqueResults: Train[] = [];
  const seenNumbers = new Set<string>();
  for (const item of results) {
    if (!seenNumbers.has(item.number)) {
      seenNumbers.add(item.number);
      uniqueResults.push(item);
    }
  }

  searchCache.set(cacheKey, { timestamp: Date.now(), data: uniqueResults });

  return NextResponse.json(uniqueResults, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}

