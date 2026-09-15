'use client';

import React from 'react';
import { JourneyContext } from '@/types/ai';
import { Clock, MapPin, Compass, AlertTriangle, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

interface JourneyCountdownCardProps {
  context: JourneyContext;
}

export default function JourneyCountdownCard({ context }: JourneyCountdownCardProps) {
  if (!context || !context.isRealDataAvailable) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50">
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="h-5 w-5" />
          <span className="text-sm font-semibold">Journey Countdown unavailable (Select a train or verify PNR)</span>
        </div>
      </div>
    );
  }

  const hasEta = context.etaNextStationMinutes !== null || context.etaDestinationFormatted !== null;

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Journey Countdown & Live ETAs</h3>
            <p className="text-xs text-gray-500 font-medium">Automatic countdown from live tracking feed</p>
          </div>
        </div>

        <span
          className={clsx(
            'rounded-full px-3 py-1 text-xs font-bold',
            context.delayMinutes <= 0
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          )}
        >
          {context.delayText}
        </span>
      </div>

      {!hasEta ? (
        <div className="rounded-2xl bg-gray-50 p-4 text-center text-xs font-medium text-gray-500 border border-dashed border-gray-200">
          ETA information is currently unavailable from provider feed. Countdown paused.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Next Station Card */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Next Station
              </span>
              {context.etaNextStationFormatted && (
                <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[11px] font-black text-white">
                  ETA: {context.etaNextStationFormatted}
                </span>
              )}
            </div>

            <div className="text-lg font-black text-gray-900">
              {context.nextStation ? `${context.nextStation.name} (${context.nextStation.code})` : 'Destination En Route'}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600 font-semibold pt-1 border-t border-blue-100/60">
              <span>Remaining Distance</span>
              <span className="font-bold text-gray-900">{context.distanceRemainingKm} km</span>
            </div>
          </div>

          {/* Destination Card */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5" /> Final Destination
              </span>
              {context.etaDestinationFormatted && (
                <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-[11px] font-black text-white">
                  ETA: {context.etaDestinationFormatted}
                </span>
              )}
            </div>

            <div className="text-lg font-black text-gray-900">
              {context.destination ? `${context.destination.name} (${context.destination.code})` : 'Final Destination'}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600 font-semibold pt-1 border-t border-indigo-100/60">
              <span>Remaining Stops</span>
              <span className="font-bold text-gray-900">{context.remainingStops} stops</span>
            </div>
          </div>
        </div>
      )}

      {/* Progress Line */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-gray-600">
          <span>{context.source?.name || 'Source'}</span>
          <span>{context.journeyProgressPercent}% Journey Completed</span>
          <span>{context.destination?.name || 'Destination'}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
            style={{ width: `${context.journeyProgressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
