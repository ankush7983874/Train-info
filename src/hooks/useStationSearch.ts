import { useState, useEffect } from 'react';
import { StationLookupItem } from '@/app/api/stations/search/route';
import { useDebounce } from '@/hooks/useDebounce';

export function useStationSearch(query: string) {
  const [data, setData] = useState<StationLookupItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    let isMounted = true;
    const fetchStations = async () => {
      if (!debouncedQuery.trim()) {
        setData([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/stations/search?q=${encodeURIComponent(debouncedQuery.trim())}`);
        if (!response.ok) {
          throw new Error('Failed to fetch stations');
        }
        const json = await response.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error fetching stations');
          setData([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchStations();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  return { data, isLoading, error };
}
