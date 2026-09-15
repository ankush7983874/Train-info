'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Train, Clock, ArrowRight, MapPin, Zap, AlertCircle, Loader2, Filter, ArrowUpDown } from 'lucide-react';
import { StationTrainResult } from '@/app/api/trains/between/route';
import { useFavoritesStore } from '@/store/favoritesStore';

interface StationSearchResultsProps {
  fromCode: string;
  fromName: string;
  toCode: string;
  toName: string;
  dateStr: string;
  results: StationTrainResult[];
  isLoading: boolean;
  error: string | null;
}

type SortOption = 'earliest' | 'latest' | 'duration';

export default function StationSearchResults({
  fromCode,
  fromName,
  toCode,
  toName,
  dateStr,
  results,
  isLoading,
  error,
}: StationSearchResultsProps) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortOption>('earliest');
  const { addRecentSearch } = useFavoritesStore();

  const sortedResults = useMemo(() => {
    const list = [...results];
    if (sortBy === 'earliest') {
      list.sort((a, b) => (a.fromStation.departureTime || '00:00').localeCompare(b.fromStation.departureTime || '00:00'));
    } else if (sortBy === 'latest') {
      list.sort((a, b) => (b.fromStation.departureTime || '00:00').localeCompare(a.fromStation.departureTime || '00:00'));
    } else if (sortBy === 'duration') {
      list.sort((a, b) => a.durationMinutes - b.durationMinutes);
    }
    return list;
  }, [results, sortBy]);

  const handleSelectTrain = (trainNumber: string) => {
    addRecentSearch(`${trainNumber} (${fromCode}→${toCode})`);
    router.push(`/train/${trainNumber}?from=${fromCode}&to=${toCode}&date=${dateStr}`);
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-lg shadow-gray-200/40 space-y-4">
        <div className="flex items-center justify-center gap-3 text-blue-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="font-bold text-base">Searching available trains between {fromCode} and {toCode}...</span>
        </div>
        <p className="text-xs text-gray-400 font-medium max-w-sm mx-auto">
          Fetching official timetables and verifying station route sequence...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50/70 p-6 text-center shadow-md space-y-2">
        <div className="flex items-center justify-center text-red-600 gap-2 font-bold text-base">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
        <p className="text-xs text-red-600/80 font-medium">
          Please verify your station selection or select a different date.
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-200/80 bg-white p-8 text-center shadow-lg space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 mx-auto">
          <Train className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900">
          No trains found between these stations for the selected date.
        </h3>
        <p className="text-xs text-gray-500 font-medium max-w-md mx-auto">
          No direct trains operate between {fromName || fromCode} and {toName || toCode} on {dateStr}. Try changing the date or searching nearby stations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-100 p-4 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
            <Zap className="h-4 w-4 text-amber-500 fill-current" />
            <span>Available Trains ({results.length} found)</span>
          </div>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">
            {fromName || fromCode} ({fromCode}) → {toName || toCode} ({toCode})
          </p>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-bold text-gray-500">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-800 outline-none focus:border-blue-500"
          >
            <option value="earliest">Earliest Departure</option>
            <option value="latest">Latest Departure</option>
            <option value="duration">Fastest Duration</option>
          </select>
        </div>
      </div>

      {/* Results List */}
      <div className="flex flex-col gap-3">
        {sortedResults.map((train) => (
          <div
            key={train.trainNumber}
            onClick={() => handleSelectTrain(train.trainNumber)}
            className="group relative cursor-pointer rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-gray-200/40 hover:shadow-xl hover:border-blue-300 transition-all duration-200"
          >
            {/* Top row: Train number, train name, type, and live badge */}
            <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg text-xs">
                  #{train.trainNumber}
                </span>
                <span className="font-extrabold text-gray-900 text-base group-hover:text-blue-600 transition-colors">
                  {train.trainName}
                </span>
                {train.trainType && (
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {train.trainType}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {train.isToday && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Runs Today
                  </span>
                )}
                {train.isHistorical && (
                  <span className="inline-flex items-center text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    Historical Date
                  </span>
                )}
              </div>
            </div>

            {/* Middle row: Station departure, duration timeline, arrival */}
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 py-4">
              {/* From Station */}
              <div className="text-left space-y-0.5">
                <div className="text-xl font-extrabold text-gray-900">
                  {train.fromStation.departureTime}
                </div>
                <div className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-blue-600 shrink-0" />
                  <span>{train.fromStation.name} ({train.fromStation.code})</span>
                </div>
                <div className="text-[11px] font-medium text-gray-400 pl-4">
                  Departs • Day {train.fromStation.day}
                </div>
              </div>

              {/* Duration & Distance Pill */}
              <div className="flex flex-col items-center justify-center text-center space-y-1 my-1 sm:my-0">
                <span className="text-xs font-bold text-blue-700 bg-blue-50/80 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-600" />
                  {train.journeyDuration}
                </span>

                <div className="w-full max-w-[120px] flex items-center gap-1">
                  <div className="h-0.5 flex-1 bg-gray-200 rounded-full" />
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <div className="h-0.5 flex-1 bg-gray-200 rounded-full" />
                </div>

                <span className="text-[11px] font-medium text-gray-400">
                  {train.distanceKm} km
                </span>
              </div>

              {/* To Station */}
              <div className="text-left sm:text-right space-y-0.5">
                <div className="text-xl font-extrabold text-gray-900 flex items-center justify-start sm:justify-end gap-1.5">
                  <span>{train.toStation.arrivalTime}</span>
                  {train.dayDifference > 0 && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      +{train.dayDifference} {train.dayDifference === 1 ? 'day' : 'days'}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-gray-700 flex items-center justify-start sm:justify-end gap-1">
                  <span>{train.toStation.name} ({train.toStation.code})</span>
                  <MapPin className="h-3 w-3 text-indigo-600 shrink-0" />
                </div>
                <div className="text-[11px] font-medium text-gray-400 pr-4 sm:pr-4">
                  Arrives • Day {train.toStation.day}
                </div>
              </div>
            </div>

            {/* Bottom row: Operating Days & Track button */}
            <div className="flex items-center justify-between border-t border-gray-50 pt-3 text-xs flex-wrap gap-2">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] font-semibold text-gray-400 mr-1">Runs:</span>
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => {
                  const runs = train.runsOn.includes(day);
                  return (
                    <span
                      key={day}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        runs ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-300'
                      }`}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center gap-1 text-xs font-extrabold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                <span>View Details & Track</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
