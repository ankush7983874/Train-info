import { NextRequest, NextResponse } from 'next/server';
import { JourneyContext } from '@/types/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context }: { query: string; context: JourneyContext } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    const q = query.trim().toLowerCase();

    // Language Detection: Hindi (Devanagari script), Hinglish, or English
    const isHindi = /[\u0900-\u097F]/.test(query);
    const isHinglish = !isHindi && (q.includes('kahan') || q.includes('kya') || q.includes('kab') || q.includes('paas') || q.includes('aayegi') || q.includes('hai') || q.includes('kitni'));

    // Check if context is available
    if (!context || (!context.trainNumber && !context.pnrNumber)) {
      const emptyReply = isHindi
        ? "कोई सक्रिय ट्रेन या सत्यापित पीएनआर चयनित नहीं है। कृपया पहले ट्रेन नंबर खोजें या पीएनआर सत्यापित करें।"
        : isHinglish
        ? "Abhi koi active train ya verified PNR select nahi hai. Kripya pehle train search karein ya PNR verify karein!"
        : "I don't have an active train or verified PNR selected yet. Please search for a train number or verify a PNR first!";

      return NextResponse.json({
        answer: emptyReply,
        suggestedActions: [
          { label: 'Search Train 12301', href: '/train/12301' },
          { label: 'Verify PNR', href: '/pnr' },
        ],
      });
    }

    const trainNameStr = context.trainName ? `${context.trainName} (${context.trainNumber})` : `Train #${context.trainNumber || 'Unknown'}`;

    // 1. Where is my train? / Train Location
    if (q.includes('where') || q.includes('location') || q.includes('position') || q.includes('kahan') || q.includes('कहाँ') || q.includes('स्थान')) {
      if (!context.currentStation) {
        const msg = isHindi
          ? `${trainNameStr} के लिए लाइव स्टेशन स्थिति वर्तमान में उपलब्ध नहीं है।`
          : isHinglish
          ? `${trainNameStr} ki live station position abhi provider se unavailable hai.`
          : `For ${trainNameStr}, live station position is currently unavailable from the provider. Scheduled route source is ${context.source?.name || 'N/A'} and destination is ${context.destination?.name || 'N/A'}.`;
        return NextResponse.json({ answer: msg });
      }

      const msg = isHindi
        ? `${trainNameStr} वर्तमान में ${context.currentStation.name} (${context.currentStation.code}) के पास है। यात्रा ${context.journeyProgressPercent}% पूरी हो चुकी है (${context.distanceCoveredKm}/${context.totalDistanceKm} किमी)।`
        : isHinglish
        ? `${trainNameStr} abhi ${context.currentStation.name} (${context.currentStation.code}) ke paas hai. Journey ${context.journeyProgressPercent}% complete ho chuki hai (${context.distanceCoveredKm}/${context.totalDistanceKm} km).`
        : `${trainNameStr} is currently at or near ${context.currentStation.name} (${context.currentStation.code}). Journey is ${context.journeyProgressPercent}% completed (${context.distanceCoveredKm} km of ${context.totalDistanceKm} km).`;

      return NextResponse.json({ answer: msg });
    }

    // 2. How late is my train? / Delay Query
    if (q.includes('late') || q.includes('delay') || q.includes('on time') || q.includes('schedule') || q.includes('लेट') || q.includes('देरी')) {
      if (context.delayMinutes === undefined || context.delayMinutes === null) {
        return NextResponse.json({
          answer: isHindi ? `${trainNameStr} के लिए लाइव देरी डेटा उपलब्ध नहीं है।` : `Live delay data for ${trainNameStr} is currently unavailable.`,
        });
      }
      if (context.delayMinutes <= 0) {
        return NextResponse.json({
          answer: isHindi
            ? `${trainNameStr} वर्तमान में सही समय पर (ON TIME) चल रही है!`
            : isHinglish
            ? `${trainNameStr} abhi bilkul ON TIME chal rahi hai!`
            : `${trainNameStr} is currently running ON TIME!`,
        });
      }
      return NextResponse.json({
        answer: isHindi
          ? `${trainNameStr} वर्तमान में ${context.delayMinutes} मिनट देरी से चल रही है।`
          : isHinglish
          ? `${trainNameStr} abhi ${context.delayMinutes} minutes late chal rahi hai.`
          : `${trainNameStr} is running LATE by ${context.delayMinutes} minutes. (${context.delayText}).`,
      });
    }

    // 3. Next Station Query
    if (q.includes('next station') || q.includes('next stop') || q.includes('अगला') || q.includes('aage')) {
      if (!context.nextStation) {
        return NextResponse.json({
          answer: isHindi ? `${trainNameStr} के लिए अगले स्टेशन की जानकारी उपलब्ध नहीं है।` : `Next station information for ${trainNameStr} is unavailable.`,
        });
      }
      const etaStr = context.etaNextStationFormatted ? ` (ETA: approx ${context.etaNextStationFormatted})` : '';
      return NextResponse.json({
        answer: isHindi
          ? `${trainNameStr} का अगला ठहराव स्टेशन ${context.nextStation.name} (${context.nextStation.code})${etaStr} है।`
          : isHinglish
          ? `${trainNameStr} ka agla stop ${context.nextStation.name} (${context.nextStation.code})${etaStr} hai.`
          : `The next stopping station for ${trainNameStr} is ${context.nextStation.name} (${context.nextStation.code})${etaStr}.`,
      });
    }

    // 4. Remaining Stations Query
    if (q.includes('remaining station') || q.includes('how many station') || q.includes('kitne station') || q.includes('कितने स्टेशन')) {
      return NextResponse.json({
        answer: isHindi
          ? `${trainNameStr} ने ${context.totalStops} में से ${context.completedStops} स्टेशन पूरे कर लिए हैं। ${context.destination?.name || 'गंतव्य'} तक ${context.remainingStops} स्टेशन शेष हैं।`
          : isHinglish
          ? `${trainNameStr} ne ${context.totalStops} me se ${context.completedStops} stops cover kar liye hain. ${context.destination?.name || 'destination'} tak ${context.remainingStops} stations remaining hain.`
          : `${trainNameStr} has completed ${context.completedStops} out of ${context.totalStops} actual stopping stations. There are ${context.remainingStops} stations remaining until ${context.destination?.name || 'destination'}.`,
      });
    }

    // 5. Destination ETA Query
    if (q.includes('reach') || q.includes('destination') || q.includes('arrival time') || q.includes('eta') || q.includes('kab aayegi') || q.includes('कब पहुंचेगी')) {
      if (!context.etaDestinationFormatted) {
        return NextResponse.json({
          answer: isHindi
            ? `${context.destination?.name || 'गंतव्य'} पर अनुमानित आगमन का समय उपलब्ध नहीं है।`
            : `Estimated arrival time at ${context.destination?.name || 'destination'} is unavailable from current provider data. Scheduled destination is ${context.destination?.name || 'N/A'}.`,
        });
      }
      return NextResponse.json({
        answer: isHindi
          ? `${context.destination?.name} (${context.destination?.code}) पर अनुमानित आगमन समय ${context.etaDestinationFormatted} है।`
          : isHinglish
          ? `${context.destination?.name} (${context.destination?.code}) par estimated arrival time ${context.etaDestinationFormatted} hai.`
          : `Estimated arrival at ${context.destination?.name} (${context.destination?.code}) is ${context.etaDestinationFormatted}. Current delay is ${context.delayText}.`,
      });
    }

    // 6. Weather Query
    if (q.includes('weather') || q.includes('mausam') || q.includes('मौसम') || q.includes('rain') || q.includes('temp')) {
      if (context.nextStationWeather) {
        const w = context.nextStationWeather;
        return NextResponse.json({
          answer: isHindi
            ? `अगले स्टेशन (${w.locationName}) का मौसम: ${w.tempC}°C, ${w.condition}, आर्द्रता ${w.humidity}%, हवा ${w.windKmH} किमी/घंटा।`
            : `Weather at next station (${w.locationName}): ${w.tempC}°C, ${w.condition}, Humidity ${w.humidity}%, Wind ${w.windKmH} km/h.`,
        });
      }
      return NextResponse.json({
        answer: `Weather data is currently normal along the route (${context.currentWeather?.tempC || 30}°C).`,
      });
    }

    // Default Multilingual Summary Response
    const defaultAnswer = isHindi
      ? `${trainNameStr} की वास्तविक समय स्थिति: देरी: ${context.delayText}। वर्तमान स्टेशन: ${context.currentStation?.name || 'N/A'}। अगला स्टेशन: ${context.nextStation?.name || 'N/A'}। प्रगति: ${context.journeyProgressPercent}% पूरी।`
      : isHinglish
      ? `${trainNameStr} status summary: Delay ${context.delayText}. Current station: ${context.currentStation?.name || 'N/A'}. Next station: ${context.nextStation?.name || 'N/A'}. Progress ${context.journeyProgressPercent}% completed.`
      : `Here is the current real-time summary for ${trainNameStr}: Status: ${context.delayText}. Current station: ${context.currentStation?.name || 'N/A'}. Next station: ${context.nextStation?.name || 'N/A'}. Progress: ${context.journeyProgressPercent}% completed (${context.distanceCoveredKm}/${context.totalDistanceKm} km).`;

    return NextResponse.json({ answer: defaultAnswer });
  } catch (error: any) {
    console.error('AI Assistant chat error:', error);
    return NextResponse.json(
      { error: 'AI Assistant temporarily unavailable.' },
      { status: 500 }
    );
  }
}

