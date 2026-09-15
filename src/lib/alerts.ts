import { JourneyContext, SmartAlert } from '@/types/ai';

const alertHistorySet = new Set<string>();

/**
 * Generates deduplicated Smart Alerts based strictly on real JourneyContext values.
 */
export function generateSmartAlerts(context: JourneyContext): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!context || !context.isRealDataAvailable || !context.trainNumber) {
    return [];
  }

  const trainStr = context.trainName || `Train #${context.trainNumber}`;

  // A. Next Station Approaching
  if (context.nextStation && context.etaNextStationMinutes !== null && context.etaNextStationMinutes <= 15 && context.etaNextStationMinutes > 0) {
    const alertId = `NEXT_APPROACHING_${context.trainNumber}_${context.nextStation.code}_${Math.floor(context.etaNextStationMinutes / 5)}`;
    if (!alertHistorySet.has(alertId)) {
      alertHistorySet.add(alertId);
      alerts.push({
        id: alertId,
        type: 'NEXT_APPROACHING',
        title: `Approaching ${context.nextStation.name}`,
        message: `${trainStr} is expected to arrive at ${context.nextStation.name} (${context.nextStation.code}) in ${context.etaNextStationMinutes} mins.`,
        timestamp: nowStr,
        read: false,
        severity: 'info',
      });
    }
  }

  // B. Train Arrived at Station
  if (context.currentStation) {
    const alertId = `ARRIVED_${context.trainNumber}_${context.currentStation.code}`;
    if (!alertHistorySet.has(alertId)) {
      alertHistorySet.add(alertId);
      alerts.push({
        id: alertId,
        type: 'NEXT_ARRIVED',
        title: `Arrived at ${context.currentStation.name}`,
        message: `${trainStr} has arrived at ${context.currentStation.name} (${context.currentStation.code}).`,
        timestamp: nowStr,
        read: false,
        severity: 'success',
      });
    }
  }

  // C. Delay Status Update
  if (context.delayMinutes > 20) {
    const alertId = `DELAY_INCREASED_${context.trainNumber}_${Math.floor(context.delayMinutes / 15)}`;
    if (!alertHistorySet.has(alertId)) {
      alertHistorySet.add(alertId);
      alerts.push({
        id: alertId,
        type: 'DELAY_INCREASED',
        title: `Train Running Late (${context.delayMinutes} mins)`,
        message: `${trainStr} is currently running ${context.delayMinutes} minutes behind schedule.`,
        timestamp: nowStr,
        read: false,
        severity: 'warning',
      });
    }
  } else if (context.delayMinutes === 0 && context.journeyProgressPercent > 5) {
    const alertId = `ON_TIME_${context.trainNumber}_${context.completedStops}`;
    if (!alertHistorySet.has(alertId)) {
      alertHistorySet.add(alertId);
      alerts.push({
        id: alertId,
        type: 'DELAY_REDUCED',
        title: `Train Running On Time`,
        message: `${trainStr} is maintaining its schedule on time!`,
        timestamp: nowStr,
        read: false,
        severity: 'success',
      });
    }
  }

  // D. Destination Approaching / Reached
  if (context.destination && context.remainingStops <= 2 && context.remainingStops > 0) {
    const alertId = `DEST_APPROACHING_${context.trainNumber}_${context.remainingStops}`;
    if (!alertHistorySet.has(alertId)) {
      alertHistorySet.add(alertId);
      alerts.push({
        id: alertId,
        type: 'DESTINATION_APPROACHING',
        title: `Destination Approaching (${context.remainingStops} stops away)`,
        message: `Your destination ${context.destination.name} is ${context.remainingStops} stop(s) away (${context.distanceRemainingKm} km remaining). Please gather your belongings!`,
        timestamp: nowStr,
        read: false,
        severity: 'urgent',
      });
    }
  }

  if (context.journeyState === 'COMPLETED' || context.journeyProgressPercent >= 100) {
    const alertId = `DEST_REACHED_${context.trainNumber}`;
    if (!alertHistorySet.has(alertId)) {
      alertHistorySet.add(alertId);
      alerts.push({
        id: alertId,
        type: 'DESTINATION_REACHED',
        title: `Journey Completed!`,
        message: `${trainStr} has reached its final destination ${context.destination?.name || ''}. Thank you for traveling with RailRadar!`,
        timestamp: nowStr,
        read: false,
        severity: 'success',
      });
    }
  }

  // E. Platform changed (STRICTLY real data)
  if (context.currentStationPlatform) {
    const alertId = `PLATFORM_${context.trainNumber}_${context.currentStation?.code}_${context.currentStationPlatform}`;
    if (!alertHistorySet.has(alertId)) {
      alertHistorySet.add(alertId);
      alerts.push({
        id: alertId,
        type: 'PLATFORM_CHANGED',
        title: `Platform Info Updated`,
        message: `${trainStr} at ${context.currentStation?.name} is on Platform ${context.currentStationPlatform}.`,
        timestamp: nowStr,
        read: false,
        severity: 'info',
      });
    }
  }

  return alerts;
}
