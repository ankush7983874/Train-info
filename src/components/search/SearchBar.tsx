'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Command, X, Train, ArrowRight, Loader2, MapPin } from 'lucide-react';
import { useTrainSearch } from '@/hooks/useTrain';
import { useDebounce } from '@/hooks/useDebounce';
import { useFavoritesStore } from '@/store/favoritesStore';
import StationSearchForm from './StationSearchForm';
import StationSearchResults from './StationSearchResults';
import { StationLookupItem } from '@/app/api/stations/search/route';
import { useTrainsBetween } from '@/hooks/useTrainsBetween';
import { getISTTodayIso } from '@/lib/dateUtils';

interface SearchBarProps {
  autoFocus?: boolean;
  placeholder?: string;
}

export default function SearchBar({ autoFocus = false, placeholder = 'Search by Train Number or Train Name' }: SearchBarProps) {
  const [searchMode, setSearchMode] = useState<'train' | 'station'>('train');

  // State for Train Number / Name Search
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 250);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading: isTrainLoading } = useTrainSearch(debouncedQuery);
  const { addRecentSearch, setSelectedTrainNumber } = useFavoritesStore();

  // State for Station-to-Station Search
  const [fromStation, setFromStation] = useState<StationLookupItem | null>(null);
  const [toStation, setToStation] = useState<StationLookupItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getISTTodayIso());
  const [hasSearchedStation, setHasSearchedStation] = useState(false);

  const {
    data: stationTrains,
    isLoading: isStationLoading,
    error: stationError,
  } = useTrainsBetween(
    hasSearchedStation && fromStation ? fromStation.code : '',
    hasSearchedStation && toStation ? toStation.code : '',
    selectedDate
  );

  // Keyboard shortcut Cmd+K or Ctrl+K to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTrain = (trainNumber: string) => {
    const cleanNumber = trainNumber.trim().replace(/\s+/g, '');
    if (!cleanNumber) return;
    addRecentSearch(query || cleanNumber);
    setSelectedTrainNumber(cleanNumber);
    setIsOpen(false);
    router.push(`/train/${cleanNumber}`);
  };

  const handleSubmitTrain = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = query.trim().replace(/\s+/g, '');
    if (cleanNumber) {
      if (results && results.length > 0 && results[0].number) {
        handleSelectTrain(results[0].number);
      } else {
        handleSelectTrain(cleanNumber);
      }
    }
  };

  const handleStationSearch = (from: StationLookupItem, to: StationLookupItem, date: string) => {
    setFromStation(from);
    setToStation(to);
    setSelectedDate(date);
    setHasSearchedStation(true);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl mx-auto space-y-4">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-center p-1 bg-gray-100/80 rounded-2xl max-w-md mx-auto border border-gray-200/60 shadow-2xs">
        <button
          type="button"
          onClick={() => setSearchMode('train')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 ${
            searchMode === 'train'
              ? 'bg-white text-blue-600 shadow-md shadow-gray-200/50'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Train className="h-4 w-4" />
          <span>Train Number / Name</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchMode('station')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 ${
            searchMode === 'station'
              ? 'bg-white text-blue-600 shadow-md shadow-gray-200/50'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <MapPin className="h-4 w-4" />
          <span>From → To Station</span>
        </button>
      </div>

      {/* Mode 1: Train Number / Name Search */}
      {searchMode === 'train' && (
        <div className="relative">
          <form onSubmit={handleSubmitTrain} className="relative flex items-center rounded-2xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/40 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
            <Search className="absolute left-4 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              autoFocus={autoFocus}
              placeholder={placeholder}
              className="w-full rounded-2xl bg-transparent py-4 pl-12 pr-24 text-gray-900 placeholder-gray-400 outline-none text-base font-medium"
            />

            <div className="absolute right-4 flex items-center gap-2">
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setIsOpen(false);
                  }}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-500 shadow-2xs">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>
          </form>

          {/* Dropdown Results */}
          {isOpen && (query.trim().length >= 2 || (results && results.length > 0)) && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl shadow-gray-900/10 backdrop-blur-xl">
              {isTrainLoading ? (
                <div className="flex items-center justify-center p-6 text-gray-400 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-sm font-medium">Searching trains...</span>
                </div>
              ) : results && results.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {results.map((train) => (
                    <button
                      key={train.id || train.number}
                      type="button"
                      onClick={() => handleSelectTrain(train.number)}
                      className="flex items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-blue-50/70 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/60 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Train className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">{train.number}</span>
                            <span className="font-semibold text-gray-900 text-sm">{train.name}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>{train.source.name} ({train.source.code}) → {train.destination.name} ({train.destination.code})</span>
                            {train.runsOn && train.runsOn.length > 0 && (
                              <span className="text-[10px] text-gray-400 font-medium">
                                • Runs: {train.runsOn.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm font-semibold text-gray-500">
                  No train found. Try another train number or train name.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Station-to-Station Search */}
      {searchMode === 'station' && (
        <div className="rounded-3xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xl shadow-gray-200/40 space-y-6">
          <StationSearchForm
            onSearch={handleStationSearch}
            initialFrom={fromStation}
            initialTo={toStation}
            initialDate={selectedDate}
          />

          {hasSearchedStation && fromStation && toStation && (
            <StationSearchResults
              fromCode={fromStation.code}
              fromName={fromStation.name}
              toCode={toStation.code}
              toName={toStation.name}
              dateStr={selectedDate}
              results={stationTrains}
              isLoading={isStationLoading}
              error={stationError}
            />
          )}
        </div>
      )}
    </div>
  );
}
