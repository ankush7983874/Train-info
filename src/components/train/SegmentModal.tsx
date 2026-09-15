'use client';

import React from 'react';
import { RouteSegment } from '@/lib/segmentUtils';
import { TrainFront, MapPin, Clock, ArrowRight, X, ShieldAlert, Compass } from 'lucide-react';
import { clsx } from 'clsx';

interface SegmentModalProps {
  segment: RouteSegment | null;
  onClose: () => void;
}

export default function SegmentModal({ segment, onClose }: SegmentModalProps) {
  if (!segment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-6 animate-in slide-in-from-bottom-10 sm:zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
              <TrainFront className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full">
                Interactive Segment View
              </span>
              <h3 className="text-lg font-black text-gray-900 mt-0.5">
                {segment.startStation.name} → {segment.endStation.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Segment Status Banner */}
        {segment.isCurrentSegment ? (
          <div className="rounded-2xl bg-blue-50/80 p-4 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600" />
              </span>
              <span className="text-xs font-black text-blue-900 uppercase tracking-wider">
                ACTIVE TRAIN SEGMENT
              </span>
            </div>
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">
              {segment.segmentProgressPercent}% Complete
            </span>
          </div>
        ) : (
          <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-600">
            <span>Segment Status:</span>
            <span className={clsx('font-bold', segment.isCompleted ? 'text-green-600' : 'text-gray-500')}>
              {segment.isCompleted ? '✓ Completed' : '○ Upcoming Segment'}
            </span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
          <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
            <span className="text-gray-400 block font-bold text-[10px] uppercase">Segment Distance</span>
            <span className="text-base font-black text-gray-900 mt-0.5 block">
              {segment.distanceKm} km
            </span>
          </div>

          <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
            <span className="text-gray-400 block font-bold text-[10px] uppercase">Train Position</span>
            <span className="text-base font-black text-blue-600 mt-0.5 block">
              {segment.trainDistanceCoveredInSegmentKm} km from {segment.startStation.code}
            </span>
          </div>

          <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
            <span className="text-gray-400 block font-bold text-[10px] uppercase">Remaining to Next Stop</span>
            <span className="text-base font-black text-indigo-600 mt-0.5 block">
              {segment.trainDistanceRemainingInSegmentKm} km to {segment.endStation.code}
            </span>
          </div>

          <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
            <span className="text-gray-400 block font-bold text-[10px] uppercase">ETA at {segment.endStation.code}</span>
            <span className="text-base font-black text-green-600 mt-0.5 block">
              {segment.etaNextStation || segment.endStation.arrivalTime || '--:--'}
            </span>
          </div>
        </div>

        {/* Progress Bar inside Segment */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-gray-600">
            <span>{segment.startStation.name}</span>
            <span>{segment.segmentProgressPercent}% Segment Progress</span>
            <span>{segment.endStation.name}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
              style={{ width: `${segment.segmentProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Non-invented data disclaimer */}
        <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400 bg-gray-50 p-3 rounded-2xl border border-gray-100">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span>Segment progress is calculated strictly from authoritative provider route geometry.</span>
        </div>
      </div>
    </div>
  );
}
