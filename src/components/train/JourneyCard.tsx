'use client';

import React from 'react';
import { LiveStatus } from '@/types/tracking';
import { Train, Clock, Gauge, Share2, Heart, CheckCircle2, Navigation2, AlertTriangle } from 'lucide-react';
import { useFavoritesStore } from '@/store/favoritesStore';
import { clsx } from 'clsx';

interface JourneyCardProps {
  status: LiveStatus;
}

export default function JourneyCard({ status }: JourneyCardProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const favorite = isFavorite(status.trainNumber);

  const isLive = status.isLiveAvailable !== false;
  const isRateLimited = status.isRateLimited === true;

  const toggleFavorite = () => {
    if (favorite) {
      removeFavorite(status.trainNumber);
    } else {
      addFavorite({
        id: status.trainNumber,
        number: status.trainNumber,
        name: status.trainName,
        source: { code: status.previousStation?.code || 'SRC', name: status.previousStation?.name || 'Origin Station', city: '' },
        destination: { code: status.nextStation.code, name: status.nextStation.name, city: '' },
        totalDistanceKm: 1451,
        runsOn: ['Daily'],
        classes: ['1A', '2A', '3A'],
        avgSpeedKmH: status.speedKmH || 60,
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${status.trainName} (${status.trainNumber}) Status`,
        text: `Tracking ${status.trainName}: ${status.statusText}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl shadow-gray-200/50 backdrop-blur-xl transition-all space-y-6">
      {/* Live Unavailable Warning Banner if applicable */}
      {!isLive && (
        <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 border border-amber-200 text-amber-900 text-xs font-semibold">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold block text-amber-800">
              {isRateLimited ? 'Live service temporarily rate-limited' : 'Live running status currently unavailable'}
            </span>
            <span className="text-amber-700">
              {isRateLimited
                ? 'Rate limit reached on satellite feed. Displaying scheduled timetable & stopping station route.'
                : 'Unable to reach live satellite GPS feed right now. Displaying complete scheduled route & timetable.'}
            </span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
            <Train className="h-7 w-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {status.trainName}
              </h1>
              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
                #{status.trainNumber}
              </span>
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  LIVE TRACKING
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                  LIVE UNAVAILABLE
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 font-medium mt-1">{status.statusText}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFavorite}
            className={clsx(
              'flex h-10 w-10 items-center justify-center rounded-full border transition-all',
              favorite
                ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                : 'border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            )}
            title={favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={clsx('h-5 w-5', favorite && 'fill-current')} />
          </button>

          <button
            onClick={handleShare}
            className="flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-2xs transition-all"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      {/* Journey Stopping Stations Overview (Previous, Current, Next) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Previous Station */}
        <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <Navigation2 className="h-4 w-4 text-gray-400 rotate-180" />
            Previous Stop
          </div>
          <div className="mt-2 text-lg font-bold text-gray-900 truncate">
            {status.previousStation?.name || 'Origin Station'}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Departed: {status.previousStation?.actualDeparture || 'Scheduled'}</span>
            {status.previousStation?.code && (
              <span className="rounded-md bg-gray-200 px-1.5 py-0.5 font-semibold text-[11px] text-gray-700">
                {status.previousStation.code}
              </span>
            )}
          </div>
        </div>

        {/* Current Active Station */}
        <div className={clsx(
          "rounded-2xl p-4 border transition-all",
          isLive
            ? "bg-blue-50/80 border-blue-200 ring-2 ring-blue-500/20"
            : "bg-gray-50 border-gray-200"
        )}>
          <div className="flex items-center justify-between">
            <div className={clsx(
              "flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider",
              isLive ? "text-blue-700" : "text-gray-600"
            )}>
              {isLive ? (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-ping" />
                  🟢 LIVE CURRENT
                </>
              ) : (
                "STATION POSITION"
              )}
            </div>
            <span className={clsx(
              "rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase",
              isLive ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
            )}>
              {isLive ? "Current Stop" : "Scheduled"}
            </span>
          </div>
          <div className="mt-2 text-lg font-black text-gray-900 truncate">
            {status.currentStation?.name || 'Scheduled Station'}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-gray-600 font-semibold">
            <span>{isLive ? `Departed / At: ${status.currentStation?.actualDeparture || 'Live'}` : 'Scheduled'}</span>
            {isLive && (
              <span
                className={clsx(
                  'rounded-full px-2 py-0.5 font-bold text-[11px]',
                  status.currentStation?.delayMinutes === 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-800'
                )}
              >
                {status.currentStation?.delayMinutes === 0 ? 'On Time' : `+${status.currentStation?.delayMinutes}m`}
              </span>
            )}
          </div>
        </div>

        {/* Next Scheduled Stop */}
        <div className="rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
              <Clock className="h-4 w-4 text-indigo-600 animate-pulse" />
              Next Scheduled Stop
            </div>
            {isLive && (
              <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                ETA {status.nextStation?.eta || '--:--'}
              </span>
            )}
          </div>
          <div className="mt-2 text-lg font-bold text-gray-900 truncate">
            {status.nextStation?.name || 'Next Station'}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Sched: {status.nextStation?.scheduledArrival || '--:--'}</span>
            {isLive && (
              <span className="font-bold text-indigo-700">
                {status.nextStation?.distanceRemainingKm || 0} km away
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Speed & Delay Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-gray-50 p-4 border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 shrink-0">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase block">
              {isLive ? 'Live Speed' : 'Scheduled Speed'}
            </span>
            <span className="text-xl font-extrabold text-gray-900">
              {isLive ? `${status.speedKmH} km/h` : 'Live Speed Unavailable'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t sm:border-t-0 sm:border-l border-gray-200 pt-3 sm:pt-0 sm:pl-4">
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase block">Delay Status</span>
            <span
              className={clsx(
                'text-sm font-extrabold',
                !isLive ? 'text-gray-500' : status.delayMinutes === 0 ? 'text-green-600' : 'text-amber-600'
              )}
            >
              {!isLive ? 'Live Delay Unavailable' : status.delayMinutes === 0 ? 'Running On Time' : `${status.delayMinutes} Minutes Delay`}
            </span>
          </div>
          <div className="text-right text-xs font-semibold text-gray-500">
            Updated {new Date(status.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Journey Progress Bar */}
      {isLive && (
        <div>
          <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
            <span>Stopping Station Progress</span>
            <span>{status.progressPercentage}% Completed</span>
          </div>
          <div className="h-3.5 w-full rounded-full bg-gray-100 p-0.5 overflow-hidden border border-gray-200/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-700 ease-out shadow-sm shadow-blue-500/50"
              style={{ width: `${status.progressPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

