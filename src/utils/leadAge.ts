import { Lead, LeadStatus } from "../types";

export type LeadAge = "fresh" | "warm" | "cold" | "frozen";
 
const AGING_STATUSES: LeadStatus[] = ["new"];

export function getLeadAge(savedAt: string, status: LeadStatus): LeadAge {
    if (!AGING_STATUSES.includes(status)) return "fresh";

    const days = Math.floor(
        (Date.now() - new Date(savedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (days < 2) return "fresh";
    if (days < 5) return "warm";
    if (days < 7) return "cold";
    return "frozen";
}

export const ageConfig: Record<
    LeadAge,
    { label: string; color: string } | null
> = {
    fresh: null,
    warm: null,
    cold: { label: "Going cold", color: "text-yellow-400" },
    frozen: { label: "Cold lead", color: "text-blue-400" }
};
