export interface DelayPoint {
  stationCode: string;
  stationName: string;
  delayMinutes: number;
  scheduledTime: string;
  actualTime: string;
  distanceKm: number;
}

export interface ElevationPoint {
  distanceKm: number;
  elevationM: number;
  stationName?: string;
  isStation?: boolean;
}

export interface Landmark {
  id: string;
  name: string;
  type: 'river' | 'mountain' | 'tunnel' | 'bridge' | 'tourist' | 'city';
  coordinates: [number, number];
  distanceFromRouteKm: number;
  description?: string;
}

export interface JourneyAnalytics {
  completionPercentage: number;
  distanceCoveredKm: number;
  remainingDistanceKm: number;
  totalDistanceKm: number;
  highestElevationM: number;
  highestElevationLocation: string;
  avgSpeedKmH: number;
  maxSpeedKmH: number;
  trainNumber?: string;
  trainName?: string;
  currentDelayMinutes?: number;
  source?: { code: string; name: string };
  destination?: { code: string; name: string };
  totalStops?: number;
  completedStops?: number;
  currentStopIndex?: number;
  remainingStops?: number;
  delayTrend: DelayPoint[];
  elevationProfile: ElevationPoint[];
  landmarks: Landmark[];
}
