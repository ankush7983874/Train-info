'use client';

import React from 'react';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useQuery } from '@tanstack/react-query';
import TrainComparisonCard from '@/components/companion/TrainComparisonCard';
import { GitCompare } from 'lucide-react';

async function fetchRoute(trainNumber: string) {
  const res = await fetch(`/api/route/${trainNumber}`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchLive(trainNumber: string) {
  const res = await fetch(`/api/train/live/${trainNumber}`);
  if (!res.ok) return null;
  return res.json();
}

export default function ComparePage() {
  const { selectedTrainNumber } = useFavoritesStore();
  const trainNum = selectedTrainNumber || '12301';

  const { data: routeInfo } = useQuery({
    queryKey: ['compareRoute', trainNum],
    queryFn: () => fetchRoute(trainNum),
  });

  const { data: liveStatus } = useQuery({
    queryKey: ['compareLive', trainNum],
    queryFn: () => fetchLive(trainNum),
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-xs font-bold text-purple-700">
          <GitCompare className="h-4 w-4" />
          <span>Real-Time Train Route Comparison</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
          Compare Trains Side-by-Side
        </h1>
        <p className="text-xs text-gray-500 font-medium max-w-xl mx-auto">
          Compare route distances, halt counts, average speed, and live delay metrics using official provider data.
        </p>
      </div>

      <TrainComparisonCard
        currentTrain={
          routeInfo
            ? {
                id: trainNum,
                number: trainNum,
                name: routeInfo.trainName,
                source: routeInfo.source,
                destination: routeInfo.destination,
                totalDistanceKm: routeInfo.totalDistanceKm,
                runsOn: ['Daily'],
                classes: ['1A', '2A', '3A'],
                avgSpeedKmH: 85,
              }
            : null
        }
        currentRoute={routeInfo}
        currentLive={liveStatus}
      />
    </div>
  );
}
