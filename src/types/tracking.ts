export interface LiveStatus {
  trainNumber: string;
  trainName: string;
  isLiveAvailable?: boolean;
  isRateLimited?: boolean;
  currentStation: {
    code: string;
    name: string;
    actualDeparture?: string;
    delayMinutes: number;
  };
  nextStation: {
    code: string;
    name: string;
    eta: string;
    scheduledArrival: string;
    distanceRemainingKm: number;
  };
  previousStation?: {
    code: string;
    name: string;
    actualDeparture?: string;
    delayMinutes: number;
  };
  coordinates: [number, number]; // [lon, lat]
  heading: number; // in degrees 0-360
  speedKmH: number;
  delayMinutes: number;
  statusText: string; // e.g. "Running 12 min late", "On Time", "Departed New Delhi"
  progressPercentage: number; // 0 to 100
  lastUpdated: string; // ISO string or relative time
  isStarted: boolean;
  isCompleted: boolean;
}

