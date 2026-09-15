'use client';

import React, { useState } from 'react';
import { Station } from '@/types/train';
import { LiveStatus } from '@/types/tracking';
import { calculateRouteSegments, RouteSegment } from '@/lib/segmentUtils';
import SegmentModal from './SegmentModal';
import StationModal from './StationModal';
import { CheckCircle2, Radio, ArrowRight, Circle, ArrowDown, TrainFront, Compass, MapPin } from 'lucide-react';
import { clsx } from 'clsx';

interface StationTimelineProps {
  stations: Station[];
  currentStationCode: string;
  liveStatus?: LiveStatus | null;
  totalDistanceKm?: number;
}

export default function StationTimeline({
  stations,
  currentStationCode,
  liveStatus,
  totalDistanceKm = 0,
}: StationTimelineProps) {
  const [selectedSegment, setSelectedSegment] = useState<RouteSegment | null>(null);
  const [selectedStation, setSelectedStation] = useState<{ station: Station; type: 'current' | 'next' | 'completed' | 'upcoming' } | null>(null);

  // Filter ONLY stopping stations (No non-stop / intermediate pass-through stations)
  const stoppingStations = (stations || []).filter(
    (station) => station.isStoppingStation !== false && station.isHalt !== false
  );

  if (!stoppingStations || stoppingStations.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl shadow-gray-200/50">
        <p className="text-lg font-bold text-gray-800">Train stop information unavailable</p>
        <p className="mt-1 text-xs text-gray-500 font-medium">
          Unable to load scheduled stopping stations for this train.
        </p>
      </div>
    );
  }

  // Determine active stopping station index
  const currentIdx = stoppingStations.findIndex((s) => s.code === currentStationCode);
  const effectiveCurrentIdx = currentIdx !== -1 ? currentIdx : stoppingStations.findIndex((s) => !s.passed);
  const activeIdx = effectiveCurrentIdx !== -1 ? effectiveCurrentIdx : stoppingStations.length - 1;

  // Calculate station-to-station segments
  const effectiveTotalDistance = totalDistanceKm || stoppingStations[stoppingStations.length - 1]?.distanceKm || 1000;
  const segments = calculateRouteSegments(stoppingStations, liveStatus || null, effectiveTotalDistance);

  // Overall journey metrics
  const progressPercent = liveStatus?.progressPercentage ?? (activeIdx / Math.max(1, stoppingStations.length - 1)) * 100;
  const coveredKm = Math.round((effectiveTotalDistance * progressPercent) / 100);
  const remainingKm = Math.max(0, effectiveTotalDistance - coveredKm);

  return (
    <div className="space-y-6">
      {/* 1. HORIZONTAL INTERACTIVE "WHERE IS MY TRAIN" TRACK BAR */}
      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-500/10 space-y-6">
        <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
              <TrainFront className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full">
                Interactive Route Progress
              </span>
              <h2 className="text-xl font-black text-gray-900 mt-0.5">
                Live Train Position & Segment Tracker
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-gray-700 bg-gray-50 px-3.5 py-1.5 rounded-2xl border border-gray-100">
            <span>Covered: <strong className="text-blue-600">{coveredKm} km</strong></span>
            <span>•</span>
            <span>Remaining: <strong className="text-indigo-600">{remainingKm} km</strong></span>
            <span>•</span>
            <span className="text-green-600">{Math.round(progressPercent)}% Journey</span>
          </div>
        </div>

        {/* Scrollable Horizontal Track Line */}
        <div className="relative py-8 overflow-x-auto scrollbar-none">
          <div className="min-w-[650px] px-6">
            {/* The Main Route Line */}
            <div className="relative h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-green-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />

              {/* LIVE TRAIN MARKER ON ROUTE LINE */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-500 cursor-pointer group"
                style={{ left: `${Math.min(98, Math.max(2, progressPercent))}%` }}
                onClick={() => {
                  const currentSeg = segments.find((s) => s.isCurrentSegment) || segments[0];
                  if (currentSeg) setSelectedSegment(currentSeg);
                }}
              >
                <div className="relative flex flex-col items-center">
                  <span className="absolute -top-7 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black text-white shadow-md animate-bounce whitespace-nowrap">
                    🚆 LIVE ({Math.round(progressPercent)}%)
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/40 ring-4 ring-blue-100 group-hover:scale-110 transition-transform">
                    <TrainFront className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Station Dots along horizontal track */}
              <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                {stoppingStations.map((st, i) => {
                  const isCurrent = i === activeIdx;
                  const isPassed = i < activeIdx || st.passed;
                  const stPercent = (i / Math.max(1, stoppingStations.length - 1)) * 100;

                  return (
                    <div
                      key={st.code}
                      className="pointer-events-auto absolute -translate-x-1/2 cursor-pointer group"
                      style={{ left: `${stPercent}%` }}
                      onClick={() => {
                        const type = isCurrent ? 'current' : i === activeIdx + 1 ? 'next' : isPassed ? 'completed' : 'upcoming';
                        setSelectedStation({ station: st, type });
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={clsx(
                            'h-4 w-4 rounded-full border-2 transition-transform group-hover:scale-125',
                            isCurrent
                              ? 'border-blue-600 bg-blue-600 ring-4 ring-blue-200'
                              : isPassed
                              ? 'border-green-600 bg-green-600'
                              : 'border-gray-300 bg-white'
                          )}
                        />
                        <span className="mt-2 text-[10px] font-black text-gray-700 group-hover:text-blue-600 whitespace-nowrap">
                          {st.code}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] font-semibold text-gray-400 text-center">
          💡 Click any station node or segment on the line to inspect real live train distance, speed & ETAs.
        </p>
      </div>

      {/* 2. VERTICAL DETAILED STOPPING STATIONS TIMELINE */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl shadow-gray-200/50">
        <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-5 mb-8 gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Complete Stopping Station Timeline
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Showing only {stoppingStations.length} actual scheduled halts (intermediate pass-throughs excluded)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-green-700 border border-green-200">
              ✓ COMPLETED
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-blue-800 border border-blue-300 animate-pulse">
              🟢 LIVE CURRENT
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700 border border-indigo-200">
              → NEXT
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 border border-gray-200">
              ○ UPCOMING
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {stoppingStations.map((station, idx) => {
            const isCurrent = idx === activeIdx;
            const isNext = idx === activeIdx + 1;
            const isPassed = idx < activeIdx || station.passed === true;
            const segmentForNext = segments[idx];

            // Station status configuration
            let statusBadge: {
              label: string;
              bg: string;
              dotIcon: React.ReactNode;
              type: 'current' | 'next' | 'completed' | 'upcoming';
            } = {
              label: '○ UPCOMING',
              bg: 'bg-gray-100 text-gray-600 border-gray-200',
              dotIcon: <Circle className="h-3.5 w-3.5 text-gray-400" />,
              type: 'upcoming',
            };

            if (isCurrent) {
              statusBadge = {
                label: '🟢 CURRENT / LIVE',
                bg: 'bg-blue-600 text-white font-bold border-blue-600 shadow-md shadow-blue-500/30',
                dotIcon: <Radio className="h-3.5 w-3.5 animate-pulse text-white" />,
                type: 'current' as const,
              };
            } else if (isNext) {
              statusBadge = {
                label: '→ NEXT',
                bg: 'bg-indigo-100 text-indigo-800 font-bold border-indigo-300',
                dotIcon: <ArrowRight className="h-3.5 w-3.5 text-indigo-600" />,
                type: 'next' as const,
              };
            } else if (isPassed) {
              statusBadge = {
                label: '✓ COMPLETED',
                bg: 'bg-green-100 text-green-800 font-semibold border-green-200',
                dotIcon: <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />,
                type: 'completed' as const,
              };
            }

            return (
              <React.Fragment key={station.code}>
                {/* Clickable Route Segment Line between Stations */}
                {idx > 0 && segmentForNext && (
                  <div className="flex items-center justify-center my-2">
                    <button
                      onClick={() => setSelectedSegment(segmentForNext)}
                      className={clsx(
                        'flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full border shadow-2xs transition-all hover:scale-105 group',
                        segmentForNext.isCurrentSegment
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30 animate-pulse'
                          : segmentForNext.isCompleted
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      )}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                      <span>
                        Segment: {segmentForNext.startStation.code} → {segmentForNext.endStation.code} ({segmentForNext.distanceKm} km)
                      </span>
                      {segmentForNext.isCurrentSegment && (
                        <span className="rounded-full bg-white text-blue-600 px-2 py-0.2 text-[10px] font-black">
                          {segmentForNext.segmentProgressPercent}%
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* Clickable Stopping Station Card */}
                <div
                  onClick={() => setSelectedStation({ station, type: statusBadge.type })}
                  className={clsx(
                    'relative rounded-3xl border p-6 cursor-pointer transition-all duration-200 hover:shadow-xl',
                    isCurrent
                      ? 'border-blue-500 bg-blue-50/70 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20'
                      : isNext
                      ? 'border-indigo-200 bg-indigo-50/40 shadow-sm'
                      : isPassed
                      ? 'border-gray-100 bg-gray-50/40'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  )}
                >
                  {/* Station Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-2xs border border-gray-200 shrink-0">
                        {statusBadge.dotIcon}
                      </div>
                      <div>
                        <span className="font-extrabold text-gray-900 text-lg tracking-tight">
                          {station.name}
                        </span>
                        <span className="ml-2 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">
                          {station.code}
                        </span>
                        {station.platform && (
                          <span className="ml-2 text-xs font-semibold text-gray-500">
                            PF #{station.platform}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {station.delayMinutes !== undefined && (
                        <span
                          className={clsx(
                            'rounded-full px-2.5 py-0.5 text-xs font-bold',
                            station.delayMinutes === 0
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-800'
                          )}
                        >
                          {station.delayMinutes === 0 ? 'On Time' : `+${station.delayMinutes}m delay`}
                        </span>
                      )}

                      <span className={clsx('rounded-full border px-3 py-1 text-xs tracking-wide', statusBadge.bg)}>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Scheduled vs Actual Timings */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-medium">
                    <div className="rounded-xl bg-white p-2.5 border border-gray-100 shadow-2xs">
                      <span className="text-gray-400 block text-[10px] font-bold uppercase">Distance</span>
                      <span className="font-extrabold text-gray-900 text-sm">{station.distanceKm} km</span>
                    </div>

                    <div className="rounded-xl bg-white p-2.5 border border-gray-100 shadow-2xs">
                      <span className="text-gray-400 block text-[10px] font-bold uppercase">Sched. Arrival</span>
                      <span className="font-bold text-gray-800 text-sm">{station.arrivalTime || '--:--'}</span>
                    </div>

                    <div className="rounded-xl bg-white p-2.5 border border-gray-100 shadow-2xs">
                      <span className="text-gray-400 block text-[10px] font-bold uppercase">Sched. Departure</span>
                      <span className="font-bold text-gray-800 text-sm">{station.departureTime || '--:--'}</span>
                    </div>

                    <div className="rounded-xl bg-white p-2.5 border border-gray-100 shadow-2xs">
                      <span className="text-gray-400 block text-[10px] font-bold uppercase">Actual Arrival</span>
                      <span className={clsx('font-bold text-sm', isPassed ? 'text-green-600' : 'text-gray-700')}>
                        {station.actualArrival || station.arrivalTime || '--:--'}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white p-2.5 border border-gray-100 shadow-2xs">
                      <span className="text-gray-400 block text-[10px] font-bold uppercase">Actual Departure</span>
                      <span className={clsx('font-bold text-sm', isPassed ? 'text-green-600' : 'text-gray-700')}>
                        {station.actualDeparture || station.departureTime || '--:--'}
                      </span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Segment Info Modal / Bottom Sheet */}
      <SegmentModal
        segment={selectedSegment}
        onClose={() => setSelectedSegment(null)}
      />

      {/* Station Detail Modal / Bottom Sheet */}
      <StationModal
        station={selectedStation?.station || null}
        statusType={selectedStation?.type || 'upcoming'}
        onClose={() => setSelectedStation(null)}
      />
    </div>
  );
}
