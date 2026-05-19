 import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OutreachTone = 'casual' | 'formal' | 'pidgin';

interface SettingsStore {
  defaultLocation: string;
  outreachTone: OutreachTone;
  followUpDays: number;
  serviceDescription: string;
  dailyGoal: number;
  currentStreak: number;
  lastActiveDate: string | null;
  setDefaultLocation: (location: string) => void;
  setOutreachTone: (tone: OutreachTone) => void;
  setFollowUpDays: (days: number) => void;
  setServiceDescription: (description: string) => void;
  setDailyGoal: (goal: number) => void;
  recordOutreachActivity: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      defaultLocation: '',
      outreachTone: 'casual',
      followUpDays: 2,
      serviceDescription: '',
      dailyGoal: 10,
      currentStreak: 0,
      lastActiveDate: null,

      setDefaultLocation: (defaultLocation) => set({ defaultLocation }),
      setOutreachTone: (outreachTone) => set({ outreachTone }),
      setFollowUpDays: (followUpDays) => set({ followUpDays }),
      setServiceDescription: (serviceDescription) => set({ serviceDescription }),
      setDailyGoal: (dailyGoal) => set({ dailyGoal }),

      recordOutreachActivity: () => {
        const today = new Date().toISOString().split('T')[0];
        const { lastActiveDate, currentStreak } = get();

        if (lastActiveDate === today) return; // already recorded today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const newStreak = lastActiveDate === yesterdayStr
          ? currentStreak + 1  // consecutive day
          : 1;                  // streak broken, restart

        set({ currentStreak: newStreak, lastActiveDate: today });
      },
    }),
    { name: 'sproute-settings' }
  )
);