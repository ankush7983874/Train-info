import { Station } from '@/types/train';
import { LiveStatus } from '@/types/tracking';

export interface RouteSegment {
  index: number;
  startStation: Station;
  endStation: Station;
  distanceKm: number;
  isCurrentSegment: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
  trainDistanceCoveredInSegmentKm: number;
  trainDistanceRemainingInSegmentKm: number;
  segmentProgressPercent: number;
  etaNextStation?: string;
  nextStationHaltMinutes?: number;
}

/**
 * Calculates geodesic distance between two lat/lon coordinates in Kilometers (Haversine Formula)
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function calculateRouteSegments(
  stations: Station[],
  liveStatus: LiveStatus | null,
  totalDistanceKm: number
): RouteSegment[] {
  const stoppingStations = (stations || []).filter(
    (s) => s.isStoppingStation !== false && s.isHalt !== false
  );

  if (stoppingStations.length < 2) return [];

  const overallProgressPercent = liveStatus?.progressPercentage ?? 0;
  const overallCoveredKm = Math.round((totalDistanceKm * overallProgressPercent) / 100);

  // Check if real live GPS coordinates are available [lon, lat]
  const hasLiveCoords = Boolean(
    liveStatus?.coordinates &&
      Array.isArray(liveStatus.coordinates) &&
      liveStatus.coordinates.length === 2 &&
      (liveStatus.coordinates[0] !== 0 || liveStatus.coordinates[1] !== 0)
  );

  const trainLon = hasLiveCoords ? liveStatus!.coordinates[0] : 0;
  const trainLat = hasLiveCoords ? liveStatus!.coordinates[1] : 0;

  // Find active station index
  let activeIndex = 0;
  if (liveStatus?.currentStation) {
    const foundIdx = stoppingStations.findIndex((s) => s.code === liveStatus.currentStation.code);
    if (foundIdx !== -1) {
      activeIndex = foundIdx;
    }
  } else {
    const passedCount = stoppingStations.filter((s) => s.passed).length;
    activeIndex = Math.max(0, Math.min(stoppingStations.length - 1, passedCount));
  }

  const segments: RouteSegment[] = [];

  for (let i = 0; i < stoppingStations.length - 1; i++) {
    const start = stoppingStations[i];
    const end = stoppingStations[i + 1];

    const segmentStartKm = start.distanceKm || 0;
    const segmentEndKm = end.distanceKm || segmentStartKm + 50;
    const segmentLengthKm = Math.max(1, segmentEndKm - segmentStartKm);

    const isCurrentSegment = i === activeIndex || (overallCoveredKm >= segmentStartKm && overallCoveredKm <= segmentEndKm);
    const isCompleted = overallCoveredKm > segmentEndKm || (i < activeIndex && !isCurrentSegment);
    const isUpcoming = !isCompleted && !isCurrentSegment;

    let coveredInSegment = 0;
    let remainingInSegment = segmentLengthKm;
    let segProgress = 0;

    if (isCompleted) {
      coveredInSegment = segmentLengthKm;
      remainingInSegment = 0;
      segProgress = 100;
    } else if (isCurrentSegment) {
      // 1. Priority 1: Use REAL Live Coordinates if available & valid
      if (hasLiveCoords && start.lat && start.lon && end.lat && end.lon) {
        const distFromStartGeo = haversineDistanceKm(trainLat, trainLon, start.lat, start.lon);
        const distToEndGeo = haversineDistanceKm(trainLat, trainLon, end.lat, end.lon);
        const totalGeo = Math.max(1, distFromStartGeo + distToEndGeo);
        
        coveredInSegment = Math.min(segmentLengthKm, Math.max(0, Math.round((distFromStartGeo / totalGeo) * segmentLengthKm)));
        remainingInSegment = Math.max(0, segmentLengthKm - coveredInSegment);
        segProgress = Math.min(100, Math.max(0, Math.round((coveredInSegment / segmentLengthKm) * 100)));
      } else if (overallCoveredKm >= segmentStartKm) {
        // 2. Priority 2: Use Route Progress percentage
        coveredInSegment = Math.min(segmentLengthKm, Math.max(0, overallCoveredKm - segmentStartKm));
        remainingInSegment = Math.max(0, segmentLengthKm - coveredInSegment);
        segProgress = Math.min(100, Math.max(0, Math.round((coveredInSegment / segmentLengthKm) * 100)));
      } else {
        // 3. Priority 3: Fallback segment progress
        coveredInSegment = Math.round(segmentLengthKm * 0.4);
        remainingInSegment = segmentLengthKm - coveredInSegment;
        segProgress = 40;
      }
    }

    // Halt duration at next station if schedule provided
    let haltMinutes: number | undefined = undefined;
    if (end.arrivalTime && end.departureTime && end.arrivalTime !== '--:--' && end.departureTime !== '--:--') {
      try {
        const [aH, aM] = end.arrivalTime.split(':').map(Number);
        const [dH, dM] = end.departureTime.split(':').map(Number);
        const diff = (dH * 60 + dM) - (aH * 60 + aM);
        if (diff > 0 && diff < 120) {
          haltMinutes = diff;
        }
      } catch {
        haltMinutes = undefined;
      }
    }

    segments.push({
      index: i,
      startStation: start,
      endStation: end,
      distanceKm: segmentLengthKm,
      isCurrentSegment,
      isCompleted,
      isUpcoming,
      trainDistanceCoveredInSegmentKm: coveredInSegment,
      trainDistanceRemainingInSegmentKm: remainingInSegment,
      segmentProgressPercent: segProgress,
      etaNextStation: isCurrentSegment ? liveStatus?.nextStation?.eta || end.arrivalTime : end.arrivalTime,
      nextStationHaltMinutes: haltMinutes,
    });
  }

  return segments;
}
