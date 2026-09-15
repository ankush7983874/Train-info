import { Train, RouteInfo, Station } from './train';
import { LiveStatus } from './tracking';
import { PnrStatus, Passenger } from './pnr';
import { WeatherData } from './weather';

export interface StationFacility {
  id: string;
  name: string;
  category: 'washroom' | 'food' | 'waiting_room' | 'atm' | 'parking' | 'taxi' | 'bus' | 'medical' | 'enquiry' | 'exit' | 'accessibility';
  available: boolean;
  description?: string;
}

export interface NearbyPlace {
  id: string;
  name: string;
  category: 'tourist' | 'restaurant' | 'hotel' | 'hospital' | 'atm' | 'transport' | 'landmark';
  distanceKm: number;
  description?: string;
  coordinates?: { lat: number; lng: number };
}

export interface StationGuideData {
  stationCode: string;
  stationName: string;
  facilities: StationFacility[];
  nearbyPlaces: NearbyPlace[];
}

export interface DelayPrediction {
  currentDelayMinutes: number;
  predictedDelayRange: string; // e.g. "12-25 min delay"
  confidencePercentage: number;
  trend: 'increasing' | 'stable' | 'reducing';
  factors: string[];
  sufficientData: boolean;
}

export interface EtaPrediction {
  scheduledEtaNext: string | null;
  aiEstimatedEtaNext: string | null;
  scheduledEtaDestination: string | null;
  aiEstimatedEtaDestination: string | null;
  confidence: number;
}

export interface JourneyRiskAssessment {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  delayRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  weatherRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

export interface WeatherImpactAssessment {
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
}

export interface RouteInsights {
  majorJunctions: string[];
  longestSegmentKm: number;
  completedPercentage: number;
  remainingDistanceKm: number;
  travelSuggestions: string[];
}

export interface JourneyOutcomePrediction {
  outcome: 'LIKELY ON TIME' | 'LIKELY DELAYED' | 'UNCERTAIN';
  explanation: string;
}

export interface JourneyContext {
  trainNumber: string | null;
  trainName: string | null;
  source: Partial<Station> | { code: string; name: string; city?: string } | null;
  destination: Partial<Station> | { code: string; name: string; city?: string } | null;
  currentStation: Partial<Station> | null;
  nextStation: Partial<Station> | null;
  previousStation?: Partial<Station> | null;
  
  // Status & Progress
  runningStatus: 'ON_TIME' | 'DELAYED' | 'CANCELLED' | 'UNKNOWN';
  delayMinutes: number;
  delayText: string;
  journeyProgressPercent: number;
  distanceCoveredKm: number;
  distanceRemainingKm: number;
  totalDistanceKm: number;
  
  // Halts
  totalStops: number;
  completedStops: number;
  remainingStops: number;
  stoppingStations: Partial<Station>[];
  
  // Timings & ETA
  etaNextStationMinutes: number | null;
  etaNextStationFormatted: string | null;
  etaDestinationFormatted: string | null;
  lastUpdated: string | null;
  
  // Platform & Coach (Real data only)
  boardingPlatform: string | null;
  nextStationPlatform: string | null;
  currentStationPlatform: string | null;
  coachPosition: string | null;
  assignedSeat: string | null;
  
  // PNR Details if loaded
  pnrNumber: string | null;
  pnrStatusText: string | null;
  passengers: Passenger[];
  
  // Weather
  currentWeather: WeatherData | null;
  nextStationWeather: WeatherData | null;
  destinationWeather: WeatherData | null;

  // AI Intelligence Signals
  delayPrediction?: DelayPrediction;
  etaPrediction?: EtaPrediction;
  journeyRisk?: JourneyRiskAssessment;
  weatherImpact?: WeatherImpactAssessment;
  routeInsights?: RouteInsights;
  outcomePrediction?: JourneyOutcomePrediction;
  
  // Guides
  stationGuide: StationGuideData | null;
  
  // State
  journeyState: 'ACTIVE' | 'COMPLETED' | 'NOT_STARTED';
  isRealDataAvailable: boolean;
  dataUnavailabilityReason?: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    href: string;
  };
}

export interface SmartAlert {
  id: string;
  type: 
    | 'BOARDING_APPROACHING'
    | 'BOARDING_ARRIVED'
    | 'BOARDING_DEPARTED'
    | 'NEXT_APPROACHING'
    | 'NEXT_ARRIVED'
    | 'STATION_DEPARTED'
    | 'DELAY_INCREASED'
    | 'DELAY_REDUCED'
    | 'DESTINATION_APPROACHING'
    | 'DESTINATION_REACHED'
    | 'PLATFORM_CHANGED'
    | 'COACH_UPDATED';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: 'info' | 'warning' | 'success' | 'urgent';
}

