import { Lead } from '../types';
import { SearchResult } from '../types';

export function scoreSearchResult(result: SearchResult): number {
  let score = 0;

  if (!result.website) score += 3;
  if (result.unclaimedListing) score += 2;
  if (result.phone) score += 1;
  if (result.rating && result.rating < 3.5) score += 1;
  if (result.reviews && result.reviews < 10) score += 1;
  if (result.reviews && result.reviews > 100) score -= 1;

  return Math.max(0, Math.min(score, 10));
}

export function scoreLead(lead: Lead): number {
  let score = 0;

  if (!lead.website) score += 3;
  if (lead.unclaimedListing) score += 2;
  if (lead.phone) score += 1;
  if (lead.rating && lead.rating < 3.5) score += 1;
  if (lead.reviews && lead.reviews < 10) score += 1;
  if (lead.reviews && lead.reviews > 100) score -= 1;

  return Math.max(0, Math.min(score, 10));
}

export function getScoreColor(score: number): string {
  if (score >= 7) return 'text-brand-400';
  if (score >= 4) return 'text-yellow-400';
  return 'text-base-500';
}

export function getScoreBg(score: number): string {
  if (score >= 7) return 'bg-brand-500/10';
  if (score >= 4) return 'bg-yellow-500/10';
  return 'bg-base-800';
}