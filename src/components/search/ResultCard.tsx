import { MapPin, Phone, Globe, Star } from 'lucide-react';
import { SearchResult } from '../../types';
import { useLeadsStore } from '../../lib/stores/useLeadsStore';

export default function ResultCard({ result }: { result: SearchResult }) {
  const { leads, saveLead } = useLeadsStore();

  const existingLead = leads.find((l) => l.placeId === result.placeId);

  const handleSave = () => {
    if (existingLead) return;
    saveLead({
      id: crypto.randomUUID(),
      placeId: result.placeId,
      name: result.name,
      category: result.category,
      address: result.address,
      phone: result.phone,
      website: result.website,
      rating: result.rating,
      reviews: result.reviews,
      status: 'new',
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      location: '',
    });
  };

  return (
    <div className="bg-base-900 border border-base-800 rounded-xl p-5 flex flex-col gap-3 hover:border-base-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display font-semibold text-base-50 leading-snug">{result.name}</p>
          <p className="text-xs text-base-500 mt-0.5">{result.category}</p>
        </div>
        {result.rating && (
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-base-300">{result.rating}</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-base-400">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{result.address}</span>
        </div>
        {result.phone && (
          <div className="flex items-center gap-2 text-xs text-base-400">
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span>{result.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs">
          <Globe className="w-3.5 h-3.5 shrink-0 text-base-400" />
          {result.website ? (
            <span className="text-brand-400">Has website</span>
          ) : (
            <span className="text-red-400">No website</span>
          )}
        </div>
      </div>

      {/* Action */}
      {existingLead ? (
        <span className="text-xs text-center py-2 rounded-lg bg-base-800 text-base-400 capitalize">
          {existingLead.status}
        </span>
      ) : (
        <button
          onClick={handleSave}
          className="text-xs font-medium py-2 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors"
        >
          Save Lead
        </button>
      )}
    </div>
  );
}