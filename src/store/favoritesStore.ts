import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Train } from '@/types/train';

interface FavoritesState {
  favorites: Train[];
  recentSearches: string[];
  selectedTrainNumber: string | null;
  setSelectedTrainNumber: (trainNumber: string) => void;
  addFavorite: (train: Train) => void;
  removeFavorite: (trainNumber: string) => void;
  isFavorite: (trainNumber: string) => boolean;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [
        {
          id: '12301',
          number: '12301',
          name: 'Howrah Rajdhani Express',
          source: { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata' },
          destination: { code: 'NDLS', name: 'New Delhi', city: 'Delhi' },
          totalDistanceKm: 1451,
          runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          classes: ['1A', '2A', '3A'],
          avgSpeedKmH: 85,
        },
        {
          id: '12951',
          number: '12951',
          name: 'Mumbai Tejas Rajdhani Express',
          source: { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai' },
          destination: { code: 'NDLS', name: 'New Delhi', city: 'Delhi' },
          totalDistanceKm: 1386,
          runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          classes: ['1A', '2A', '3A'],
          avgSpeedKmH: 89,
        },
      ],
      recentSearches: ['12301', 'Rajdhani', 'Shatabdi', '12951'],
      selectedTrainNumber: '12301', // Default to initial train or null

      setSelectedTrainNumber: (trainNumber) => {
        if (trainNumber && trainNumber.trim()) {
          set({ selectedTrainNumber: trainNumber.trim() });
        }
      },

      addFavorite: (train) => {
        const { favorites } = get();
        if (!favorites.some((f) => f.number === train.number)) {
          set({ favorites: [...favorites, train] });
        }
      },

      removeFavorite: (trainNumber) => {
        set({ favorites: get().favorites.filter((f) => f.number !== trainNumber) });
      },

      isFavorite: (trainNumber) => {
        return get().favorites.some((f) => f.number === trainNumber);
      },

      addRecentSearch: (query) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        const current = get().recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
        set({ recentSearches: [trimmed, ...current].slice(0, 8) });
      },

      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'train-favorites-storage',
    }
  )
);
