'use client';

import React from 'react';
import { Landmark } from '@/types/analytics';
import { Waves, Mountain, Landmark as LandmarkIcon, Waypoints, Eye } from 'lucide-react';
import { clsx } from 'clsx';

interface SmartCompanionProps {
  landmarks: Landmark[];
}

export default function SmartCompanion({ landmarks }: SmartCompanionProps) {
  const getIcon = (type: Landmark['type']) => {
    switch (type) {
      case 'river':
        return <Waves className="h-5 w-5 text-cyan-600" />;
      case 'mountain':
        return <Mountain className="h-5 w-5 text-emerald-600" />;
      case 'bridge':
        return <Waypoints className="h-5 w-5 text-indigo-600" />;
      case 'tourist':
      default:
        return <LandmarkIcon className="h-5 w-5 text-amber-600" />;
    }
  };

  const getBgColor = (type: Landmark['type']) => {
    switch (type) {
      case 'river':
        return 'bg-cyan-50 border-cyan-100';
      case 'mountain':
        return 'bg-emerald-50 border-emerald-100';
      case 'bridge':
        return 'bg-indigo-50 border-indigo-100';
      case 'tourist':
      default:
        return 'bg-amber-50 border-amber-100';
    }
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Smart Travel Companion</h2>
          <p className="text-xs text-gray-500 font-medium">Contextual geography, rivers, bridges & local sights</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          <Eye className="h-3.5 w-3.5" />
          {landmarks.length} Landmarks Nearby
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {landmarks.map((item) => (
          <div
            key={item.id}
            className={clsx(
              'flex items-start gap-4 rounded-2xl border p-4 transition-all hover:scale-[1.01]',
              getBgColor(item.type)
            )}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs">
              {getIcon(item.type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-gray-600 uppercase">
                  {item.distanceFromRouteKm} km
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-600 font-medium leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
