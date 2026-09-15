import { useQuery } from '@tanstack/react-query';
import { LiveStatus } from '@/types/tracking';
import { RouteInfo } from '@/types/train';
import { CONFIG } from '@/lib/config';

async function fetchLiveStatus(trainNumber: string): Promise<LiveStatus> {
  try {
    const res = await fetch(`/api/train/live/${encodeURIComponent(trainNumber)}`);
    if (res.status === 404) {
      return {
        trainNumber,
        trainName: `Train ${trainNumber}`,
        isLiveAvailable: false,
        currentStation: { code: 'N/A', name: 'N/A', delayMinutes: 0 },
        nextStation: { code: 'N/A', name: 'N/A', eta: '--:--', scheduledArrival: '--:--', distanceRemainingKm: 0 },
        coordinates: [77.2195, 28.6429],
        heading: 0,
        speedKmH: 0,
        delayMinutes: 0,
        statusText: 'Train Not Found',
        progressPercentage: 0,
        lastUpdated: new Date().toISOString(),
        isStarted: false,
        isCompleted: false,
      };
    }
    if (!res.ok) {
      return {
        trainNumber,
        trainName: `Train ${trainNumber}`,
        isLiveAvailable: false,
        currentStation: { code: 'N/A', name: 'N/A', delayMinutes: 0 },
        nextStation: { code: 'N/A', name: 'N/A', eta: '--:--', scheduledArrival: '--:--', distanceRemainingKm: 0 },
        coordinates: [77.2195, 28.6429],
        heading: 0,
        speedKmH: 0,
        delayMinutes: 0,
        statusText: 'Live running status is currently unavailable.',
        progressPercentage: 0,
        lastUpdated: new Date().toISOString(),
        isStarted: false,
        isCompleted: false,
      };
    }
    return res.json();
  } catch (err) {
    return {
      trainNumber,
      trainName: `Train ${trainNumber}`,
      isLiveAvailable: false,
      currentStation: { code: 'N/A', name: 'N/A', delayMinutes: 0 },
      nextStation: { code: 'N/A', name: 'N/A', eta: '--:--', scheduledArrival: '--:--', distanceRemainingKm: 0 },
      coordinates: [77.2195, 28.6429],
      heading: 0,
      speedKmH: 0,
      delayMinutes: 0,
      statusText: 'Live running status is currently unavailable.',
      progressPercentage: 0,
      lastUpdated: new Date().toISOString(),
      isStarted: false,
      isCompleted: false,
    };
  }
}

async function fetchRouteInfo(trainNumber: string): Promise<RouteInfo> {
  const res = await fetch(`/api/route/${encodeURIComponent(trainNumber)}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Train Not Found');
    }
    throw new Error('Failed to fetch train route');
  }
  return res.json();
}

export function useLiveTracking(trainNumber: string) {
  const routeQuery = useQuery({
    queryKey: ['routeInfo', trainNumber],
    queryFn: () => fetchRouteInfo(trainNumber),
    enabled: Boolean(trainNumber),
    staleTime: 1000 * 60 * 60, // 1 hr
    retry: 1,
  });

  const statusQuery = useQuery({
    queryKey: ['liveStatus', trainNumber],
    queryFn: () => fetchLiveStatus(trainNumber),
    enabled: Boolean(trainNumber),
    refetchInterval: CONFIG.AUTO_REFRESH_INTERVAL_MS, // 30s auto refresh
    staleTime: 1000 * 15,
  });

  return {
    liveStatus: statusQuery.data,
    isLoadingStatus: statusQuery.isLoading,
    isErrorStatus: statusQuery.isError,
    refetchStatus: statusQuery.refetch,

    routeInfo: routeQuery.data,
    isLoadingRoute: routeQuery.isLoading,
    isErrorRoute: routeQuery.isError,
    routeError: routeQuery.error,
  };
}

