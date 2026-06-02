import { create } from 'zustand';
import { LeadStatus } from '../../types';
import { OpportunityTier } from '../../utils/leadScore';

interface LeadsFilterStore {
    selectedStatus: LeadStatus | 'all';
    noWebsiteOnly: boolean;
    hasPhoneOnly: boolean;
    followUpDueOnly: boolean;
    groupBy: 'status' | 'category';
    sortBy: 'default' | 'score';
    selectedTier: OpportunityTier | 'all';
    setSelectedStatus: (status: LeadStatus | 'all') => void;
    setNoWebsiteOnly: (value: boolean) => void;
    setHasPhoneOnly: (value: boolean) => void;
    setFollowUpDueOnly: (value: boolean) => void;
    setGroupBy: (groupBy: 'status' | 'category') => void;
    setSortBy: (sortBy: 'default' | 'score') => void;
    setSelectedTier: (tier: OpportunityTier | 'all') => void;
}

export const useLeadsFilterStore = create<LeadsFilterStore>((set) => ({
    selectedStatus: 'all',
    noWebsiteOnly: false,
    hasPhoneOnly: false,
    followUpDueOnly: false,
    groupBy: 'status',
    sortBy: 'default',
    selectedTier: 'all',
    setSelectedStatus: (selectedStatus) => set({ selectedStatus }),
    setNoWebsiteOnly: (noWebsiteOnly) => set({ noWebsiteOnly }),
    setHasPhoneOnly: (hasPhoneOnly) => set({ hasPhoneOnly }),
    setFollowUpDueOnly: (followUpDueOnly) => set({ followUpDueOnly }),
    setGroupBy: (groupBy) => set({ groupBy }),
    setSortBy: (sortBy) => set({ sortBy }),
    setSelectedTier: (selectedTier) => set({ selectedTier }),
}));