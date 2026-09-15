import { NextRequest, NextResponse } from 'next/server';
import { MOCK_STATIONS_12301, MOCK_POLYLINE_12301, MOCK_TRAINS } from '@/lib/mockData';
import { CONFIG } from '@/lib/config';
import { Station } from '@/types/train';

// In-memory cache for train metadata and route details (1 hour cache)
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

const STATION_COORDS: Record<string, [number, number]> = {
  HWH: [88.3428, 22.5839],
  ASN: [86.9833, 23.6833],
  DHN: [86.4304, 23.7957],
  GAYA: [85.0000, 24.8000],
  DDU: [83.1189, 25.2819],
  PRYJ: [81.8324, 25.4484],
  CNB: [80.3500, 26.4542],
  NDLS: [77.2195, 28.6429],
  MMCT: [72.8193, 18.9696],
  BVI: [72.8566, 19.2288],
  ST: [72.8406, 21.2049],
  BRC: [73.1812, 22.3107],
  RTM: [75.0367, 23.3341],
  NAD: [75.4055, 23.4544],
  KOTA: [75.8648, 25.2138],
  AGC: [78.0081, 27.1577],
  GWL: [78.1828, 26.2183],
  BSB: [82.9862, 25.3268],
  RKMP: [77.4394, 23.2209],
  TVC: [76.9525, 8.4870],
};

function formatTime(isoOrTime?: string): string {
  if (!isoOrTime) return '--:--';
  if (isoOrTime.includes('T')) {
    const d = new Date(isoOrTime);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  }
  return isoOrTime;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number: rawNumber } = await params;
  const number = (rawNumber || '').trim().replace(/\s+/g, '');

  if (!number) {
    return NextResponse.json({ error: 'Train number required' }, { status: 400 });
  }

  // Check cache
  const cached = cache.get(number);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
    });
  }

  if (CONFIG.RAILRADAR_API_KEY) {
    try {
      // 1. Try static train details endpoint /v1/trains/${number}
      const response = await fetch(`https://api.railradar.in/v1/trains/${number}`, {
        headers: {
          Authorization: `Bearer ${CONFIG.RAILRADAR_API_KEY}`,
          Accept: 'application/json',
        },
        next: { revalidate: 3600 },
      });

      if (response.status === 404) {
        // Explicitly handle genuine train not found
        const mockMatch = MOCK_TRAINS.find((t) => t.number === number);
        if (!mockMatch) {
          return NextResponse.json({ error: 'Train Not Found', code: 'TRAIN_NOT_FOUND' }, { status: 404 });
        }
      }

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          const trainMeta = json.data.train || {};
          const rawRoute: any[] = json.data.route || [];

          // Polyline extraction for Map geometry line
          const polyline: [number, number][] = rawRoute
            .map((item) => {
              const code = item.station?.code || item.stationCode;
              const lng = item.station?.lng ?? item.lng ?? item.lon;
              const lat = item.station?.lat ?? item.lat;
              const known = code ? STATION_COORDS[code] : null;

              if (lng != null && lat != null) return [lng, lat] as [number, number];
              if (known) return known;
              return null;
            })
            .filter((pt): pt is [number, number] => pt !== null);

          // Halts extraction (stopping stations ONLY)
          const stoppingStationsRaw = rawRoute.filter((item) => item.isHalt === true);

          const stations: Station[] = stoppingStationsRaw.map((item) => {
            const code = item.station?.code || item.stationCode || 'N/A';
            const name = item.station?.name || item.stationName || 'N/A';
            const knownCoords = STATION_COORDS[code] || [77.2195, 28.6429];
            const lon = item.station?.lng ?? item.lng ?? item.lon ?? knownCoords[0];
            const lat = item.station?.lat ?? item.lat ?? knownCoords[1];

            const arrival = item.scheduledArrival || item.arrival || item.schArr;
            const departure = item.scheduledDeparture || item.departure || item.schDep;

            return {
              code,
              name,
              arrivalTime: formatTime(arrival),
              departureTime: formatTime(departure),
              actualArrival: item.actualArrival ? formatTime(item.actualArrival) : undefined,
              actualDeparture: item.actualDeparture ? formatTime(item.actualDeparture) : undefined,
              distanceKm: Math.round(item.distance ?? item.distanceFromOriginKm ?? 0),
              day: item.arrivalDay || item.departureDay || 1,
              platform: item.platform ? String(item.platform) : undefined,
              lat,
              lon,
              passed: item.status === 'departed' || item.status === 'arrived',
              delayMinutes: item.delayArrival ?? item.delayDeparture ?? 0,
              isStoppingStation: true,
              isHalt: true,
            };
          });

          const routeData = {
            trainNumber: trainMeta.number || number,
            trainName: trainMeta.name || `Train ${number}`,
            source: {
              code: trainMeta.source?.code || stations[0]?.code || 'SRC',
              name: trainMeta.source?.name || stations[0]?.name || 'Source Station',
              city: trainMeta.source?.name || 'Source',
            },
            destination: {
              code: trainMeta.destination?.code || stations[stations.length - 1]?.code || 'DST',
              name: trainMeta.destination?.name || stations[stations.length - 1]?.name || 'Destination Station',
              city: trainMeta.destination?.name || 'Destination',
            },
            stations,
            polyline: polyline.length > 0 ? polyline : MOCK_POLYLINE_12301,
            totalDistanceKm: Math.round(trainMeta.distance || stations[stations.length - 1]?.distanceKm || 1451),
          };

          cache.set(number, { timestamp: Date.now(), data: routeData });

          return NextResponse.json(routeData, {
            headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
          });
        }
      }
    } catch (error) {
      console.error(`Failed to fetch static route details for train ${number}:`, error);
    }
  }

  // 2. Fallback check against Mock Dataset if RailRadar unavailable or failed
  const mockTrain = MOCK_TRAINS.find((t) => t.number === number);
  if (!mockTrain && number !== '12301') {
    return NextResponse.json({ error: 'Train Not Found', code: 'TRAIN_NOT_FOUND' }, { status: 404 });
  }

  const mockStoppingStations = MOCK_STATIONS_12301.map((s) => ({
    ...s,
    isStoppingStation: true,
    isHalt: true,
  }));

  const fallbackRouteData = {
    trainNumber: number,
    trainName: mockTrain ? mockTrain.name : 'Howrah - New Delhi Rajdhani Express',
    source: mockTrain ? mockTrain.source : { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata' },
    destination: mockTrain ? mockTrain.destination : { code: 'NDLS', name: 'New Delhi', city: 'New Delhi' },
    stations: mockStoppingStations,
    polyline: MOCK_POLYLINE_12301,
    totalDistanceKm: mockTrain ? mockTrain.totalDistanceKm : 1451,
  };

  cache.set(number, { timestamp: Date.now(), data: fallbackRouteData });

  return NextResponse.json(fallbackRouteData, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
  });
}

