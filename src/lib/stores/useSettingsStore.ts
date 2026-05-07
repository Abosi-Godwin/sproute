 import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OutreachTone = 'casual' | 'formal' | 'pidgin';

interface SettingsStore {
  claudeApiKey: string;
  defaultLocation: string;
  outreachTone: OutreachTone;
  setClaudeApiKey: (key: string) => void;
  setDefaultLocation: (location: string) => void;
  setOutreachTone: (tone: OutreachTone) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      claudeApiKey: '',
      defaultLocation: '',
      outreachTone: 'casual',
      setClaudeApiKey: (claudeApiKey) => set({ claudeApiKey }),
      setDefaultLocation: (defaultLocation) => set({ defaultLocation }),
      setOutreachTone: (outreachTone) => set({ outreachTone }),
    }),
    { name: 'sproute-settings' }
  )
);