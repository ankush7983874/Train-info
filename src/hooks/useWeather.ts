import { useQuery } from '@tanstack/react-query';
import { WeatherData } from '@/types/weather';

async function fetchWeather(target: 'current' | 'destination'): Promise<WeatherData> {
  const res = await fetch(`/api/weather?target=${target}`);
  if (!res.ok) throw new Error('Failed to fetch weather data');
  return res.json();
}

export function useWeather(target: 'current' | 'destination' = 'current') {
  return useQuery({
    queryKey: ['weather', target],
    queryFn: () => fetchWeather(target),
    staleTime: 1000 * 60 * 15, // 15 mins
  });
}
