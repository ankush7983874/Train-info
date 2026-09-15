'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X, Loader2, Check } from 'lucide-react';
import { useStationSearch } from '@/hooks/useStationSearch';
import { StationLookupItem } from '@/app/api/stations/search/route';

interface StationSearchInputProps {
  label: string;
  placeholder?: string;
  selectedStation: StationLookupItem | null;
  onSelectStation: (station: StationLookupItem | null) => void;
}

export default function StationSearchInput({
  label,
  placeholder = 'Search station name or code...',
  selectedStation,
  onSelectStation,
}: StationSearchInputProps) {
  const [query, setQuery] = useState(selectedStation ? `${selectedStation.name} (${selectedStation.code})` : '');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isLoading } = useStationSearch(selectedStation ? '' : query);

  // Update internal query if parent selectedStation changes (e.g. on swap)
  useEffect(() => {
    if (selectedStation) {
      setQuery(`${selectedStation.name} (${selectedStation.code})`);
    }
  }, [selectedStation]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (st: StationLookupItem) => {
    onSelectStation(st);
    setQuery(`${st.name} (${st.code})`);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelectStation(null);
    setQuery('');
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
        {label}
      </label>

      <div className="relative flex items-center rounded-2xl border border-gray-200 bg-white shadow-sm transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10">
        <MapPin className="absolute left-3.5 h-4 w-4 text-blue-600 shrink-0" />

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selectedStation) {
              onSelectStation(null);
            }
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-2xl bg-transparent py-3 pl-10 pr-9 text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (suggestions.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl shadow-gray-900/10 backdrop-blur-xl">
          {isLoading ? (
            <div className="flex items-center justify-center p-4 text-gray-400 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Searching stations...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {suggestions.map((st) => {
                const isSelected = selectedStation?.code === st.code;
                return (
                  <button
                    key={st.code}
                    type="button"
                    onClick={() => handleSelect(st)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                      isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100/60 text-blue-700 font-bold text-xs">
                        {st.code}
                      </div>
                      <span className="truncate text-xs font-bold">{st.name}</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
