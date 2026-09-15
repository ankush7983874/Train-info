'use client';

import React from 'react';
import { useWeather } from '@/hooks/useWeather';
import { CloudSun, Wind, Droplets, Umbrella, MapPin, Compass } from 'lucide-react';

export default function WeatherCard() {
  const { data: currentWeather, isLoading: loadingCurrent } = useWeather('current');
  const { data: destWeather, isLoading: loadingDest } = useWeather('destination');

  if (loadingCurrent || loadingDest || !currentWeather || !destWeather) {
    return (
      <div className="h-44 w-full animate-pulse rounded-3xl bg-gray-100 p-6" />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Current Location Weather */}
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-gray-200/40 transition-all hover:shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Location</span>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
            {currentWeather.locationName}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-3xl font-black text-gray-900">{currentWeather.tempC}°C</div>
            <p className="text-xs font-semibold text-gray-500">{currentWeather.condition}</p>
          </div>
          <CloudSun className="h-12 w-12 text-amber-500" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-blue-500" />
            <span>{currentWeather.humidity}% Hum.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind className="h-3.5 w-3.5 text-indigo-500" />
            <span>{currentWeather.windKmH} km/h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Umbrella className="h-3.5 w-3.5 text-purple-500" />
            <span>{currentWeather.rainProbPercentage}% Rain</span>
          </div>
        </div>
      </div>

      {/* Destination Weather */}
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-gray-200/40 transition-all hover:shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Destination Forecast</span>
          </div>
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
            {destWeather.locationName}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-3xl font-black text-gray-900">{destWeather.tempC}°C</div>
            <p className="text-xs font-semibold text-gray-500">{destWeather.condition}</p>
          </div>
          <CloudSun className="h-12 w-12 text-orange-500" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-blue-500" />
            <span>{destWeather.humidity}% Hum.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind className="h-3.5 w-3.5 text-indigo-500" />
            <span>{destWeather.windKmH} km/h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Umbrella className="h-3.5 w-3.5 text-purple-500" />
            <span>{destWeather.rainProbPercentage}% Rain</span>
          </div>
        </div>
      </div>
    </div>
  );
}
