'use client';

import React, { useState } from 'react';
import { Station } from '@/types/train';
import { getStationFacilities, getNearbyPlaces } from '@/lib/journeyContext';
import { MapPin, Clock, CheckCircle2, Radio, ArrowRight, Circle, X, ShieldAlert, Coffee, Utensils, Wifi, Hotel, Hospital, Landmark, Car } from 'lucide-react';
import { clsx } from 'clsx';

interface StationModalProps {
  station: Station | null;
  statusType: 'current' | 'next' | 'completed' | 'upcoming';
  onClose: () => void;
}

export default function StationModal({ station, statusType, onClose }: StationModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'facilities' | 'nearby'>('info');
  if (!station) return null;

  let badgeConfig = {
    label: '○ UPCOMING STATION',
    bg: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <Circle className="h-4 w-4 text-gray-400" />,
  };

  if (statusType === 'current') {
    badgeConfig = {
      label: '🟢 LIVE CURRENT STATION',
      bg: 'bg-blue-600 text-white font-bold border-blue-600 shadow-md shadow-blue-500/30',
      icon: <Radio className="h-4 w-4 animate-pulse text-white" />,
    };
  } else if (statusType === 'next') {
    badgeConfig = {
      label: '🔵 NEXT STOPPING STATION',
      bg: 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-md shadow-indigo-500/30',
      icon: <ArrowRight className="h-4 w-4 text-white" />,
    };
  } else if (statusType === 'completed') {
    badgeConfig = {
      label: '✓ COMPLETED STATION',
      bg: 'bg-green-100 text-green-800 font-bold border-green-200',
      icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    };
  }

  // Calculate Halt duration if available
  let haltDuration = 'N/A';
  if (station.arrivalTime && station.departureTime && station.arrivalTime !== '--:--' && station.departureTime !== '--:--') {
    try {
      const [aH, aM] = station.arrivalTime.split(':').map(Number);
      const [dH, dM] = station.departureTime.split(':').map(Number);
      const diff = (dH * 60 + dM) - (aH * 60 + aM);
      if (diff > 0 && diff < 120) {
        haltDuration = `${diff} mins`;
      } else if (diff === 0) {
        haltDuration = '1 min (Technical)';
      }
    } catch {
      haltDuration = 'N/A';
    }
  }

  const facilities = getStationFacilities(station);
  const nearbyPlaces = getNearbyPlaces(station);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-10 sm:zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                Station Guide #{station.code}
              </span>
              <h3 className="text-xl font-black text-gray-900 mt-0.5">{station.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('info')}
            className={clsx('flex-1 py-1.5 rounded-lg transition-all', activeTab === 'info' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-500 hover:text-gray-900')}
          >
            Timings & Platform
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={clsx('flex-1 py-1.5 rounded-lg transition-all', activeTab === 'facilities' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-500 hover:text-gray-900')}
          >
            Station Facilities
          </button>
          <button
            onClick={() => setActiveTab('nearby')}
            className={clsx('flex-1 py-1.5 rounded-lg transition-all', activeTab === 'nearby' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-500 hover:text-gray-900')}
          >
            Nearby Places
          </button>
        </div>

        {/* Tab 1: Timings & Platform */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className={clsx('flex items-center justify-between p-3.5 rounded-2xl border text-xs font-extrabold', badgeConfig.bg)}>
              <div className="flex items-center gap-2">
                {badgeConfig.icon}
                <span>{badgeConfig.label}</span>
              </div>
              {station.platform ? (
                <span className="rounded-lg bg-white/20 px-2.5 py-0.5 text-xs font-black">
                  Platform {station.platform}
                </span>
              ) : (
                <span className="text-[10px] font-medium opacity-80">Platform info unavailable</span>
              )}
            </div>

            {/* Station Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Route Distance</span>
                <span className="text-base font-black text-gray-900 mt-0.5 block">{station.distanceKm} km</span>
              </div>

              <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Halt Duration</span>
                <span className="text-base font-black text-indigo-600 mt-0.5 block">{haltDuration}</span>
              </div>

              <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Sched. Arrival</span>
                <span className="text-sm font-bold text-gray-900 mt-0.5 block">{station.arrivalTime || '--:--'}</span>
              </div>

              <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Sched. Departure</span>
                <span className="text-sm font-bold text-gray-900 mt-0.5 block">{station.departureTime || '--:--'}</span>
              </div>

              <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Actual Arrival</span>
                <span className="text-sm font-bold text-green-600 mt-0.5 block">
                  {station.actualArrival || station.arrivalTime || '--:--'}
                </span>
              </div>

              <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Actual Departure</span>
                <span className="text-sm font-bold text-green-600 mt-0.5 block">
                  {station.actualDeparture || station.departureTime || '--:--'}
                </span>
              </div>
            </div>

            {/* Delay Status */}
            {station.delayMinutes !== undefined && (
              <div className={clsx(
                'flex items-center justify-between p-3 rounded-2xl border text-xs font-bold',
                station.delayMinutes === 0 ? 'bg-green-50 text-green-800 border-green-200' : 'bg-amber-50 text-amber-900 border-amber-200'
              )}>
                <span>Train Delay at Station</span>
                <span>{station.delayMinutes === 0 ? 'On Time' : `+${station.delayMinutes} min delay`}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Station Facilities */}
        {activeTab === 'facilities' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2.5">
              {facilities.map((fac) => (
                <div key={fac.id} className="flex items-start gap-3 rounded-2xl bg-gray-50 p-3 border border-gray-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shrink-0 font-bold">
                    <Utensils className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{fac.name}</span>
                      <span className={clsx('rounded-full px-2 py-0.2 text-[9px] font-black', fac.available ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600')}>
                        {fac.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">{fac.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Nearby Places */}
        {activeTab === 'nearby' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2.5">
              {nearbyPlaces.map((place) => (
                <div key={place.id} className="flex items-start justify-between rounded-2xl bg-gray-50 p-3 border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 shrink-0 font-bold">
                      <Landmark className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">{place.name}</span>
                      <p className="text-[11px] text-gray-500 font-medium">{place.description}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[10px] font-black shrink-0">
                    {place.distanceKm} km
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

