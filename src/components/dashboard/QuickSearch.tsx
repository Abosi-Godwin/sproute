import { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useSearchStore } from '../../lib/stores/useSearchStore';

export default function QuickSearch() {
  const [input, setInput] = useState('');
  const { setQuery } = useSearchStore();
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!input.trim()) return;
    setQuery(input.trim());
    navigate('/search');
  };

  return (
   <div className="flex gap-2">
  <input
    type="text"
    placeholder="Quick search..."
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
    className="flex-1 min-w-0 bg-base-900 border border-base-800 rounded-lg px-4 py-2.5 text-sm text-base-100 placeholder:text-base-500 focus:outline-none focus:border-brand-500 transition-colors"
  />
  <button
    onClick={handleSubmit}
    className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shrink-0"
  >
    <Search className="w-4 h-4" />
    <span className="hidden sm:inline">Search</span>
  </button>
</div>
  );
}

