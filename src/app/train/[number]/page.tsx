'use client';

import React, { use, useEffect, useState } from 'react';
import SearchBar from '@/components/search/SearchBar';
import JourneyCard from '@/components/train/JourneyCard';
import StationTimeline from '@/components/train/StationTimeline';
import MapView from '@/components/map/MapView';
import WeatherCard from '@/components/companion/WeatherCard';
import SmartCompanion from '@/components/companion/SmartCompanion';
import AnalyticsOverview from '@/components/analytics/AnalyticsOverview';
import DateSelector from '@/components/train/DateSelector';
import { getISTTodayIso, formatDateDetails, isTrainOperatingOnDay } from '@/lib/dateUtils';
import { useLiveTracking } from '@/hooks/useTracking';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useFavoritesStore } from '@/store/favoritesStore';
import { Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { LiveStatus } from '@/types/tracking';

export default function TrainTrackingPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number: rawNumber } = use(params);
  const number = (rawNumber || '').trim().replace(/\s+/g, '');

  const [selectedIsoDate, setSelectedIsoDate] = useState<string>(getISTTodayIso());
  const dateDetails = formatDateDetails(selectedIsoDate);

  const { setSelectedTrainNumber } = useFavoritesStore();
  const { liveStatus, isLoadingStatus, isErrorStatus, routeInfo, isLoadingRoute, isErrorRoute } = useLiveTracking(number);
  const { data: analytics } = useAnalytics(number);

  useEffect(() => {
    if (number) {
      setSelectedTrainNumber(number);
    }
  }, [number, setSelectedTrainNumber]);

  // 1. Loading State
  if (isLoadingRoute) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-gray-500">Loading train timetable & route for #{number}...</p>
      </div>
    );
  }

  // 2. Train Genuine Not Found State
  if (isErrorRoute || (!routeInfo && !isLoadingRoute)) {
    return (
      <div className="space-y-8 py-4 max-w-2xl mx-auto">
        <SearchBar placeholder="Search another train (e.g. 12301, 15707)..." />

        <div className="flex min-h-[40vh] flex-col items-center justify-center space-y-4 text-center rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 shadow-sm">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Train Not Found</h2>
          <p className="text-sm text-gray-500 max-w-md font-medium">
            No Indian Railways train matching <span className="font-bold text-gray-800">#{number}</span> was found in the database.
          </p>
          <div className="pt-2 text-xs text-gray-400">
            Please check the train number and try searching again.
          </div>
        </div>
      </div>
    );
  }

  // 3. Operating Days check
  const runsOn = (routeInfo as any)?.runsOn || ['Daily'];
  const isOperatingOnSelectedDate = isTrainOperatingOnDay(runsOn, dateDetails.dayName);

  // 4. Construct effective status per selected date (Today = Live, Past = Historical, Future = Scheduled)
  let effectiveStatus: LiveStatus;

  if (dateDetails.isToday && liveStatus && liveStatus.isLiveAvailable !== false && liveStatus.currentStation) {
    // Today with live tracking
    effectiveStatus = liveStatus;
  } else if (dateDetails.isPast) {
    // Yesterday / Past historical status (Strict non-fabrication rule: show scheduled route & timetable)
    effectiveStatus = {
      trainNumber: number,
      trainName: routeInfo?.trainName || `Train ${number}`,
      isLiveAvailable: false,
      currentStation: {
        code: routeInfo?.stations[0]?.code || 'SRC',
        name: routeInfo?.stations[0]?.name || 'Origin Station',
        actualDeparture: routeInfo?.stations[0]?.departureTime,
        delayMinutes: 0,
      },
      nextStation: {
        code: routeInfo?.stations[routeInfo?.stations.length - 1]?.code || 'DST',
        name: routeInfo?.stations[routeInfo?.stations.length - 1]?.name || 'Destination Station',
        eta: routeInfo?.stations[routeInfo?.stations.length - 1]?.arrivalTime || '--:--',
        scheduledArrival: routeInfo?.stations[routeInfo?.stations.length - 1]?.arrivalTime || '--:--',
        distanceRemainingKm: 0,
      },
      previousStation: {
        code: routeInfo?.stations[0]?.code || 'SRC',
        name: routeInfo?.stations[0]?.name || 'Origin Station',
        actualDeparture: routeInfo?.stations[0]?.departureTime || 'Scheduled',
        delayMinutes: 0,
      },
      coordinates: [0, 0], // Hide live marker for past date without provider GPS
      heading: 0,
      speedKmH: 0,
      delayMinutes: 0,
      statusText: `Historical live tracking is unavailable for this date (${dateDetails.fullDateStr}).`,
      progressPercentage: 100,
      lastUpdated: new Date().toISOString(),
      isStarted: true,
      isCompleted: true,
    };
  } else if (dateDetails.isFuture) {
    // Tomorrow / Future scheduled status
    effectiveStatus = {
      trainNumber: number,
      trainName: routeInfo?.trainName || `Train ${number}`,
      isLiveAvailable: false,
      currentStation: {
        code: routeInfo?.stations[0]?.code || 'SRC',
        name: routeInfo?.stations[0]?.name || 'Origin Station',
        actualDeparture: routeInfo?.stations[0]?.departureTime,
        delayMinutes: 0,
      },
      nextStation: {
        code: routeInfo?.stations[1]?.code || 'NEXT',
        name: routeInfo?.stations[1]?.name || 'Next Scheduled Station',
        eta: routeInfo?.stations[1]?.arrivalTime || '--:--',
        scheduledArrival: routeInfo?.stations[1]?.arrivalTime || '--:--',
        distanceRemainingKm: Math.max(0, (routeInfo?.stations[1]?.distanceKm || 0) - (routeInfo?.stations[0]?.distanceKm || 0)),
      },
      previousStation: {
        code: routeInfo?.stations[0]?.code || 'SRC',
        name: routeInfo?.stations[0]?.name || 'Origin Station',
        actualDeparture: routeInfo?.stations[0]?.departureTime || 'Scheduled',
        delayMinutes: 0,
      },
      coordinates: [0, 0], // Hide live marker for future date
      heading: 0,
      speedKmH: 0,
      delayMinutes: 0,
      statusText: `Live tracking will be available when the journey starts on ${dateDetails.fullDateStr}.`,
      progressPercentage: 0,
      lastUpdated: new Date().toISOString(),
      isStarted: false,
      isCompleted: false,
    };
  } else {
    // Fallback for Today when live status is unavailable
    effectiveStatus = (liveStatus && liveStatus.currentStation) ? liveStatus : {
      trainNumber: number,
      trainName: routeInfo?.trainName || `Train ${number}`,
      isLiveAvailable: false,
      currentStation: {
        code: routeInfo?.stations[0]?.code || 'SRC',
        name: routeInfo?.stations[0]?.name || 'Origin Station',
        actualDeparture: routeInfo?.stations[0]?.departureTime,
        delayMinutes: 0,
      },
      nextStation: {
        code: routeInfo?.stations[1]?.code || 'DST',
        name: routeInfo?.stations[1]?.name || 'Destination Station',
        eta: routeInfo?.stations[1]?.arrivalTime || '--:--',
        scheduledArrival: routeInfo?.stations[1]?.arrivalTime || '--:--',
        distanceRemainingKm: Math.max(0, (routeInfo?.stations[1]?.distanceKm || 0) - (routeInfo?.stations[0]?.distanceKm || 0)),
      },
      previousStation: {
        code: routeInfo?.stations[0]?.code || 'SRC',
        name: routeInfo?.stations[0]?.name || 'Origin Station',
        actualDeparture: routeInfo?.stations[0]?.departureTime || 'Scheduled',
        delayMinutes: 0,
      },
      coordinates: [
        routeInfo?.stations[0]?.lon || 77.2195,
        routeInfo?.stations[0]?.lat || 28.6429,
      ],
      heading: 0,
      speedKmH: 0,
      delayMinutes: 0,
      statusText: 'Live running status is currently unavailable for today.',
      progressPercentage: 0,
      lastUpdated: new Date().toISOString(),
      isStarted: true,
      isCompleted: false,
    };
  }

  return (
    <div className="space-y-8 py-4">
      {/* Top Search Bar */}
      <div className="max-w-2xl mx-auto">
        <SearchBar placeholder={`Search another train (currently tracking #${number})...`} />
      </div>

      {/* Date Selector (Yesterday / Today / Tomorrow / Custom Date Picker) */}
      <DateSelector
        selectedIsoDate={selectedIsoDate}
        onSelectDateIso={setSelectedIsoDate}
        runsOn={runsOn}
      />

      {/* Non-Operating Date Banner if applicable */}
      {!isOperatingOnSelectedDate && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-lg text-amber-900 flex items-center gap-4">
          <ShieldAlert className="h-8 w-8 text-amber-600 shrink-0" />
          <div>
            <h3 className="text-lg font-black text-amber-900">Train Does Not Operate On This Date</h3>
            <p className="text-xs font-semibold text-amber-700 mt-1">
              {routeInfo?.trainName} (#{number}) does not operate on {dateDetails.dayName} ({dateDetails.fullDateStr}). Scheduled operating days: {runsOn.join(', ')}.
            </p>
          </div>
        </div>
      )}

      {/* Main Journey Header Card */}
      <JourneyCard status={effectiveStatus} />

      {/* Interactive Railway Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>Route Map</span>
            {!dateDetails.isToday && (
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-800">
                {dateDetails.isPast ? 'Historical Route' : 'Scheduled Route'}
              </span>
            )}
          </h2>
          <span className="text-xs font-semibold text-gray-400">
            Date: {dateDetails.fullDateStr}
          </span>
        </div>
        <MapView
          coordinates={dateDetails.isToday ? effectiveStatus.coordinates : [0, 0]}
          heading={effectiveStatus.heading}
          speedKmH={dateDetails.isToday ? effectiveStatus.speedKmH : 0}
          delayMinutes={effectiveStatus.delayMinutes}
          polyline={routeInfo?.polyline || []}
          stations={routeInfo?.stations || []}
          trainName={effectiveStatus.trainName}
          trainNumber={number}
          currentStationCode={effectiveStatus.currentStation.code}
          isTopographyAvailable={!!analytics?.elevationProfile?.length}
        />
      </div>

      {/* Weather Forecast */}
      <WeatherCard />

      {/* Analytics Summary */}
      {analytics && <AnalyticsOverview analytics={analytics} />}

      {/* Smart Companion Sights */}
      {analytics?.landmarks && <SmartCompanion landmarks={analytics.landmarks} />}

      {/* Station Timeline */}
      {routeInfo?.stations && (
        <StationTimeline
          stations={routeInfo.stations}
          currentStationCode={effectiveStatus.currentStation.code}
          liveStatus={effectiveStatus}
          totalDistanceKm={routeInfo.totalDistanceKm}
        />
      )}
    </div>
  );
}


