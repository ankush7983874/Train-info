'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFavoritesStore } from '@/store/favoritesStore';
import TrainAnalyticsView from '@/components/analytics/TrainAnalyticsView';
import SearchBar from '@/components/search/SearchBar';
import { BarChart3, Loader2 } from 'lucide-react';

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const trainParam = searchParams.get('train');
  const { selectedTrainNumber } = useFavoritesStore();

  const activeTrainNumber = trainParam || selectedTrainNumber;

  if (!activeTrainNumber) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center space-y-4 text-center py-12 max-w-xl mx-auto">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10">
          <BarChart3 className="h-7 w-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Search for a train to view its analytics.
        </h1>
        <p className="text-sm text-gray-500 font-medium max-w-md">
          Select or search any Indian Railway train to analyze live delay trends, scheduled stopping station metrics, and topographic elevation.
        </p>
        <div className="w-full pt-4">
          <SearchBar autoFocus />
        </div>
      </div>
    );
  }

  return <TrainAnalyticsView trainNumber={activeTrainNumber} />;
}

export default function AnalyticsRootPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center gap-2 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-sm font-semibold">Loading analytics...</span>
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}
