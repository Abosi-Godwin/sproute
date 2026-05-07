import { Clock, X } from 'lucide-react';
import { SearchHistory } from '../../types';
import { useSearchStore } from '../../lib/stores/useSearchStore';

interface SearchHistoryProps {
  onSelect: (query: string, location: string) => void;
}

export default function SearchHistoryBar({ onSelect }: SearchHistoryProps) {
  const { history, setQuery, setLocation } = useSearchStore();

  if (history.length === 0) return null;

  const handleSelect = (entry: SearchHistory) => {
    setQuery(entry.query);
    setLocation(entry.location);
    onSelect(entry.query, entry.location);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-base-500" />
        <p className="text-xs text-base-500 font-medium">Recent searches</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {history.map((entry, i) => (
          <button
            key={i}
            onClick={() => handleSelect(entry)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-900 border border-base-800 hover:border-base-700 transition-colors group"
          >
            <span className="text-xs text-base-300 group-hover:text-base-100 transition-colors">
              {entry.query}
            </span>
            <span className="text-xs text-base-600">·</span>
            <span className="text-xs text-base-500">{entry.location}</span>
          </button>
        ))}
      </div>
    </div>
  );
}