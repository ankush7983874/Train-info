import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

export interface StationLookupItem {
  code: string;
  name: string;
  city?: string;
}

let stationListCache: StationLookupItem[] | null = null;
let lastStationFetchTime = 0;
const STATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours server cache

/**
 * Fetches and caches the official RailRadar station master lookup dictionary.
 * Maps station code -> station name across 12,900+ Indian Railway stations.
 */
async function getStationMaster(): Promise<StationLookupItem[]> {
  if (stationListCache && Date.now() - lastStationFetchTime < STATION_TTL_MS) {
    return stationListCache;
  }

  if (CONFIG.RAILRADAR_API_KEY) {
    try {
      const response = await fetch('https://api.railradar.in/v1/lookup/stations', {
        headers: {
          Authorization: `Bearer ${CONFIG.RAILRADAR_API_KEY}`,
          Accept: 'application/json',
        },
        next: { revalidate: 86400 },
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          const map: Record<string, string> = json.data;
          const list: StationLookupItem[] = Object.entries(map).map(([code, name]) => ({
            code: code.toUpperCase(),
            name: name,
            city: name,
          }));

          stationListCache = list;
          lastStationFetchTime = Date.now();
          return list;
        }
      }
    } catch (err) {
      console.error('Failed to fetch RailRadar station master dataset:', err);
    }
  }

  // Fallback default list if API key missing or offline
  const fallback: StationLookupItem[] = [
    { code: 'GKP', name: 'Gorakhpur Junction', city: 'Gorakhpur' },
    { code: 'NDLS', name: 'New Delhi', city: 'New Delhi' },
    { code: 'LKO', name: 'Lucknow Charbagh NR', city: 'Lucknow' },
    { code: 'LJN', name: 'Lucknow Junction NE', city: 'Lucknow' },
    { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai' },
    { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata' },
    { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur' },
    { code: 'PRYJ', name: 'Prayagraj Junction', city: 'Prayagraj' },
    { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi' },
    { code: 'PNBE', name: 'Patna Junction', city: 'Patna' },
    { code: 'MAS', name: 'MGR Chennai Central', city: 'Chennai' },
    { code: 'SBC', name: 'KSR Bengaluru City', city: 'Bengaluru' },
    { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad' },
  ];

  return fallback;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawQuery = searchParams.get('q') || '';
  const query = rawQuery.trim().toLowerCase();

  const allStations = await getStationMaster();

  if (!query) {
    return NextResponse.json(allStations.slice(0, 15));
  }

  const queryUpper = query.toUpperCase();

  // Sort results: exact code match first, then code startsWith, then name startsWith, then name contains
  const exactCodeMatches: StationLookupItem[] = [];
  const codePrefixMatches: StationLookupItem[] = [];
  const namePrefixMatches: StationLookupItem[] = [];
  const nameContainsMatches: StationLookupItem[] = [];

  for (const st of allStations) {
    const code = st.code.toUpperCase();
    const nameLower = st.name.toLowerCase();

    if (code === queryUpper) {
      exactCodeMatches.push(st);
    } else if (code.startsWith(queryUpper)) {
      codePrefixMatches.push(st);
    } else if (nameLower.startsWith(query)) {
      namePrefixMatches.push(st);
    } else if (nameLower.includes(query) || code.includes(queryUpper)) {
      nameContainsMatches.push(st);
    }
  }

  const combined = [
    ...exactCodeMatches,
    ...codePrefixMatches,
    ...namePrefixMatches,
    ...nameContainsMatches,
  ];

  const results = combined.slice(0, 30);

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}
