import { Lead } from '../types';
import { SearchResult } from '../types';

export type OpportunityTier = 'hot' | 'warm' | 'low';

export interface TierConfig {
    label: string;
    color: string;
    bg: string;
    border: string;
}

export const tierConfig: Record<OpportunityTier, TierConfig> = {
    hot: {
        label: 'Hot Prospect',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30',
    },
    warm: {
        label: 'Worth Contacting',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
    },
    low: {
        label: 'Low Priority',
        color: 'text-base-500',
        bg: 'bg-base-800',
        border: 'border-base-700',
    },
};

export function getTier(score: number): OpportunityTier {
    if (score >= 7) return 'hot';
    if (score >= 4) return 'warm';
    return 'low';
}

export function scoreLead(lead: Lead): number {
    let score = 0;

    // Primary signal — no website but active business
    if (!lead.website) score += 4;

    // Reputation signals — strong business means they can afford help
    if ((lead.rating ?? 0) >= 4.5) score += 3;
    else if ((lead.rating ?? 0) >= 4.0) score += 2;
    else if ((lead.rating ?? 0) < 3.5 && (lead.rating ?? 0) > 0) score -= 2;

    // Activity signals — reviews mean real customers
    if ((lead.reviews ?? 0) >= 100) score += 3;
    else if ((lead.reviews ?? 0) >= 30) score += 2;
    else if ((lead.reviews ?? 0) >= 10) score += 1;
    else if ((lead.reviews ?? 0) < 5 && (lead.reviews ?? 0) > 0) score -= 1;

    // Reachable
    if (lead.phone) score += 1;

    // Owner not engaged
    if (lead.unclaimedListing) score += 1;

    // Has website — less urgent need
    if (lead.website) score -= 3;

    return Math.max(0, Math.min(score, 10));
}

export function scoreSearchResult(result: SearchResult): number {
    let score = 0;

    if (!result.website) score += 4;

    if ((result.rating ?? 0) >= 4.5) score += 3;
    else if ((result.rating ?? 0) >= 4.0) score += 2;
    else if ((result.rating ?? 0) < 3.5 && (result.rating ?? 0) > 0) score -= 2;

    if ((result.reviews ?? 0) >= 100) score += 3;
    else if ((result.reviews ?? 0) >= 30) score += 2;
    else if ((result.reviews ?? 0) >= 10) score += 1;
    else if ((result.reviews ?? 0) < 5 && (result.reviews ?? 0) > 0) score -= 1;

    if (result.phone) score += 1;
    if (result.unclaimedListing) score += 1;
    if (result.website) score -= 3;

    return Math.max(0, Math.min(score, 10));
}

export function getOpportunityReasons(lead: Lead | SearchResult): string[] {
    const reasons: string[] = [];

    if (!lead.website) reasons.push('No website');
    if ((lead.rating ?? 0) >= 4.5) reasons.push('Excellent reputation');
    else if ((lead.rating ?? 0) >= 4.0) reasons.push('Strong reputation');
    if ((lead.reviews ?? 0) >= 100) reasons.push('High customer activity');
    else if ((lead.reviews ?? 0) >= 30) reasons.push('Decent customer activity');
    if (lead.phone) reasons.push('Direct contact available');
    if (lead.unclaimedListing) reasons.push('Unclaimed listing');

    return reasons;
}

export function getScoreColor(score: number): string {
    if (score >= 7) return 'text-orange-400';
    if (score >= 4) return 'text-yellow-400';
    return 'text-base-500';
}

export function getScoreBg(score: number): string {
    if (score >= 7) return 'bg-orange-500/10';
    if (score >= 4) return 'bg-yellow-500/10';
    return 'bg-base-800';
}