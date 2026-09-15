'use client';

import React from 'react';
import Link from 'next/link';
import SearchBar from '@/components/search/SearchBar';
import { useFavoritesStore } from '@/store/favoritesStore';
import { MOCK_TRAINS } from '@/lib/mockData';
import { Train, Heart, Clock, ArrowRight, Zap, Sparkles, MapPin, Ticket } from 'lucide-react';

export default function HomePage() {
  const { favorites, recentSearches, clearRecentSearches } = useFavoritesStore();

  return (
    <div className="space-y-10 py-6">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-6 pb-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Real-time GPS Tracking & Topography Maps</span>
        </div>

        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl lg:text-6xl">
          Live Train Tracking, <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Reimagined.
          </span>
        </h1>

        <p className="text-base text-gray-500 font-medium sm:text-lg max-w-xl mx-auto">
          Track Indian railways live, explore station timelines, topographical elevation profiles, and weather forecasts.
        </p>

        {/* Hero Search Bar */}
        <div className="pt-4">
          <SearchBar autoFocus />
        </div>
      </div>

      {/* PNR Quick Link Banner */}
      <div className="max-w-3xl mx-auto">
        <Link
          href="/pnr"
          className="group flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80 p-5 sm:p-6 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:border-blue-300 transition-all duration-200"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-700 uppercase tracking-wider bg-blue-100/80 px-2 py-0.5 rounded-full mb-1">
                New Feature
              </span>
              <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
                Check 10-Digit PNR Status & Save to My Journeys
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Verify booking status with security CAPTCHA & connect automatically to live satellite tracking.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-600 bg-white px-4 py-2.5 rounded-full shadow-2xs border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
            <span>Check PNR</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* AI Smart Journey Companion Link Banner */}
      <div className="max-w-3xl mx-auto">
        <Link
          href="/ai-assistant"
          className="group flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 p-5 sm:p-6 shadow-lg shadow-indigo-500/5 hover:shadow-xl hover:border-indigo-300 transition-all duration-200"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider bg-indigo-100/80 px-2 py-0.5 rounded-full mb-1">
                AI Powered Companion
              </span>
              <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-indigo-600 transition-colors">
                Launch AI Journey Assistant & Smart Alerts
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Get instant Q&A, station guides, countdowns, platform updates, and weather alerts based on real tracking data.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 bg-white px-4 py-2.5 rounded-full shadow-2xs border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
            <span>Ask AI</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              Recent Searches
            </span>
            <button
              onClick={clearRecentSearches}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((item, idx) => (
              <Link
                key={idx}
                href={`/train/${item}`}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all shadow-2xs"
              >
                <span>{item}</span>
                <ArrowRight className="h-3 w-3 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Favorite Trains */}
      {favorites.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500 fill-current" />
              Your Favorite Trains
            </h2>
            <Link href="/favorites" className="text-xs font-semibold text-blue-600 hover:underline">
              View All ({favorites.length})
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((train) => (
              <Link
                key={train.id}
                href={`/train/${train.number}`}
                className="group rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-gray-200/40 hover:shadow-xl hover:border-blue-200 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                    #{train.number}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    LIVE
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {train.name}
                </h3>

                <div className="mt-2 flex items-center justify-between text-xs text-gray-500 font-medium">
                  <span>{train.source.name}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  <span>{train.destination.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Express Trains */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500 fill-current" />
              Popular Trains
            </h2>
            <p className="text-xs text-gray-500 font-medium">Tap to track live position & delay status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_TRAINS.map((train) => (
            <Link
              key={train.id}
              href={`/train/${train.number}`}
              className="group flex flex-col justify-between rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-gray-200/40 hover:shadow-xl hover:border-blue-200 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Train className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-gray-900">{train.number}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-400">
                    {train.totalDistanceKm} km
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {train.name}
                </h3>

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>{train.source.city}</span>
                  <span className="text-gray-300">→</span>
                  <span>{train.destination.city}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3 text-xs font-semibold text-blue-600">
                <span>Track Journey</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

