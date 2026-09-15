'use client';

import React from 'react';
import Link from 'next/link';
import { useFavoritesStore } from '@/store/favoritesStore';
import { Heart, Train, ArrowRight, Trash2 } from 'lucide-react';

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavoritesStore();

  return (
    <div className="space-y-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            Favorite Trains
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Quick launch dashboard for your saved journeys
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
          {favorites.length} Saved
        </span>
      </div>

      {favorites.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <Heart className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900">No favorite trains saved yet</h3>
          <p className="mt-1 text-xs text-gray-500 max-w-sm">
            Tap the heart icon on any train live tracking page to save it for instant quick access.
          </p>
          <Link
            href="/"
            className="mt-6 flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-700 transition-all"
          >
            Search Trains
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((train) => (
            <div
              key={train.id}
              className="group relative flex flex-col justify-between rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-gray-200/40 hover:shadow-xl hover:border-blue-200 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                    #{train.number}
                  </span>

                  <button
                    onClick={() => removeFavorite(train.number)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    title="Remove favorite"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <h3 className="mt-3 text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {train.name}
                </h3>

                <div className="mt-2 text-xs text-gray-500 font-medium">
                  {train.source.name} → {train.destination.name}
                </div>
              </div>

              <div className="mt-6 border-t border-gray-50 pt-3">
                <Link
                  href={`/train/${train.number}`}
                  className="flex items-center justify-between text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  <span>Launch Live Tracking</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
