 import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OutreachTone = 'casual' | 'formal' | 'pidgin';

interface SettingsStore {
  defaultLocation: string;
  outreachTone: OutreachTone;
  followUpDays: number;
  serviceDescription: string;
  setDefaultLocation: (location: string) => void;
  setOutreachTone: (tone: OutreachTone) => void;
  setFollowUpDays: (days: number) => void;
  setServiceDescription: (description: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      defaultLocation: '',
      outreachTone: 'casual',
      followUpDays: 2,
      serviceDescription: '',
      setDefaultLocation: (defaultLocation) => set({ defaultLocation }),
      setOutreachTone: (outreachTone) => set({ outreachTone }),
      setFollowUpDays: (followUpDays) => set({ followUpDays }),
      setServiceDescription: (serviceDescription) => set({ serviceDescription }),
    }),
    { name: 'sproute-settings' }
  )
);