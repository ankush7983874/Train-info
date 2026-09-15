'use client';

import React, { useState } from 'react';
import { JourneyContext } from '@/types/ai';
import { Building2, Utensils, Armchair, Landmark, Navigation, MapPin, CheckCircle2, XCircle, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface StationGuideCardProps {
  context: JourneyContext;
}

export default function StationGuideCard({ context }: StationGuideCardProps) {
  const [activeTab, setActiveTab] = useState<'facilities' | 'nearby'>('facilities');
  const guide = context.stationGuide;

  if (!guide) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50">
        <div className="flex items-center gap-2 text-gray-400 text-sm font-semibold">
          <Building2 className="h-5 w-5" />
          <span>Station guide unavailable (Select a train station)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 space-y-6">
      {/* Station Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Station Guide
            </span>
            <span className="text-xs font-semibold text-gray-400">Code: {guide.stationCode}</span>
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 mt-1">{guide.stationName}</h3>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-full bg-gray-100 p-1 border border-gray-200/60">
          <button
            onClick={() => setActiveTab('facilities')}
            className={clsx(
              'rounded-full px-4 py-1.5 text-xs font-extrabold transition-all',
              activeTab === 'facilities'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Station Facilities
          </button>
          <button
            onClick={() => setActiveTab('nearby')}
            className={clsx(
              'rounded-full px-4 py-1.5 text-xs font-extrabold transition-all',
              activeTab === 'nearby'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Nearby Places
          </button>
        </div>
      </div>

      {/* Facilities Tab */}
      {activeTab === 'facilities' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guide.facilities.map((fac) => (
            <div
              key={fac.id}
              className={clsx(
                'flex items-start gap-3 rounded-2xl border p-3.5 transition-all',
                fac.available
                  ? 'bg-blue-50/30 border-blue-100 text-gray-900'
                  : 'bg-gray-50 border-gray-100 text-gray-400'
              )}
            >
              {fac.available ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-xs">{fac.name}</h4>
                {fac.description && (
                  <p className="text-[11px] font-medium text-gray-500 mt-0.5 leading-tight">
                    {fac.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nearby Places Tab */}
      {activeTab === 'nearby' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {guide.nearbyPlaces.map((place) => (
            <div
              key={place.id}
              className="flex items-start justify-between rounded-2xl border border-gray-100 bg-gray-50/50 p-4 transition-all hover:bg-white hover:shadow-md"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-gray-900">{place.name}</h4>
                </div>
                <p className="text-xs text-gray-500 font-medium">{place.description}</p>
                <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 capitalize">
                  {place.category}
                </span>
              </div>

              <div className="shrink-0 rounded-xl bg-white border border-gray-200 px-2.5 py-1 text-center shadow-2xs">
                <span className="block text-xs font-black text-blue-600">{place.distanceKm}</span>
                <span className="block text-[9px] font-bold text-gray-400 uppercase">km away</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
