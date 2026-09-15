import { useState, useEffect } from 'react';
import { StationTrainResult } from '@/app/api/trains/between/route';

export function useTrainsBetween(fromCode: string, toCode: string, dateStr: string) {
  const [data, setData] = useState<StationTrainResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!fromCode || !toCode) {
      setData([]);
      setIsLoading(false);
      return;
    }

    if (fromCode.toUpperCase() === toCode.toUpperCase()) {
      setError('Please select different stations.');
      setData([]);
      setIsLoading(false);
      return;
    }

    const fetchTrains = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const url = `/api/trains/between?from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}&date=${encodeURIComponent(dateStr)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(errJson.error || 'Train availability is temporarily unavailable. Please try again.');
        }

        const json = await response.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Train availability is temporarily unavailable. Please try again.');
          setData([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTrains();

    return () => {
      isMounted = false;
    };
  }, [fromCode, toCode, dateStr]);

  return { data, isLoading, error };
}
