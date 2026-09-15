export const CONFIG = {
  MAPTILER_API_KEY: process.env.NEXT_PUBLIC_MAPTILER_API_KEY || process.env.MAPTILER_API_KEY || 'get_your_own_Opn55Z1p8z', // Graceful fallback
  OPENWEATHER_API_KEY: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY || '',
  RAILRADAR_API_KEY: process.env.RAILRADAR_API_KEY || '',
  OPENTOPOGRAPHY_API_KEY: process.env.NEXT_PUBLIC_OPENTOPOGRAPHY_API_KEY || process.env.OPENTOPOGRAPHY_API_KEY || '',
  IS_MOCK_MODE: true, // Will fall back to mock data seamlessly if API key is missing
  AUTO_REFRESH_INTERVAL_MS: 30000, // 30 seconds
};
