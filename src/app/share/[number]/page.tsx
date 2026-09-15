'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { TrainFront, MapPin, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import MapView from '@/components/map/MapView';

async function fetchRoute(trainNumber: string) {
  const res = await fetch(`/api/route/${trainNumber}`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchLive(trainNumber: string) {
  const res = await fetch(`/api/train/live/${trainNumber}`);
  if (!res.ok) return null;
  return res.json();
}

export default function SharedJourneyPage({ params }: { params: Promise<{ number: string }> }) {
  const resolvedParams = use(params);
  const trainNumber = resolvedParams.number;

  const { data: routeInfo } = useQuery({
    queryKey: ['sharedRoute', trainNumber],
    queryFn: () => fetchRoute(trainNumber),
  });

  const { data: liveStatus } = useQuery({
    queryKey: ['sharedLive', trainNumber],
    queryFn: () => fetchLive(trainNumber),
    refetchInterval: 30000,
  });

  const trainName = routeInfo?.trainName || `Train #${trainNumber}`;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Privacy Notice Banner */}
      <div className="flex items-center gap-2 rounded-2xl bg-blue-50 p-4 border border-blue-200 text-xs font-semibold text-blue-800">
        <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
        <span>Public Share View: Only safe train tracking data is displayed. Personal passenger information is hidden.</span>
      </div>

      {/* Header */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl shadow-gray-200/50 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <span className="rounded-md bg-blue-100 px-3 py-1 text-xs font-extrabold text-blue-700">
              LIVE SHARED TRAIN
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-2 sm:text-3xl">
              {trainName} (#{trainNumber})
            </h1>
          </div>

          <Link
            href={`/train/${trainNumber}`}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-blue-700 transition-all"
          >
            Track in Full RailRadar App
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-gray-600">
          <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
            <span className="text-gray-400 block font-bold">Current Station</span>
            <span className="text-sm font-extrabold text-gray-900 mt-0.5 block">
              {liveStatus?.currentStation?.name || 'In Transit'}
            </span>
          </div>

          <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
            <span className="text-gray-400 block font-bold">Next Station</span>
            <span className="text-sm font-extrabold text-blue-600 mt-0.5 block">
              {liveStatus?.nextStation?.name || 'Destination'}
            </span>
          </div>

          <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
            <span className="text-gray-400 block font-bold">Running Delay</span>
            <span className="text-sm font-extrabold text-amber-600 mt-0.5 block">
              {liveStatus ? `${liveStatus.delayMinutes} mins` : 'On Time'}
            </span>
          </div>

          <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
            <span className="text-gray-400 block font-bold">Journey Completed</span>
            <span className="text-sm font-extrabold text-green-600 mt-0.5 block">
              {liveStatus?.journeyProgressPercent || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Shared Route Map */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Live Shared Route Map</h2>
        <div className="w-full overflow-hidden rounded-2xl border border-gray-200">
          <MapView
            coordinates={liveStatus?.coordinates || [77.2195, 28.6429]}
            heading={liveStatus?.heading || 0}
            speedKmH={liveStatus?.speedKmH || 0}
            delayMinutes={liveStatus?.delayMinutes || 0}
            polyline={routeInfo?.polyline || []}
            stations={routeInfo?.stations || []}
            trainName={trainName}
            trainNumber={trainNumber}
            currentStationCode={liveStatus?.currentStation?.code || ''}
            isTopographyAvailable={false}
          />
        </div>
      </div>
    </div>
  );
}
