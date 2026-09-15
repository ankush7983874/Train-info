export interface Passenger {
  number: number;
  bookingStatus: string;
  currentStatus: string;
  coach?: string;
  berth?: string;
  berthType?: string;
}

export interface PnrStatus {
  pnr: string;
  trainNumber: string;
  trainName: string;
  journeyDate: string;
  source: {
    code: string;
    name: string;
  };
  destination: {
    code: string;
    name: string;
  };
  boardingStation: {
    code: string;
    name: string;
  };
  class: string;
  quota: string;
  bookingStatus: string;
  currentStatus: string;
  chartStatus: string;
  coach?: string;
  berth?: string;
  passengers: Passenger[];
  lastUpdated: string;
  journeyState: 'VERIFIED' | 'ACTIVE' | 'TRAIN_RUNNING' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';
}
