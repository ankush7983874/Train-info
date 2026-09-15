import { useQuery } from '@tanstack/react-query';
import { JourneyAnalytics } from '@/types/analytics';

async function fetchAnalytics(trainNumber: string): Promise<JourneyAnalytics> {
  const res = await fetch(`/api/analytics/${encodeURIComponent(trainNumber)}`);
  if (!res.ok) throw new Error('Failed to fetch journey analytics');
  return res.json();
}

export function useAnalytics(trainNumber: string) {
  return useQuery({
    queryKey: ['analytics', trainNumber],
    queryFn: () => fetchAnalytics(trainNumber),
    enabled: Boolean(trainNumber),
    staleTime: 1000 * 60 * 5, // 5 mins
  });
}
