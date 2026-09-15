import { NextRequest, NextResponse } from 'next/server';
import { MOCK_LIVE_STATUS, MOCK_TRAINS } from '@/lib/mockData';
import { CONFIG } from '@/lib/config';

const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 25 * 1000; // 25 seconds cache

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
      headers: { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=10' },
    });
  }

  if (CONFIG.RAILRADAR_API_KEY) {
    try {
      const response = await fetch(`https://api.railradar.in/v1/trains/${number}/live`, {
        headers: {
          Authorization: `Bearer ${CONFIG.RAILRADAR_API_KEY}`,
          Accept: 'application/json',
        },
        next: { revalidate: 25 },
      });

      if (response.status === 404) {
        return NextResponse.json(
          { isLiveAvailable: false, error: 'Train Not Found', code: 'TRAIN_NOT_FOUND' },
          { status: 404 }
        );
      }

      if (response.status === 429) {
        const rateLimitPayload = {
          trainNumber: number,
          isLiveAvailable: false,
          isRateLimited: true,
          statusText: 'Live service temporarily rate-limited. Please try again shortly.',
          lastUpdated: new Date().toISOString(),
        };
        return NextResponse.json(rateLimitPayload, { status: 200 });
      }

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          const data = json.data;
          const rawRoute: any[] = data.route || [];
          const stoppingStations = rawRoute.filter((item) => item.isHalt === true);

          // Resolve Current, Next, Previous halts
          let currentHalt = data.currentLocation?.isHalt ? data.currentLocation : null;

          if (!currentHalt && data.previousHalt?.stationCode) {
            const foundPrev = stoppingStations.find((s) => s.stationCode === data.previousHalt.stationCode);
            if (foundPrev) currentHalt = foundPrev;
          }

          if (!currentHalt && stoppingStations.length > 0) {
            currentHalt = stoppingStations.find((s) => s.status === 'departed' || s.status === 'at-station') || stoppingStations[0];
          }

          let nextHalt = null;
          if (data.nextHalt?.stationCode) {
            const foundNext = stoppingStations.find((s) => s.stationCode === data.nextHalt.stationCode);
            if (foundNext) nextHalt = foundNext;
          }

          if (!nextHalt && currentHalt) {
            const currIdx = stoppingStations.findIndex((s) => s.stationCode === currentHalt.stationCode);
            if (currIdx !== -1 && currIdx < stoppingStations.length - 1) {
              nextHalt = stoppingStations[currIdx + 1];
            }
          }

          let previousHalt = null;
          if (data.previousHalt?.stationCode) {
            const foundPrev = stoppingStations.find((s) => s.stationCode === data.previousHalt.stationCode);
            if (foundPrev) previousHalt = foundPrev;
          }

          const currentStationObj = {
            code: currentHalt?.stationCode || data.currentStation?.code || stoppingStations[0]?.stationCode || 'N/A',
            name: currentHalt?.stationName || data.currentStation?.name || stoppingStations[0]?.stationName || 'N/A',
            actualDeparture: formatTime(currentHalt?.actualDeparture || data.currentStation?.actualDeparture),
            delayMinutes: currentHalt?.delayDeparture ?? data.delayMinutes ?? 0,
          };

          const nextStationObj = {
            code: nextHalt?.stationCode || data.nextStation?.code || stoppingStations[1]?.stationCode || 'N/A',
            name: nextHalt?.stationName || data.nextStation?.name || stoppingStations[1]?.stationName || 'N/A',
            eta: formatTime(nextHalt?.actualArrival || nextHalt?.scheduledArrival || data.nextStation?.eta),
            scheduledArrival: formatTime(nextHalt?.scheduledArrival || data.nextStation?.scheduledArrival),
            distanceRemainingKm: Math.max(
              0,
              Math.round((nextHalt?.distance || 0) - (data.currentLocation?.distanceFromOriginKm || 0))
            ),
          };

          const previousStationObj = previousHalt
            ? {
                code: previousHalt.stationCode,
                name: previousHalt.stationName,
                actualDeparture: formatTime(previousHalt.actualDeparture),
                delayMinutes: previousHalt.delayDeparture ?? 0,
              }
            : undefined;

          const totalHalts = stoppingStations.length || 1;
          const passedHaltsCount = stoppingStations.filter((s) => s.status === 'departed').length;
          const progressPercentage = Math.round((passedHaltsCount / totalHalts) * 100) || data.progressPercentage || 0;

          const mappedStatus = {
            trainNumber: data.trainNumber || number,
            trainName: data.trainName || data.train?.name || `Train ${number}`,
            isLiveAvailable: true,
            currentStation: currentStationObj,
            nextStation: nextStationObj,
            previousStation: previousStationObj,
            coordinates: [
              data.currentLocation?.lng ?? data.currentLocation?.longitude ?? 77.2195,
              data.currentLocation?.lat ?? data.currentLocation?.latitude ?? 28.6429,
            ] as [number, number],
            heading: data.currentLocation?.heading ?? 0,
            speedKmH: data.currentLocation?.speedKmh ?? data.currentLocation?.speed ?? 0,
            delayMinutes: data.delayMinutes ?? 0,
            statusText: data.statusText || (data.delayMinutes > 0 ? `Running ${data.delayMinutes} mins late` : 'On Time'),
            progressPercentage,
            lastUpdated: data.lastUpdatedAt || new Date().toISOString(),
            isStarted: data.status !== 'not-started',
            isCompleted: data.status === 'completed',
          };

          cache.set(number, { timestamp: Date.now(), data: mappedStatus });

          return NextResponse.json(mappedStatus, {
            headers: { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=10' },
          });
        }
      }
    } catch (error) {
      console.error(`Failed to fetch live status for train ${number} from RailRadar:`, error);
    }
  }

  // Fallback to Mock Data if available
  const liveStatus = MOCK_LIVE_STATUS[number];
  if (liveStatus) {
    const freshStatus = {
      ...liveStatus,
      isLiveAvailable: true,
      lastUpdated: new Date().toISOString(),
    };
    cache.set(number, { timestamp: Date.now(), data: freshStatus });
    return NextResponse.json(freshStatus);
  }

  // If live data cannot be fetched from API and no mock live status exists, return isLiveAvailable: false
  const unavailablePayload = {
    trainNumber: number,
    isLiveAvailable: false,
    isRateLimited: false,
    statusText: 'Live running status is currently unavailable.',
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json(unavailablePayload, { status: 200 });
}

