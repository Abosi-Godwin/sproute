import { Lead } from "../types";

export function getTodayMessagedCount(leads: Lead[]): number {
    const now = new Date();
    const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
    );
    const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59
    );

    return leads.filter(lead => {
        if (lead.status !== "messaged") return false;
        const updated = new Date(lead.updatedAt);
        return updated >= startOfDay && updated <= endOfDay;
    }).length;
}
