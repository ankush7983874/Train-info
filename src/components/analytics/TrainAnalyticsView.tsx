'use client';

import React from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useLiveTracking } from '@/hooks/useTracking';
import SearchBar from '@/components/search/SearchBar';
import {
  BarChart3,
  Loader2,
  AlertCircle,
  Train,
  Clock,
  CheckCircle2,
  Navigation2,
  Percent,
  Gauge,
  MapPin,
  RefreshCw,
  TrendingUp,
  Mountain,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { clsx } from 'clsx';

interface TrainAnalyticsViewProps {
  trainNumber: string;
}

export default function TrainAnalyticsView({ trainNumber }: TrainAnalyticsViewProps) {
  const { liveStatus, isLoadingStatus, refetchStatus } = useLiveTracking(trainNumber);
  const { data: analytics, isLoading: isLoadingAnalytics, isError } = useAnalytics(trainNumber);

  if (isLoadingStatus || isLoadingAnalytics) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-gray-500">
          Loading dynamic analytics for Train #{trainNumber}...
        </p>
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Analytics Unavailable</h2>
        <p className="text-xs text-gray-500 max-w-md">
          Unable to fetch real-time analytics for train #{trainNumber}. Please try searching another train.
        </p>
        <div className="w-full max-w-md pt-2">
          <SearchBar />
        </div>
      </div>
    );
  }

  // Derive metrics
  const trainName = liveStatus?.trainName || analytics.trainName || `Train ${trainNumber}`;
  const totalStops = analytics.totalStops ?? 8;
  const completedStops = analytics.completedStops ?? 0;
  const currentStopIndex = analytics.currentStopIndex ?? (completedStops > 0 ? completedStops : 1);
  const remainingStops = analytics.remainingStops ?? Math.max(0, totalStops - completedStops);

  const delayTrend = analytics.delayTrend || [];
  const delayedStopsCount = delayTrend.filter((d) => d.delayMinutes > 0).length;
  const onTimeStopsCount = Math.max(0, delayTrend.length - delayedStopsCount);

  const totalDistance = analytics.totalDistanceKm || 1451;
  const coveredDistance = analytics.distanceCoveredKm || 0;
  const remainingDistance = analytics.remainingDistanceKm || Math.max(0, totalDistance - coveredDistance);
  const progressPct = analytics.completionPercentage || Math.round((coveredDistance / totalDistance) * 100);

  const currentDelay = liveStatus?.delayMinutes ?? analytics.currentDelayMinutes ?? 0;
  const lastUpdatedText = liveStatus?.lastUpdated
    ? new Date(liveStatus.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-8 py-4 max-w-5xl mx-auto">
      {/* Top Search & Refresh */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-auto flex-1 max-w-lg">
          <SearchBar placeholder={`Switch train (currently viewing #${trainNumber})...`} />
        </div>

        <button
          onClick={() => refetchStatus()}
          className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
          <span>Sync Live Data</span>
        </button>
      </div>

      {/* Main Journey Header Card */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl shadow-gray-200/50">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
              <Train className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {trainName}
                </h1>
                <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-extrabold text-gray-700">
                  #{trainNumber}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                  LIVE ANALYTICS
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Last updated at {lastUpdatedText} • Auto-refreshes every 30s
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={clsx(
                'rounded-full px-3 py-1 text-xs font-extrabold',
                currentDelay === 0
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              )}
            >
              {currentDelay === 0 ? '✓ Running On Time' : `+${currentDelay} min Delay`}
            </span>
          </div>
        </div>

        {/* Live Journey Overview Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Previous Station */}
          <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase block">Previous Halt</span>
            <div className="mt-1.5 text-base font-extrabold text-gray-900 truncate">
              {liveStatus?.previousStation?.name || 'Origin Station'}
            </div>
            <div className="mt-1 text-xs text-gray-500 font-semibold">
              Code: {liveStatus?.previousStation?.code || 'SRC'}
            </div>
          </div>

          {/* Current Station */}
          <div className="rounded-2xl bg-blue-50/80 p-4 border border-blue-200 ring-2 ring-blue-500/20">
            <span className="text-xs font-extrabold text-blue-700 uppercase block flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
              🟢 Current Station
            </span>
            <div className="mt-1.5 text-base font-black text-gray-900 truncate">
              {liveStatus?.currentStation.name || 'In Transit'}
            </div>
            <div className="mt-1 text-xs text-blue-600 font-bold">
              Departed / Active
            </div>
          </div>

          {/* Next Station */}
          <div className="rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100">
            <span className="text-xs font-bold text-indigo-700 uppercase block flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
              Next Scheduled Stop
            </span>
            <div className="mt-1.5 text-base font-extrabold text-gray-900 truncate">
              {liveStatus?.nextStation.name || 'Destination'}
            </div>
            <div className="mt-1 text-xs text-indigo-700 font-semibold">
              ETA: {liveStatus?.nextStation.eta || '--:--'} ({liveStatus?.nextStation.distanceRemainingKm || 0} km)
            </div>
          </div>
        </div>
      </div>

      {/* Stopping Station Analytics Section */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl shadow-gray-200/50 space-y-4">
        <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          Scheduled Stop Analytics (Actual Stopping Stations Only)
        </h2>
        <p className="text-xs text-gray-500 font-medium">
          Passing and intermediate stations are excluded from these counts.
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 text-center">
            <span className="text-xs font-bold text-gray-500 uppercase block">Total Halts</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">{totalStops}</span>
            <span className="text-[11px] text-gray-400 font-medium">Stops</span>
          </div>

          <div className="rounded-2xl bg-green-50/60 p-4 border border-green-100 text-center">
            <span className="text-xs font-bold text-green-700 uppercase block">Completed</span>
            <span className="text-2xl font-black text-green-700 mt-1 block">{completedStops}</span>
            <span className="text-[11px] text-green-600 font-medium">Halts passed</span>
          </div>

          <div className="rounded-2xl bg-blue-50 p-4 border border-blue-200 text-center ring-2 ring-blue-500/20">
            <span className="text-xs font-bold text-blue-700 uppercase block">Current Stop</span>
            <span className="text-2xl font-black text-blue-700 mt-1 block">#{currentStopIndex}</span>
            <span className="text-[11px] text-blue-600 font-medium">Active halt</span>
          </div>

          <div className="rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100 text-center">
            <span className="text-xs font-bold text-indigo-700 uppercase block">Remaining</span>
            <span className="text-2xl font-black text-indigo-700 mt-1 block">{remainingStops}</span>
            <span className="text-[11px] text-indigo-600 font-medium">Upcoming halts</span>
          </div>

          <div className="rounded-2xl bg-amber-50/60 p-4 border border-amber-100 text-center">
            <span className="text-xs font-bold text-amber-700 uppercase block">Delayed Halts</span>
            <span className="text-2xl font-black text-amber-700 mt-1 block">{delayedStopsCount}</span>
            <span className="text-[11px] text-amber-600 font-medium">Halts late</span>
          </div>

          <div className="rounded-2xl bg-emerald-50/60 p-4 border border-emerald-100 text-center">
            <span className="text-xs font-bold text-emerald-700 uppercase block">On-Time Halts</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{onTimeStopsCount}</span>
            <span className="text-[11px] text-emerald-600 font-medium">Halts on time</span>
          </div>
        </div>
      </div>

      {/* Journey Progress Section */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl shadow-gray-200/50 space-y-6">
        <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <Percent className="h-5 w-5 text-blue-600" />
          Journey Progress & Distance Metrics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase block">Completed Distance</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">{coveredDistance} km</span>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase block">Remaining Distance</span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">{remainingDistance} km</span>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase block">Total Distance</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">{totalDistance} km</span>
          </div>

          <div className="rounded-2xl bg-blue-50/80 p-4 border border-blue-100">
            <span className="text-xs font-bold text-blue-700 uppercase block">Completion Rate</span>
            <span className="text-2xl font-black text-blue-700 mt-1 block">{progressPct}%</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div>
          <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
            <span>Progress along route</span>
            <span>{progressPct}% Completed</span>
          </div>
          <div className="h-4 w-full rounded-full bg-gray-100 p-0.5 overflow-hidden border border-gray-200/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-700 transition-all duration-700 ease-out shadow-sm shadow-blue-500/50"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Delay Analytics Section */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl shadow-gray-200/50 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Delay Trend at Scheduled Halts
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Live delay minutes recorded at stopping stations for #{trainNumber}
            </p>
          </div>

          <span
            className={clsx(
              'rounded-full px-3 py-1 text-xs font-bold',
              currentDelay === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'
            )}
          >
            {currentDelay === 0 ? 'Running On Time' : `+${currentDelay} mins Delay`}
          </span>
        </div>

        {delayTrend.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={delayTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="stationCode" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} unit="m" />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: any) => [`+${value} mins`, 'Delay']}
                  labelFormatter={(label: any) => `Station: ${label}`}
                />
                <Line type="monotone" dataKey="delayMinutes" stroke="#F59E0B" strokeWidth={3} dot={{ r: 5, fill: '#F59E0B' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm font-medium text-gray-500 border border-gray-100">
            Delay history will appear as live updates are collected.
          </div>
        )}
      </div>

      {/* Elevation Profile Section */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl shadow-gray-200/50 space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Mountain className="h-5 w-5 text-emerald-600" />
            Topographical Elevation Profile
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Peak elevation: {analytics.highestElevationLocation || `${analytics.highestElevationM}m`}
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.elevationProfile} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="distanceKm" tick={{ fill: '#64748B', fontSize: 12 }} unit=" km" axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} unit="m" />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: any) => [`${value} meters`, 'Altitude']}
                labelFormatter={(label: any) => `Distance: ${label} km`}
              />
              <Area type="monotone" dataKey="elevationM" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#elevationGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
