import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

export interface StationTrainResult {
  trainNumber: string;
  trainName: string;
  trainType: string;
  source: { code: string; name: string };
  destination: { code: string; name: string };
  fromStation: {
    code: string;
    name: string;
    arrivalTime: string;
    departureTime: string;
    day: number;
    distanceKm: number;
    stopType: string;
  };
  toStation: {
    code: string;
    name: string;
    arrivalTime: string;
    departureTime: string;
    day: number;
    distanceKm: number;
    stopType: string;
  };
  journeyDuration: string;
  durationMinutes: number;
  distanceKm: number;
  dayDifference: number;
  runsOn: string[]; // ["MON", "TUE", ...]
  runsToday: boolean;
  statusText: string;
  delayMinutes: number;
  isToday: boolean;
  isHistorical: boolean;
  isFuture: boolean;
}

const stationTrainsCache = new Map<string, { timestamp: number; data: any[] }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

function getISTDateStr(dateObj = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
  return formatter.format(dateObj); // YYYY-MM-DD
}

function getISTWeekday(dateObj: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' });
  return formatter.format(dateObj).toLowerCase(); // "mon", "tue", etc.
}

function trainRunsOnDate(runDays: string[], departureDayFromOrigin: number, targetDateStr: string): boolean {
  if (!runDays || runDays.length === 0) return true;

  const [year, month, day] = targetDateStr.split('-').map(Number);
  if (!year || !month || !day) return true;

  // Noon UTC date for the target day to prevent any timezone rollover issues
  const targetDate = new Date(Date.UTC(year, month - 1, day, 6, 0, 0));

  const offsetDays = Math.max(0, (departureDayFromOrigin || 1) - 1);
  const originDate = new Date(targetDate.getTime() - offsetDays * 86400000);

  const originDayName = getISTWeekday(originDate);
  const normalizedRunDays = runDays.map((d) => d.toLowerCase().slice(0, 3));

  return normalizedRunDays.includes(originDayName);
}

function calcDuration(fromStop: any, toStop: any) {
  const fromTime = fromStop.departure || fromStop.arrival || '00:00';
  const toTime = toStop.arrival || toStop.departure || '00:00';

  const [fH, fM] = fromTime.split(':').map(Number);
  const [tH, tM] = toTime.split(':').map(Number);

  const fDay = fromStop.departureDay || fromStop.arrivalDay || 1;
  const tDay = toStop.arrivalDay || toStop.departureDay || 1;

  let dayDiff = Math.max(0, tDay - fDay);
  const fMinutes = (isNaN(fH) ? 0 : fH) * 60 + (isNaN(fM) ? 0 : fM);
  let tMinutes = (isNaN(tH) ? 0 : tH) * 60 + (isNaN(tM) ? 0 : tM) + dayDiff * 1440;

  if (tMinutes < fMinutes) {
    tMinutes += 1440;
    dayDiff += 1;
  }

  const diffMins = tMinutes - fMinutes;
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;

  return {
    durationStr: `${h}h ${m}m`,
    diffMins,
    dayDiff,
  };
}

