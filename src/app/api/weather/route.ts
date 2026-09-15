import { NextRequest, NextResponse } from 'next/server';
import { MOCK_WEATHER } from '@/lib/mockData';
import { CONFIG } from '@/lib/config';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const target = searchParams.get('target') || 'current';
  const latParam = searchParams.get('lat');
  const lonParam = searchParams.get('lon');

  let lat = 25.3200;
  let lon = 82.5500;
  let locationName = 'Near Mirzapur, UP';

  if (latParam && lonParam) {
    lat = parseFloat(latParam);
    lon = parseFloat(lonParam);
    locationName = `Location [${lat.toFixed(2)}, ${lon.toFixed(2)}]`;
  } else if (target === 'destination') {
    lat = 28.6429;
    lon = 77.2195;
    locationName = 'New Delhi';
  }

  // Check if OpenWeather API key is present
  if (CONFIG.OPENWEATHER_API_KEY) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${CONFIG.OPENWEATHER_API_KEY}`,
        { next: { revalidate: 900 } } // 15 mins
      );

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          tempC: Math.round(data.main.temp),
          condition: data.weather[0].main,
          icon: data.weather[0].icon,
          humidity: data.main.humidity,
          windKmH: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
          rainProbPercentage: data.clouds ? data.clouds.all : 0,
          locationName: data.name || locationName,
          feelsLikeC: Math.round(data.main.feels_like),
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=60',
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch from OpenWeather, falling back to mock:', error);
    }
  }

  // Fallback to mock data if key not present or call failed
  const weather = MOCK_WEATHER[target] || MOCK_WEATHER.current;
  return NextResponse.json(weather, {
    headers: {
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=60',
    },
  });
}
