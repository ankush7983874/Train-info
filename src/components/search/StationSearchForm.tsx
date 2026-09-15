'use client';

import React, { useState } from 'react';
import { ArrowDownUp, Search, Calendar, AlertCircle } from 'lucide-react';
import StationSearchInput from './StationSearchInput';
import { StationLookupItem } from '@/app/api/stations/search/route';
import { getPresetDateIsos, formatDateDetails, getISTTodayIso } from '@/lib/dateUtils';

interface StationSearchFormProps {
  onSearch: (from: StationLookupItem, to: StationLookupItem, date: string) => void;
  initialFrom?: StationLookupItem | null;
  initialTo?: StationLookupItem | null;
  initialDate?: string;
}

export default function StationSearchForm({
  onSearch,
  initialFrom = null,
  initialTo = null,
  initialDate = getISTTodayIso(),
}: StationSearchFormProps) {
  const [fromStation, setFromStation] = useState<StationLookupItem | null>(initialFrom);
  const [toStation, setToStation] = useState<StationLookupItem | null>(initialTo);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const presets = getPresetDateIsos();

  const handleSwap = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromStation) {
      setErrorMsg('Please select a From Station.');
      return;
    }
    if (!toStation) {
      setErrorMsg('Please select a To Station.');
      return;
    }
    if (fromStation.code === toStation.code) {
      setErrorMsg('Please select different stations.');
      return;
    }

    setErrorMsg(null);
    onSearch(fromStation, toStation, selectedDate);
  };

  const dateDetails = formatDateDetails(selectedDate);

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {/* From & To Station Inputs with Swap Button */}
      <div className="relative flex flex-col md:flex-row items-center gap-3">
        <div className="w-full flex-1">
          <StationSearchInput
            label="From Station"
            placeholder="e.g. Gorakhpur (GKP)"
            selectedStation={fromStation}
            onSelectStation={(st) => {
              setFromStation(st);
              setErrorMsg(null);
            }}
          />
        </div>

        {/* Swap Button */}
        <div className="flex items-center justify-center pt-5 md:pt-4">
          <button
            type="button"
            onClick={handleSwap}
            title="Swap Stations"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 shadow-md hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 active:scale-95"
          >
            <ArrowDownUp className="h-4 w-4 md:rotate-90" />
          </button>
        </div>

        <div className="w-full flex-1">
          <StationSearchInput
            label="To Station"
            placeholder="e.g. New Delhi (NDLS)"
            selectedStation={toStation}
            onSelectStation={(st) => {
              setToStation(st);
              setErrorMsg(null);
            }}
          />
        </div>
      </div>

      {/* Date Selector Section */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 pl-1">
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            Travel Date
          </span>
          <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
            {dateDetails.fullDateStr} ({dateDetails.dayName})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setSelectedDate(presets.yesterday)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-2xs ${
              selectedDate === presets.yesterday
                ? 'bg-blue-600 text-white shadow-blue-500/20'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Yesterday
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(presets.today)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-2xs ${
              selectedDate === presets.today
                ? 'bg-blue-600 text-white shadow-blue-500/20'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(presets.tomorrow)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-2xs ${
              selectedDate === presets.tomorrow
                ? 'bg-blue-600 text-white shadow-blue-500/20'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Tomorrow
          </button>

          <div className="relative inline-flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                }
              }}
              className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Error Message display */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search Button */}
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 px-6 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 active:scale-[0.99]"
      >
        <Search className="h-4 w-4" />
        <span>Search Trains</span>
      </button>
    </form>
  );
}
