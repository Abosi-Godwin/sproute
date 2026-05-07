import { create } from 'zustand';
import { LeadStatus } from '../../types';

interface LeadsFilterStore {
  selectedStatus: LeadStatus | 'all';
  noWebsiteOnly: boolean;
  hasPhoneOnly: boolean;
  groupBy: 'status' | 'category';
  setSelectedStatus: (status: LeadStatus | 'all') => void;
  setNoWebsiteOnly: (value: boolean) => void;
  setHasPhoneOnly: (value: boolean) => void;
  setGroupBy: (value: 'status' | 'category') => void;
}

export const useLeadsFilterStore = create<LeadsFilterStore>((set) => ({
  selectedStatus: 'all',
  noWebsiteOnly: false,
  hasPhoneOnly: false,
  groupBy: 'status',
  setSelectedStatus: (selectedStatus) => set({ selectedStatus }),
  setNoWebsiteOnly: (noWebsiteOnly) => set({ noWebsiteOnly }),
  setHasPhoneOnly: (hasPhoneOnly) => set({ hasPhoneOnly }),
  setGroupBy: (groupBy) => set({ groupBy }),
}));