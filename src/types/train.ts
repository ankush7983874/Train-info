export interface Station {
  code: string;
  name: string;
  state?: string;
  arrivalTime: string;
  departureTime: string;
  distanceKm: number;
  day: number;
  platform?: string;
  lat: number;
  lon: number;
  elevationM?: number;
  passed?: boolean;
  actualArrival?: string;
  actualDeparture?: string;
  delayMinutes?: number;
  isStoppingStation?: boolean;
  isHalt?: boolean;
}

export interface Train {
  id: string;
  number: string;
  name: string;
  source: {
    code: string;
    name: string;
    city: string;
  };
  destination: {
    code: string;
    name: string;
    city: string;
  };
  totalDistanceKm: number;
  runsOn: string[]; // e.g. ["Mon", "Tue", "Wed", ...]
  classes: string[]; // e.g. ["1A", "2A", "3A", "SL"]
  avgSpeedKmH: number;
}

export interface RouteInfo {
  trainNumber: string;
  trainName?: string;
  source?: {
    code: string;
    name: string;
    city: string;
  };
  destination?: {
    code: string;
    name: string;
    city: string;
  };
  stations: Station[];
  polyline: [number, number][]; // [lon, lat] pairs
  totalDistanceKm: number;
}

