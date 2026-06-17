import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const FREE_AI_LIMIT = 10;
const PRO_AI_LIMIT = 50;
const FREE_LEADS_LIMIT = 50;

interface UsageStore {
    aiGenerationsToday: number;
    lastGenerationDate: string | null;
    incrementAiGenerations: () => void;
    canGenerateAi: (isPro: boolean) => boolean;
    remainingAiGenerations: (isPro: boolean) => number;
    isLeadsLimitReached: (totalLeads: number, isPro: boolean) => boolean;
    resetIfNewDay: () => void;
}

export const useUsageStore = create<UsageStore>()(
    persist(
        (set, get) => ({
            aiGenerationsToday: 0,
            lastGenerationDate: null,

            resetIfNewDay: () => {
                const today = new Date().toISOString().split('T')[0];
                const { lastGenerationDate } = get();
                if (lastGenerationDate !== today) {
                    set({ aiGenerationsToday: 0, lastGenerationDate: today });
                }
            },

            incrementAiGenerations: () => {
                const today = new Date().toISOString().split('T')[0];
                const { lastGenerationDate, aiGenerationsToday } = get();
                if (lastGenerationDate !== today) {
                    set({ aiGenerationsToday: 1, lastGenerationDate: today });
                } else {
                    set({ aiGenerationsToday: aiGenerationsToday + 1 });
                }
            },

            canGenerateAi: (isPro) => {
                const { aiGenerationsToday, lastGenerationDate } = get();
                const today = new Date().toISOString().split('T')[0];
                const limit = isPro ? PRO_AI_LIMIT : FREE_AI_LIMIT;
                if (lastGenerationDate !== today) return true;
                return aiGenerationsToday < limit;
            },

            remainingAiGenerations: (isPro) => {
                const { aiGenerationsToday, lastGenerationDate } = get();
                const today = new Date().toISOString().split('T')[0];
                const limit = isPro ? PRO_AI_LIMIT : FREE_AI_LIMIT;
                if (lastGenerationDate !== today) return limit;
                return Math.max(0, limit - aiGenerationsToday);
            },

            isLeadsLimitReached: (totalLeads, isPro) => {
                if (isPro) return false;
                return totalLeads >= FREE_LEADS_LIMIT;
            },
        }),
        { name: 'sproute-usage' }
    )
);

export { FREE_AI_LIMIT, PRO_AI_LIMIT, FREE_LEADS_LIMIT };