import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';
import { PnrStatus, Passenger } from '@/types/pnr';

function parsePassenger(p: any, idx: number, data: any): Passenger {
  const passNum = p.number ?? p.passengerNo ?? p.srNo ?? p.index ?? (idx + 1);

  const rawBookingStatus = p.bookingStatus ?? p.bookingStatusDetails ?? p.booking_status ?? data.bookingStatus ?? 'CNF';
  const rawCurrentStatus = p.currentStatus ?? p.currentStatusDetails ?? p.current_status ?? data.currentStatus ?? rawBookingStatus;

  const bookingStatusStr = String(rawBookingStatus).trim();
  const currentStatusStr = String(rawCurrentStatus).trim();

  let coach: string | undefined = undefined;
  let berth: string | undefined = undefined;
  let berthType: string | undefined = undefined;

  const directCoach = p.coach ?? p.coachNo ?? p.coachNumber ?? p.bookingCoach ?? p.currentCoach ?? p.currentCoachId;
  if (directCoach != null && String(directCoach).trim() !== '' && String(directCoach).trim() !== 'N/A') {
    coach = String(directCoach).trim();
  }

  const directBerth = p.berth ?? p.seat ?? p.berthNo ?? p.seatNo ?? p.berthNumber ?? p.seatNumber ?? p.bookingBerth ?? p.currentBerth ?? p.currentSeat;
  if (directBerth != null && String(directBerth).trim() !== '' && String(directBerth).trim() !== 'N/A') {
    berth = String(directBerth).trim();
  }

  const directBerthType = p.berthType ?? p.berthCode ?? p.type ?? p.berthPosition;
  if (directBerthType != null && String(directBerthType).trim() !== '') {
    berthType = String(directBerthType).trim();
  }

  // Fallback string pattern parsing if coach/berth are embedded inside currentStatus/bookingStatus (e.g. "CNF/S5/42/LB" or "CNF S5 42")
  if (!coach || !berth) {
    const statusText = currentStatusStr || bookingStatusStr;
    const cnfMatch = statusText.match(/^CNF[\s\/]+([A-Z0-9]+)[\s\/]+(\d+)(?:[\s\/]+([A-Z]+))?/i);
    if (cnfMatch) {
      if (!coach) coach = cnfMatch[1].toUpperCase();
      if (!berth) berth = cnfMatch[2];
      if (!berthType && cnfMatch[3]) berthType = cnfMatch[3].toUpperCase();
    }
  }

  return {
    number: Number(passNum),
    bookingStatus: bookingStatusStr,
    currentStatus: currentStatusStr,
    coach,
    berth,
    berthType,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pnr: rawPnr, captchaAnswer, captchaToken } = body;

    const pnr = (rawPnr || '').trim().replace(/\s+/g, '');

    // 1. CAPTCHA Verification
    if (!captchaToken || !captchaAnswer) {
      return NextResponse.json({ error: 'CAPTCHA verification required.', code: 'CAPTCHA_REQUIRED' }, { status: 400 });
    }

    try {
      const decoded = Buffer.from(captchaToken, 'base64').toString('utf-8');
      const [expectedAnswerStr] = decoded.split(':');
      const expectedAnswer = parseInt(expectedAnswerStr, 10);
      const userAnswer = parseInt(String(captchaAnswer).trim(), 10);

      if (isNaN(userAnswer) || userAnswer !== expectedAnswer) {
        return NextResponse.json(
          { error: 'CAPTCHA Verification Failed. Incorrect answer.', code: 'CAPTCHA_FAILED' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json({ error: 'Invalid CAPTCHA token format.', code: 'CAPTCHA_FAILED' }, { status: 400 });
    }

    // 2. PNR Number Format Verification (exactly 10 digits)
    if (!/^\d{10}$/.test(pnr)) {
      return NextResponse.json(
        { error: 'Invalid PNR number. PNR must be a 10-digit number.', code: 'INVALID_PNR' },
        { status: 400 }
      );
    }

    // 3. Query RailRadar PNR Provider API
    if (CONFIG.RAILRADAR_API_KEY) {
      const maskedPnr = pnr.length === 10 ? `${pnr.slice(0, 3)}****${pnr.slice(7)}` : 'PNR';
      const response = await fetch(`https://api.railradar.in/v1/pnr/${pnr}`, {
        headers: {
          Authorization: `Bearer ${CONFIG.RAILRADAR_API_KEY}`,
          Accept: 'application/json',
        },
      });

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'PNR verification service temporarily rate-limited. Please try again shortly.', code: 'RATE_LIMITED' },
          { status: 429 }
        );
      }

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          const data = json.data;

          const rawPassengerList: any[] =
            data.passengers ||
            data.passengerList ||
            data.passengersList ||
            data.passengerDetails ||
            data.passenger_list ||
            [];

          let passengers: Passenger[] = [];

          if (Array.isArray(rawPassengerList) && rawPassengerList.length > 0) {
            passengers = rawPassengerList.map((p, idx) => parsePassenger(p, idx, data));
          } else {
            passengers = [parsePassenger(data, 0, data)];
          }

          const topLevelCoach = data.coach || data.coachNo || data.coachNumber || passengers[0]?.coach;
          const topLevelBerth = data.berth || data.seat || data.seatNumber || passengers[0]?.berth;

          const pnrResult: PnrStatus = {
            pnr,
            trainNumber: data.trainNumber || data.train?.number || 'N/A',
            trainName: data.trainName || data.train?.name || 'Express Train',
            journeyDate: data.journeyDate || data.date || new Date().toISOString().split('T')[0],
            source: {
              code: data.source?.code || data.from?.code || 'SRC',
              name: data.source?.name || data.from?.name || 'Source Station',
            },
            destination: {
              code: data.destination?.code || data.to?.code || 'DST',
              name: data.destination?.name || data.to?.name || 'Destination Station',
            },
            boardingStation: {
              code: data.boardingStation?.code || data.boardingPoint?.code || data.source?.code || 'SRC',
              name: data.boardingStation?.name || data.boardingPoint?.name || data.source?.name || 'Boarding Station',
            },
            class: data.class || data.travelClass || 'SL',
            quota: data.quota || 'GN',
            bookingStatus: data.bookingStatus || passengers[0]?.bookingStatus || 'CNF',
            currentStatus: data.currentStatus || data.status || passengers[0]?.currentStatus || 'CNF',
            chartStatus: data.chartStatus || (data.chartPrepared ? 'CHART PREPARED' : 'CHART NOT PREPARED'),
            coach: topLevelCoach && String(topLevelCoach).trim() !== '' ? String(topLevelCoach).trim() : undefined,
            berth: topLevelBerth && String(topLevelBerth).trim() !== '' ? String(topLevelBerth).trim() : undefined,
            passengers,
            lastUpdated: new Date().toISOString(),
            journeyState: 'ACTIVE',
          };

          return NextResponse.json(pnrResult);
        }
      }

      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Invalid or flushed PNR. This 10-digit record was not found or has expired after journey completion.', code: 'INVALID_PNR' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'PNR verification provider is currently unavailable. Please try again.', code: 'PROVIDER_UNAVAILABLE' },
      { status: 503 }
    );
  } catch (error) {
    console.error('PNR verification server error:', error);
    return NextResponse.json(
      { error: 'Internal server error during PNR verification.', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
