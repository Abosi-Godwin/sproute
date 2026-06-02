import { Lead, LeadPainPoints, SearchResult } from '../types';

export function derivePainPoints(lead: Lead | SearchResult): LeadPainPoints {
    const rating = lead.rating ?? 0;
    const reviews = lead.reviews ?? 0;

    return {
        noWebsite: !lead.website,
        unclaimedListing: lead.unclaimedListing ?? false,
        establishedBusiness: reviews >= 100,
        activeCustomers: reviews >= 30,
        excellentReputation: rating >= 4.5,
        strongReputation: rating >= 4.0,
        lowVisibility: !lead.website && reviews < 10,
    };
}

export function painPointsToContext(points: LeadPainPoints): string {
    const signals: string[] = [];

    if (points.noWebsite) signals.push('No website');
    if (points.unclaimedListing) signals.push('Unclaimed Google listing');
    if (points.establishedBusiness) signals.push('Established business with 100+ reviews');
    else if (points.activeCustomers) signals.push('Active business with 30+ reviews');
    if (points.excellentReputation) signals.push('Excellent reputation (4.5+ stars)');
    else if (points.strongReputation) signals.push('Strong reputation (4.0+ stars)');
    if (points.lowVisibility) signals.push('Low online visibility');

    return signals.length > 0 ? signals.join(', ') : 'No specific signals';
}