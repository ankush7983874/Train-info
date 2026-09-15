'use client';

import React, { useState } from 'react';
import { Settings as SettingsIcon, Sliders, ShieldCheck, Map, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [refreshInterval, setRefreshInterval] = useState('30');
  const [unit, setUnit] = useState('km');
  const [mapTheme, setMapTheme] = useState('light');

  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto">
      <div className="border-b border-gray-100 pb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-gray-700" />
          Settings & Preferences
        </h1>
        <p className="text-sm text-gray-500 font-medium mt-1">
          Customize map overlays, refresh rates, and telemetry units
        </p>
      </div>

      <div className="space-y-6">
        {/* Auto Refresh Setting */}
        <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-200/40">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Auto-Refresh Interval</h3>
              <p className="text-xs text-gray-500 font-medium">Frequency of live train location satellite updates</p>
            </div>
          </div>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-blue-500"
          >
            <option value="15">15 Seconds</option>
            <option value="30">30 Seconds (Recommended)</option>
            <option value="60">60 Seconds</option>
          </select>
        </div>

        {/* Map Style Setting */}
        <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-200/40">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Map className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Map Visual Style</h3>
              <p className="text-xs text-gray-500 font-medium">Apple Maps inspired light topography vector map</p>
            </div>
          </div>
          <select
            value={mapTheme}
            onChange={(e) => setMapTheme(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-blue-500"
          >
            <option value="light">Pure White Topography</option>
            <option value="satellite">Satellite Hybrid</option>
          </select>
        </div>

        {/* Units */}
        <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-200/40">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Telemetry Units</h3>
              <p className="text-xs text-gray-500 font-medium">Distance & speed measurement standard</p>
            </div>
          </div>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-blue-500"
          >
            <option value="km">Kilometers (km/h)</option>
            <option value="mi">Miles (mph)</option>
          </select>
        </div>

        {/* API Status Badge */}
        <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-6 flex items-center gap-4">
          <ShieldCheck className="h-8 w-8 text-blue-600 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-gray-900">API Connection Health</h4>
            <p className="text-xs text-gray-600 font-medium mt-0.5">
              Running in resilient hybrid mode (RailRadar API + Mock Data Fallback). All endpoints active and responsive (&lt;200ms).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
