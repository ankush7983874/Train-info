import { NextRequest, NextResponse } from 'next/server';
import { MOCK_TRAINS, MOCK_STATIONS_12301, MOCK_POLYLINE_12301, MOCK_ANALYTICS_12301 } from '@/lib/mockData';
import { CONFIG } from '@/lib/config';
import { Station } from '@/types/train';

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

  // 1. Try fetching real RailRadar train details or live data
  if (CONFIG.RAILRADAR_API_KEY) {
    try {
      // First try live endpoint
      let response = await fetch(`https://api.railradar.in/v1/trains/${number}/live`, {
        headers: {
          Authorization: `Bearer ${CONFIG.RAILRADAR_API_KEY}`,
          Accept: 'application/json',
        },
        next: { revalidate: 30 },
      });

      // If live is rate-limited or error, try static train details endpoint
      if (!response.ok) {
        response = await fetch(`https://api.railradar.in/v1/trains/${number}`, {
          headers: {
            Authorization: `Bearer ${CONFIG.RAILRADAR_API_KEY}`,
            Accept: 'application/json',
          },
          next: { revalidate: 3600 },
        });
      }

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          const data = json.data;
          const trainMeta = data.train || {};
          const rawRoute: any[] = data.route || [];

          // Filter ONLY actual stopping stations (halts)
          const stoppingStationsRaw = rawRoute.filter((item) => item.isHalt === true);

          const stoppingStations: Station[] = stoppingStationsRaw.map((item) => {
            const code = item.station?.code || item.stationCode || 'N/A';
            const name = item.station?.name || item.stationName || 'N/A';
            const knownCoords = STATION_COORDS[code] || [77.2195, 28.6429];
            const lon = item.station?.lng ?? item.lng ?? item.lon ?? knownCoords[0];
            const lat = item.station?.lat ?? item.lat ?? knownCoords[1];

            return {
              code,
              name,
              arrivalTime: formatTime(item.scheduledArrival || item.arrival || item.schArr),
              departureTime: formatTime(item.scheduledDeparture || item.departure || item.schDep),
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

          const totalStops = stoppingStations.length;
          const completedStops = stoppingStations.filter((s) => s.passed).length;
          const currentStopIndex = Math.min(completedStops + 1, totalStops);
          const remainingStops = Math.max(0, totalStops - completedStops);

          const totalDistanceKm = Math.round(
            trainMeta.distance || stoppingStations[stoppingStations.length - 1]?.distanceKm || 1400
          );
          const currentHalt = stoppingStations[Math.min(completedStops, totalStops - 1)];
          const distanceCoveredKm = currentHalt ? currentHalt.distanceKm : Math.round(totalDistanceKm * 0.5);
          const remainingDistanceKm = Math.max(0, totalDistanceKm - distanceCoveredKm);
          const completionPercentage = Math.min(
            100,
            Math.round((distanceCoveredKm / totalDistanceKm) * 100)
          );

          // Build delay trend from actual stopping stations
          const delayTrend = stoppingStations.map((s) => ({
            stationCode: s.code,
            stationName: s.name,
            delayMinutes: s.delayMinutes ?? 0,
            scheduledTime: s.arrivalTime,
            actualTime: s.actualArrival || s.arrivalTime,
            distanceKm: s.distanceKm,
          }));

          // Build elevation profile
          const elevationProfile = stoppingStations.map((s) => ({
            distanceKm: s.distanceKm,
            elevationM: Math.round(80 + (s.distanceKm % 180)),
            stationName: s.name,
            isStation: true,
          }));

          const highestPoint = elevationProfile.reduce(
            (max, p) => (p.elevationM > max.elevationM ? p : max),
            elevationProfile[0] || { elevationM: 200, stationName: 'Route Peak' }
          );

          const analytics = {
            trainNumber: number,
            trainName: data.trainName || trainMeta.name || `Train ${number}`,
            source: trainMeta.source || { code: stoppingStations[0]?.code || 'SRC', name: stoppingStations[0]?.name || 'Origin' },
            destination: trainMeta.destination || {
              code: stoppingStations[stoppingStations.length - 1]?.code || 'DEST',
              name: stoppingStations[stoppingStations.length - 1]?.name || 'Destination',
            },
            currentStation: {
              code: currentHalt?.code || stoppingStations[0]?.code || 'N/A',
              name: currentHalt?.name || stoppingStations[0]?.name || 'N/A',
            },
            nextStation: {
              code: stoppingStations[completedStops]?.code || stoppingStations[1]?.code || 'N/A',
              name: stoppingStations[completedStops]?.name || stoppingStations[1]?.name || 'N/A',
            },
            completionPercentage,
            distanceCoveredKm,
            remainingDistanceKm,
            totalDistanceKm,
            totalStops,
            completedStops,
            currentStopIndex,
            remainingStops,
            currentDelayMinutes: data.delayMinutes ?? 0,
            avgSpeedKmH: Math.round(trainMeta.avgSpeed || 85),
            maxSpeedKmH: Math.round(trainMeta.maxSpeed || 110),
            highestElevationM: highestPoint.elevationM,
            highestElevationLocation: highestPoint.stationName
              ? `${highestPoint.stationName} (${highestPoint.elevationM}m)`
              : `Route Peak (${highestPoint.elevationM}m)`,
            delayTrend,
            elevationProfile,
            landmarks: MOCK_ANALYTICS_12301.landmarks,
          };

          return NextResponse.json(analytics, {
            headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15' },
          });
        }
      }
    } catch (error) {
      console.error(`Failed to fetch RailRadar analytics for ${number}, falling back:`, error);
    }
  }

  // 2. Fallback to mock train dataset if matching or generate dynamic stats for requested train number
  const trainInfo = MOCK_TRAINS.find((t) => t.number === number);
  const stoppingStations = MOCK_STATIONS_12301.filter((s) => s.isStoppingStation !== false);
  const totalStops = stoppingStations.length;
  const completedStops = stoppingStations.filter((s) => s.passed).length;
  const currentStopIndex = Math.min(completedStops + 1, totalStops);
  const remainingStops = Math.max(0, totalStops - completedStops);

  const fallbackAnalytics = {
    ...MOCK_ANALYTICS_12301,
    trainNumber: number,
    trainName: trainInfo ? trainInfo.name : `Express Train #${number}`,
    source: trainInfo ? trainInfo.source : { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata' },
    destination: trainInfo ? trainInfo.destination : { code: 'NDLS', name: 'New Delhi', city: 'Delhi' },
    totalStops,
    completedStops,
    currentStopIndex,
    remainingStops,
    delayTrend: stoppingStations.map((s) => ({
      stationCode: s.code,
      stationName: s.name,
      delayMinutes: s.delayMinutes ?? 0,
      scheduledTime: s.arrivalTime,
      actualTime: s.actualArrival || s.arrivalTime,
      distanceKm: s.distanceKm,
    })),
  };

  return NextResponse.json(fallbackAnalytics, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15' },
  });
}

