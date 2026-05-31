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

    if (!lead.website) score += 4;
    if (lead.phone) score += 1;
    if (lead.unclaimedListing) score += 2;

    if ((lead.rating ?? 0) >= 4.5) score += 3;
    else if ((lead.rating ?? 0) >= 4.0) score += 2;

    if ((lead.reviews ?? 0) > 100) score += 3;
    else if ((lead.reviews ?? 0) > 20) score += 2;

    if (lead.website) score -= 3;

    return Math.max(0, Math.min(score, 10));
}

export function scoreSearchResult(result: SearchResult): number {
    let score = 0;

    if (!result.website) score += 4;
    if (result.phone) score += 1;
    if (result.unclaimedListing) score += 2;

    if ((result.rating ?? 0) >= 4.5) score += 3;
    else if ((result.rating ?? 0) >= 4.0) score += 2;

    if ((result.reviews ?? 0) > 100) score += 3;
    else if ((result.reviews ?? 0) > 20) score += 2;

    if (result.website) score -= 3;

    return Math.max(0, Math.min(score, 10));
}

export function getOpportunityReasons(lead: Lead | SearchResult): string[] {
    const reasons: string[] = [];

    if (!lead.website) reasons.push('No website — clear gap to fill');
    if (lead.unclaimedListing) reasons.push('Unclaimed Google listing');
    if ((lead.reviews ?? 0) > 100) reasons.push('High customer activity');
    else if ((lead.reviews ?? 0) > 20) reasons.push('Decent customer activity');
    if ((lead.rating ?? 0) >= 4.5) reasons.push('Excellent reputation');
    else if ((lead.rating ?? 0) >= 4.0) reasons.push('Strong reputation');
    if (lead.phone) reasons.push('Direct contact available');
    if (lead.website) reasons.push('Already has a website');

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