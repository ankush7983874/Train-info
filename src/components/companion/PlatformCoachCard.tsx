'use client';

import React from 'react';
import { JourneyContext } from '@/types/ai';
import { Layers, ShieldAlert, TrainTrack, UserCheck } from 'lucide-react';

interface PlatformCoachCardProps {
  context: JourneyContext;
}

export default function PlatformCoachCard({ context }: PlatformCoachCardProps) {
  const hasPlatform = Boolean(context.currentStationPlatform || context.nextStationPlatform || context.boardingPlatform);
  const hasCoach = Boolean(context.coachPosition || context.assignedSeat || (context.passengers && context.passengers.some(p => p.coach)));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Platform Info Card */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <TrainTrack className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-gray-900 text-base">Platform Information</h3>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Live Provider Data</span>
        </div>

        {hasPlatform ? (
          <div className="space-y-3">
            {context.currentStation && (
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3 text-xs font-semibold">
                <span className="text-gray-600">{context.currentStation.name} ({context.currentStation.code})</span>
                <span className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-black text-white">
                  Platform: {context.currentStationPlatform || 'TBD'}
                </span>
              </div>
            )}
            {context.nextStation && (
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3 text-xs font-semibold">
                <span className="text-gray-600">Next: {context.nextStation.name}</span>
                <span className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-black text-white">
                  Platform: {context.nextStationPlatform || 'TBD'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-amber-50/60 p-4 border border-amber-100 flex items-start gap-3 text-amber-800">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="text-xs font-bold">Platform information unavailable</p>
              <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                Official platform assignment is not published by the provider for this train section yet. We never fabricate platform numbers.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Coach Position & Seat Allocation Card */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-base">Coach & Seat Position</h3>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">PNR / Rake Feed</span>
        </div>

        {hasCoach ? (
          <div className="space-y-3">
            {context.coachPosition && (
              <div className="flex items-center justify-between rounded-2xl bg-indigo-50 p-3 text-xs font-bold text-indigo-900">
                <span>Verified Coach</span>
                <span className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-black text-white">
                  Coach {context.coachPosition}
                </span>
              </div>
            )}

            {context.assignedSeat && (
              <div className="flex items-center justify-between rounded-2xl bg-green-50 p-3 text-xs font-bold text-green-900">
                <span>Berth / Seat Allocation</span>
                <span className="rounded-lg bg-green-600 px-3 py-1 text-xs font-black text-white">
                  {context.assignedSeat}
                </span>
              </div>
            )}

            {context.passengers && context.passengers.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Passenger Details</span>
                {context.passengers.map((p) => (
                  <div key={p.number} className="flex items-center justify-between text-xs font-semibold text-gray-700 bg-gray-50 p-2 rounded-xl">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-blue-600" /> Passenger {p.number}
                    </span>
                    <span className="font-bold text-indigo-600">{p.coach ? `${p.coach} / ${p.berth}` : p.currentStatus}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 flex items-start gap-3 text-gray-600">
            <ShieldAlert className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-bold">Coach position data unavailable</p>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                Verify a 10-digit PNR number to automatically load your exact coach composition and berth allocation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
