import { SearchResult } from '../../types';

export default function ResultsSummary({ results }: { results: SearchResult[] }) {
  if (results.length === 0) return null;

  const noWebsite = results.filter(r => !r.website).length;
  const hasPhone = results.filter(r => r.phone).length;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs font-medium text-base-300">
        {results.length} results
      </span>
      <span className="text-xs text-base-600">·</span>
      <span className="text-xs text-red-400 font-medium">
        {noWebsite} no website
      </span>
      <span className="text-xs text-base-600">·</span>
      <span className="text-xs text-brand-400 font-medium">
        {hasPhone} has phone
      </span>
    </div>
  );
}