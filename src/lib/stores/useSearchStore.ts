 import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SearchHistory } from '../../types';

interface Filters {
  noWebsiteOnly: boolean;
  hasPhone: boolean;
}

interface SearchStore {
  query: string;
  location: string;
  customLocation: string;
  locationMode: 'quick' | 'custom';
  filters: Filters;
  history: SearchHistory[];
  setQuery: (query: string) => void;
  setLocation: (location: string) => void;
  setCustomLocation: (location: string) => void;
  setLocationMode: (mode: 'quick' | 'custom') => void;
  setFilter: (key: keyof Filters, value: boolean) => void;
  clearSearch: () => void;
  addToHistory: (entry: Omit<SearchHistory, 'timestamp'>) => void;
}

export const useSearchStore = create<SearchStore>()(
  persist(
    (set) => ({
      query: '',
      location: '',
      customLocation: '',
      locationMode: 'quick',
      filters: { noWebsiteOnly: false, hasPhone: false },
      history: [],

      setQuery: (query) => set({ query }),
      setLocation: (location) => set({ location }),
      setCustomLocation: (customLocation) => set({ customLocation }),
      setLocationMode: (locationMode) => set({ locationMode }),
      setFilter: (key, value) =>
        set((state) => ({ filters: { ...state.filters, [key]: value } })),
      clearSearch: () => set({ query: '', location: '', customLocation: '' }),

      addToHistory: (entry) =>
        set((state) => {
          const filtered = state.history.filter(
            (h) => !(h.query === entry.query && h.location === entry.location)
          );
          const updated = [
            { ...entry, timestamp: new Date().toISOString() },
            ...filtered,
          ].slice(0, 5);
          return { history: updated };
        }),
    }),
    {
      name: 'sproute-search',
    }
  )
);