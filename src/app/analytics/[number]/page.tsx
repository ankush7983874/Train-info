'use client';

import React, { use, useEffect } from 'react';
import { useFavoritesStore } from '@/store/favoritesStore';
import TrainAnalyticsView from '@/components/analytics/TrainAnalyticsView';

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = use(params);
  const { setSelectedTrainNumber } = useFavoritesStore();

  useEffect(() => {
    if (number) {
      setSelectedTrainNumber(number);
    }
  }, [number, setSelectedTrainNumber]);

  return <TrainAnalyticsView trainNumber={number} />;
}