async function fetchStationTrains(stationCode: string): Promise<any[]> {
  const codeUpper = stationCode.toUpperCase();
  const cached = stationTrainsCache.get(codeUpper);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  if (CONFIG.RAILRADAR_API_KEY) {
    try {
      const response = await fetch(`https://api.railradar.in/v1/stations/${codeUpper}/trains`, {
        headers: {
          Authorization: `Bearer ${CONFIG.RAILRADAR_API_KEY}`,
          Accept: 'application/json',
        },
        next: { revalidate: 3600 },
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data?.trains) {
          const trainsList = json.data.trains;
          stationTrainsCache.set(codeUpper, { timestamp: Date.now(), data: trainsList });
          return trainsList;
        }
      }
    } catch (err) {
      console.error(`Failed to fetch RailRadar station trains for ${codeUpper}:`, err);
    }
  }

  return [];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fromCode = (searchParams.get('from') || '').trim().toUpperCase();
  const toCode = (searchParams.get('to') || '').trim().toUpperCase();
  const targetDateParam = (searchParams.get('date') || '').trim();

  if (!fromCode || !toCode) {
    return NextResponse.json({ error: 'Both From and To station codes are required.' }, { status: 400 });
  }

  if (fromCode === toCode) {
    return NextResponse.json(
      { error: 'Please select different stations.', code: 'SAME_STATION' },
      { status: 400 }
    );
  }

  const todayIST = getISTDateStr();
  const targetDateStr = targetDateParam || todayIST;

  const isToday = targetDateStr === todayIST;
  const isHistorical = targetDateStr < todayIST;
  const isFuture = targetDateStr > todayIST;

  // Fetch station trains for From and To in parallel
  const [fromTrainsData, toTrainsData] = await Promise.all([
    fetchStationTrains(fromCode),
    fetchStationTrains(toCode),
  ]);

  if (fromTrainsData.length === 0 && toTrainsData.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  // Create lookup map for From station trains
  const fromMap = new Map<string, any>();
  for (const item of fromTrainsData) {
    if (item.train?.number) {
      fromMap.set(item.train.number, item);
    }
  }

  const results: StationTrainResult[] = [];

  for (const toItem of toTrainsData) {
    const trainNum = toItem.train?.number;
    if (!trainNum) continue;

    const fromItem = fromMap.get(trainNum);
    if (!fromItem) continue;

    const fromStop = fromItem.stop || {};
    const toStop = toItem.stop || {};

    const fromSeq = fromStop.sequence ?? 0;
    const toSeq = toStop.sequence ?? 0;

    const fromDist = fromStop.distance ?? 0;
    const toDist = toStop.distance ?? 0;

    // Verify route sequence: From station MUST appear BEFORE To station!
    const isValidRouteOrder = fromSeq < toSeq || (fromSeq === toSeq && fromDist < toDist);
    if (!isValidRouteOrder) continue;

    const trainMeta = toItem.train || {};
    const rawRunDays: string[] = trainMeta.runDays || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    // Operating day check for the selected travel date
    const fromDepartureDay = fromStop.departureDay || fromStop.arrivalDay || 1;
    const runsOnSelectedDate = trainRunsOnDate(rawRunDays, fromDepartureDay, targetDateStr);

    if (!runsOnSelectedDate) continue;

    const durationInfo = calcDuration(fromStop, toStop);
    const distanceKm = Math.round(Math.max(0, toDist - fromDist));

    const formattedRunsOn = rawRunDays.map((d: string) => d.slice(0, 3).toUpperCase());

    let statusText = 'Scheduled';
    if (isToday) {
      statusText = 'Scheduled / Operating Today';
    } else if (isHistorical) {
      statusText = 'Scheduled (Historical live status unavailable)';
    } else if (isFuture) {
      statusText = 'Scheduled';
    }

    results.push({
      trainNumber: trainNum,
      trainName: trainMeta.name || `Train ${trainNum}`,
      trainType: trainMeta.type || 'Express',
      source: {
        code: trainMeta.source?.code || 'SRC',
        name: trainMeta.source?.name || 'Source',
      },
      destination: {
        code: trainMeta.destination?.code || 'DST',
        name: trainMeta.destination?.name || 'Destination',
      },
      fromStation: {
        code: fromCode,
        name: fromStop.stationName || fromItem.train?.source?.name || fromCode,
        arrivalTime: fromStop.arrival || '--:--',
        departureTime: fromStop.departure || fromStop.arrival || '--:--',
        day: fromDepartureDay,
        distanceKm: Math.round(fromDist),
        stopType: fromStop.stopType || 'halt',
      },
      toStation: {
        code: toCode,
        name: toStop.stationName || toItem.train?.destination?.name || toCode,
        arrivalTime: toStop.arrival || toStop.departure || '--:--',
        departureTime: toStop.departure || '--:--',
        day: toStop.arrivalDay || toStop.departureDay || 1,
        distanceKm: Math.round(toDist),
        stopType: toStop.stopType || 'halt',
      },
      journeyDuration: durationInfo.durationStr,
      durationMinutes: durationInfo.diffMins,
      distanceKm,
      dayDifference: durationInfo.dayDiff,
      runsOn: formattedRunsOn,
      runsToday: runsOnSelectedDate,
      statusText,
      delayMinutes: 0,
      isToday,
      isHistorical,
      isFuture,
    });
  }

  // Sort by departure time at From station by default
  results.sort((a, b) => {
    const timeA = a.fromStation.departureTime || '00:00';
    const timeB = b.fromStation.departureTime || '00:00';
    return timeA.localeCompare(timeB);
  });

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=300',
    },
  });
}
