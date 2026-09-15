import { useQuery } from '@tanstack/react-query';
import { Train } from '@/types/train';

async function searchTrains(query: string): Promise<Train[]> {
  if (!query || query.trim().length < 2) return [];
  const res = await fetch(`/api/train/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search trains');
  return res.json();
}

export function useTrainSearch(query: string) {
  return useQuery({
    queryKey: ['trainSearch', query],
    queryFn: () => searchTrains(query),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
