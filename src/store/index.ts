import { create } from 'zustand';
import { format, subDays } from 'date-fns';

interface DateRangeState {
  startDate: string;
  endDate: string;
  setDateRange: (start: string, end: string) => void;
  setPreset: (days: number) => void;
}

export const useDateRangeStore = create<DateRangeState>((set) => ({
  startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  endDate: format(new Date(), 'yyyy-MM-dd'),
  setDateRange: (start, end) => set({ startDate: start, endDate: end }),
  setPreset: (days) =>
    set({
      startDate: format(subDays(new Date(), days), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
    }),
}));

interface PlatformState {
  selectedPlatformId: number | null;
  selectedAccountId: number | null;
  setSelectedPlatform: (id: number | null) => void;
  setSelectedAccount: (id: number | null) => void;
}

export const usePlatformStore = create<PlatformState>((set) => ({
  selectedPlatformId: null,
  selectedAccountId: null,
  setSelectedPlatform: (id) => set({ selectedPlatformId: id, selectedAccountId: null }),
  setSelectedAccount: (id) => set({ selectedAccountId: id }),
}));

interface FilterState {
  contentType: string | null;
  channel: string | null;
  setContentType: (type: string | null) => void;
  setChannel: (channel: string | null) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  contentType: null,
  channel: null,
  setContentType: (type) => set({ contentType: type }),
  setChannel: (channel) => set({ channel }),
  resetFilters: () => set({ contentType: null, channel: null }),
}));
