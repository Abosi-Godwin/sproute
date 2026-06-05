import { create } from "zustand";
import { persist } from "zustand/middleware";

const FREE_AI_LIMIT = 10;
const FREE_LEADS_LIMIT = 50;

interface UsageStore {
    aiGenerationsToday: number;
    lastGenerationDate: string | null;
    incrementAiGenerations: () => void;
    canGenerateAi: (totalLeads: number) => boolean;
    remainingAiGenerations: () => number;
    isLeadsLimitReached: (totalLeads: number) => boolean;
    resetIfNewDay: () => void;
}

export const useUsageStore = create<UsageStore>()(
    persist(
        (set, get) => ({
            aiGenerationsToday: 0,
            lastGenerationDate: null,

            resetIfNewDay: () => {
                const today = new Date().toISOString().split("T")[0];
                const { lastGenerationDate } = get();
                if (lastGenerationDate !== today) {
                    set({ aiGenerationsToday: 0, lastGenerationDate: today });
                }
            },

            incrementAiGenerations: () => {
                const today = new Date().toISOString().split("T")[0];
                const { lastGenerationDate, aiGenerationsToday } = get();
                if (lastGenerationDate !== today) {
                    set({ aiGenerationsToday: 1, lastGenerationDate: today });
                } else {
                    set({ aiGenerationsToday: aiGenerationsToday + 1 });
                }
            },

            canGenerateAi: () => {
                const { aiGenerationsToday, lastGenerationDate } = get();
                const today = new Date().toISOString().split("T")[0];
                if (lastGenerationDate !== today) return true;
                return aiGenerationsToday < FREE_AI_LIMIT;
            },

            remainingAiGenerations: () => {
                const { aiGenerationsToday, lastGenerationDate } = get();
                const today = new Date().toISOString().split("T")[0];
                if (lastGenerationDate !== today) return FREE_AI_LIMIT;
                return Math.max(0, FREE_AI_LIMIT - aiGenerationsToday);
            },

            isLeadsLimitReached: (totalLeads: number) => {
                return totalLeads >= FREE_LEADS_LIMIT;
            }
        }),
        { name: "sproute-usage" }
    )
);

export { FREE_AI_LIMIT, FREE_LEADS_LIMIT };
