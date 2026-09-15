import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PnrStatus } from '@/types/pnr';

export interface ActiveJourney {
  pnr: string;
  status: PnrStatus;
  createdAt: string;
  updatedAt: string;
}

interface JourneyState {
  journeys: ActiveJourney[];
  addOrUpdateJourney: (status: PnrStatus) => void;
  removeJourney: (pnr: string) => void;
  markCompleted: (pnr: string) => void;
  clearAllJourneys: () => void;
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => ({
      journeys: [],

      addOrUpdateJourney: (pnrStatus) => {
        const { journeys } = get();
        const existingIndex = journeys.findIndex((j) => j.pnr === pnrStatus.pnr);
        const now = new Date().toISOString();

        if (existingIndex !== -1) {
          const updated = [...journeys];
          updated[existingIndex] = {
            ...updated[existingIndex],
            status: pnrStatus,
            updatedAt: now,
          };
          set({ journeys: updated });
        } else {
          set({
            journeys: [
              {
                pnr: pnrStatus.pnr,
                status: pnrStatus,
                createdAt: now,
                updatedAt: now,
              },
              ...journeys,
            ],
          });
        }
      },

      removeJourney: (pnr) => {
        set({ journeys: get().journeys.filter((j) => j.pnr !== pnr) });
      },

      markCompleted: (pnr) => {
        const { journeys } = get();
        set({
          journeys: journeys.map((j) =>
            j.pnr === pnr
              ? {
                  ...j,
                  status: { ...j.status, journeyState: 'COMPLETED' },
                  updatedAt: new Date().toISOString(),
                }
              : j
          ),
        });
      },

      clearAllJourneys: () => set({ journeys: [] }),
    }),
    {
      name: 'railradar-journeys-storage',
    }
  )
);
