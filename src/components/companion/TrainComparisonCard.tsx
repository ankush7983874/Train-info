'use client';

import React, { useState } from 'react';
import { Train } from '@/types/train';
import { RouteInfo } from '@/types/train';
import { LiveStatus } from '@/types/tracking';
import { GitCompare, Search, Loader2, ArrowRight } from 'lucide-react';

interface TrainComparisonCardProps {
  currentTrain: Train | null;
  currentRoute: RouteInfo | null;
  currentLive: LiveStatus | null;
}

export default function TrainComparisonCard({ currentTrain, currentRoute, currentLive }: TrainComparisonCardProps) {
  const [compareNumber, setCompareNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [targetTrain, setTargetTrain] = useState<Train | null>(null);
  const [targetRoute, setTargetRoute] = useState<RouteInfo | null>(null);
  const [targetLive, setTargetLive] = useState<LiveStatus | null>(null);

  const handleCompareSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = compareNumber.trim();
    if (!cleanNum) return;

    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch search details
      const searchRes = await fetch(`/api/train/search?q=${cleanNum}`);
      if (!searchRes.ok) throw new Error('Train not found');
      const searchData = await searchRes.json();
      const train = searchData.results?.[0] || searchData;

      // 2. Fetch route details
      const routeRes = await fetch(`/api/route/${cleanNum}`);
      let route: RouteInfo | null = null;
      if (routeRes.ok) {
        route = await routeRes.json();
      }

      // 3. Fetch live status
      const liveRes = await fetch(`/api/train/live/${cleanNum}`);
      let live: LiveStatus | null = null;
      if (liveRes.ok) {
        live = await liveRes.json();
      }

      setTargetTrain(train);
      setTargetRoute(route);
      setTargetLive(live);
    } catch (err: any) {
      setError('Could not fetch train details for comparison.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <GitCompare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Train Comparison</h3>
            <p className="text-xs text-gray-500 font-medium">Compare route, halts, speed & live delay side-by-side</p>
          </div>
        </div>
      </div>

      {/* Comparison Input Form */}
      <form onSubmit={handleCompareSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={compareNumber}
            onChange={(e) => setCompareNumber(e.target.value)}
            placeholder="Enter train number to compare (e.g. 12951)..."
            className="w-full rounded-2xl border border-gray-200 py-2.5 pl-10 pr-4 text-xs font-bold text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !compareNumber.trim()}
          className="flex items-center gap-1.5 rounded-2xl bg-purple-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-purple-700 disabled:opacity-50 transition-all"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Compare'}
        </button>
      </form>

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Train 1 (Current) */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/20 p-5 space-y-4">
          <div className="border-b border-blue-100 pb-3">
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-700">CURRENT TRAIN</span>
            <h4 className="font-extrabold text-lg text-gray-900 mt-1">
              {currentTrain?.name || 'Howrah Rajdhani'} (#{currentTrain?.number || '12301'})
            </h4>
          </div>

          <div className="space-y-2 text-xs font-medium text-gray-700">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-400">Route</span>
              <span className="font-bold text-gray-900">{currentTrain?.source?.code || 'HWH'} → {currentTrain?.destination?.code || 'NDLS'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-400">Total Distance</span>
              <span className="font-bold text-gray-900">{currentRoute?.totalDistanceKm || currentTrain?.totalDistanceKm || '1451'} km</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-400">Stopping Halts</span>
              <span className="font-bold text-gray-900">{currentRoute?.stations?.length || '6'} stops</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-400">Avg Speed</span>
              <span className="font-bold text-gray-900">{currentTrain?.avgSpeedKmH || '85'} km/h</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Live Delay</span>
              <span className="font-extrabold text-amber-600">{currentLive ? `${currentLive.delayMinutes} mins` : 'On Time'}</span>
            </div>
          </div>
        </div>

        {/* Train 2 (Compared) */}
        <div className="rounded-2xl border border-purple-100 bg-purple-50/20 p-5 space-y-4">
          <div className="border-b border-purple-100 pb-3">
            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-700">COMPARED TRAIN</span>
            <h4 className="font-extrabold text-lg text-gray-900 mt-1">
              {targetTrain ? `${targetTrain.name} (#${targetTrain.number})` : 'Select a train to compare'}
            </h4>
          </div>

          {targetTrain ? (
            <div className="space-y-2 text-xs font-medium text-gray-700">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-400">Route</span>
                <span className="font-bold text-gray-900">{targetTrain.source?.code} → {targetTrain.destination?.code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-400">Total Distance</span>
                <span className="font-bold text-gray-900">{targetRoute?.totalDistanceKm || targetTrain.totalDistanceKm} km</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-400">Stopping Halts</span>
                <span className="font-bold text-gray-900">{targetRoute?.stations?.length || 'N/A'} stops</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-400">Avg Speed</span>
                <span className="font-bold text-gray-900">{targetTrain.avgSpeedKmH || 'N/A'} km/h</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Live Delay</span>
                <span className="font-extrabold text-amber-600">{targetLive ? `${targetLive.delayMinutes} mins` : 'On Time'}</span>
              </div>
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center text-center text-xs text-gray-400 font-medium">
              <GitCompare className="h-8 w-8 text-gray-300 mb-2" />
              <span>Enter a 5-digit train number above to view side-by-side comparative analysis.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
