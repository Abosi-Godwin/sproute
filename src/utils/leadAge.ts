export type LeadAge = "fresh" | "warm" | "cold" | "frozen";

export function getLeadAge(savedAt: string, status: string): LeadAge {
    if (status !== "new") return "fresh";

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
    fresh: null, // no badge
    warm: null, // no badge
    cold: { label: "Going cold", color: "text-yellow-400" },
    frozen: { label: "Cold lead", color: "text-blue-400" }
};
