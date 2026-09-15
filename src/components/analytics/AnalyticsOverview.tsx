'use client';

import React from 'react';
import { JourneyAnalytics } from '@/types/analytics';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { TrendingUp, Mountain, Navigation2, Percent, Gauge, MapPin, CheckCircle2, Clock } from 'lucide-react';

interface AnalyticsOverviewProps {
  analytics: JourneyAnalytics;
}

export default function AnalyticsOverview({ analytics }: AnalyticsOverviewProps) {
  const totalStops = analytics.totalStops ?? 8;
  const completedStops = analytics.completedStops ?? 5;
  const currentStop = analytics.currentStopIndex ?? completedStops + 1;
  const remainingStops = analytics.remainingStops ?? Math.max(0, totalStops - completedStops);

  return (
    <div className="space-y-6">
      {/* Stopping Station Analytics Cards Grid */}
      <div className="rounded-3xl border border-blue-100 bg-blue-50/40 p-6 shadow-lg shadow-blue-500/5">
        <h3 className="text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-blue-600" />
          Stopping Station Analytics (Actual Scheduled Halts Only)
        </h3>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 border border-blue-100 shadow-2xs">
            <span className="text-xs font-bold text-gray-400 uppercase block">Total Stops</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">{totalStops}</span>
            <span className="text-[11px] text-gray-500 font-medium">Scheduled halts</span>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-green-100 shadow-2xs">
            <span className="text-xs font-bold text-green-600 uppercase block flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed
            </span>
            <span className="text-2xl font-black text-green-700 mt-1 block">{completedStops}</span>
            <span className="text-[11px] text-green-600 font-medium">Halts departed</span>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-blue-200 shadow-2xs ring-2 ring-blue-500/20">
            <span className="text-xs font-bold text-blue-600 uppercase block flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
              Current Stop
            </span>
            <span className="text-2xl font-black text-blue-700 mt-1 block">#{currentStop}</span>
            <span className="text-[11px] text-blue-600 font-medium">Active halt</span>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-indigo-100 shadow-2xs">
            <span className="text-xs font-bold text-indigo-600 uppercase block flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Remaining
            </span>
            <span className="text-2xl font-black text-indigo-700 mt-1 block">{remainingStops}</span>
            <span className="text-[11px] text-indigo-600 font-medium">Upcoming halts</span>
          </div>
        </div>
      </div>

      {/* Analytics Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Completion % */}
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-gray-200/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completion</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-gray-900">{analytics.completionPercentage}%</div>
          <p className="mt-1 text-xs font-medium text-gray-500">
            {analytics.distanceCoveredKm} of {analytics.totalDistanceKm} km completed
          </p>
        </div>

        {/* Remaining Distance */}
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-gray-200/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Remaining</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Navigation2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-gray-900">{analytics.remainingDistanceKm} km</div>
          <p className="mt-1 text-xs font-medium text-gray-500">Distance to destination</p>
        </div>

        {/* Highest Elevation */}
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-gray-200/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Peak Elevation</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Mountain className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-gray-900">{analytics.highestElevationM} m</div>
          <p className="mt-1 text-xs font-medium text-gray-500 truncate">{analytics.highestElevationLocation}</p>
        </div>

        {/* Avg & Peak Speed */}
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-gray-200/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Speed</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Gauge className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-gray-900">{analytics.avgSpeedKmH} km/h</div>
          <p className="mt-1 text-xs font-medium text-gray-500">Max speed recorded: {analytics.maxSpeedKmH} km/h</p>
        </div>
      </div>

      {/* Delay Trend Chart */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Delay Trend Along Scheduled Halts</h3>
            <p className="text-xs text-gray-500 font-medium">Minutes delayed at stopping station checkpoints</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <TrendingUp className="h-3.5 w-3.5" />
            Delay Profile
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.delayTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
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
      </div>

      {/* Elevation Profile Chart */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">Elevation Profile (Topography)</h3>
          <p className="text-xs text-gray-500 font-medium">Route terrain height across distance covered</p>
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
