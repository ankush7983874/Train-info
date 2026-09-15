export interface WeatherData {
  tempC: number;
  condition: string;
  icon: string; // OpenWeather icon code or internal symbol
  humidity: number;
  windKmH: number;
  rainProbPercentage: number;
  locationName: string;
  feelsLikeC: number;
}
