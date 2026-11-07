import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const FREE_AI_LIMIT = 10;
const PRO_AI_LIMIT = 50;
const FREE_LEADS_LIMIT = 50;

const todayUtc = () => new Date().toISOString().split('T')[0];

interface UsageStore {
    aiGenerationsToday: number;
    lastGenerationDate: string | null;
    incrementAiGenerations: () => void;
    syncAiUsage: (used: number) => void;
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
                const today = todayUtc();
                const { lastGenerationDate } = get();
                if (lastGenerationDate !== today) {
                    set({ aiGenerationsToday: 0, lastGenerationDate: today });
                }
            },

            incrementAiGenerations: () => {
                const today = todayUtc();
                const { lastGenerationDate, aiGenerationsToday } = get();
                if (lastGenerationDate !== today) {
                    set({ aiGenerationsToday: 1, lastGenerationDate: today });
                } else {
                    set({ aiGenerationsToday: aiGenerationsToday + 1 });
                }
            },

            syncAiUsage: (used) => {
                set({
                    aiGenerationsToday: Math.max(0, Math.floor(used)),
                    lastGenerationDate: todayUtc()
                });
            },

            canGenerateAi: (isPro) => {
                const { aiGenerationsToday, lastGenerationDate } = get();
                const limit = isPro ? PRO_AI_LIMIT : FREE_AI_LIMIT;
                if (lastGenerationDate !== todayUtc()) return true;
                return aiGenerationsToday < limit;
            },

            remainingAiGenerations: (isPro) => {
                const { aiGenerationsToday, lastGenerationDate } = get();
                const limit = isPro ? PRO_AI_LIMIT : FREE_AI_LIMIT;
                if (lastGenerationDate !== todayUtc()) return limit;
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