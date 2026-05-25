import { useState } from "react";
import {
    MapPin, Phone, Globe, Star,
    ShieldAlert, TrendingUp, AlarmClock
} from "lucide-react";
import { SearchResult } from "../../types";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { scoreSearchResult, getScoreColor, getScoreBg } from "../../utils/leadScore";

interface ResultCardProps {
    result: SearchResult;
    searchQuery: string;
    searchLocation: string;
}

export default function ResultCard({ result, searchQuery, searchLocation }: ResultCardProps) {
    const { leads, saveLead } = useLeadsStore();
    const [isSaving, setIsSaving] = useState(false);

    const existingLead = leads.find(l => l.placeId === result.placeId);
    const score = scoreSearchResult(result);

    const handleSave = async () => {
        if (existingLead || isSaving) return;
        setIsSaving(true);
        await saveLead({
            id: crypto.randomUUID(),
            placeId: result.placeId,
            name: result.name,
            category: result.category,
            address: result.address,
            phone: result.phone,
            website: result.website,
            rating: result.rating,
            reviews: result.reviews,
            status: "new",
            savedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            location: "",
            searchQuery,
            searchLocation,
            unclaimedListing: result.unclaimedListing,
        });
        setIsSaving(false);
    };

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-4 flex flex-col gap-3 hover:border-base-700 transition-colors">

            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold text-base-50 leading-snug truncate">
                        {result.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-base-500">{result.category}</span>
                        {result.rating && (
                            <>
                                <span className="text-base-700 text-xs">·</span>
                                <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <span className="text-xs text-base-400">{result.rating}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Score */}
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg shrink-0 ${getScoreBg(score)}`}>
                    <TrendingUp className={`w-3 h-3 ${getScoreColor(score)}`} />
                    <span className={`text-xs font-semibold ${getScoreColor(score)}`}>{score}</span>
                </div>
            </div>

            {/* Badge strip */}
            {result.unclaimedListing && (
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-yellow-400 bg-yellow-500/10">
                        <ShieldAlert className="w-3 h-3" />
                        Unclaimed
                    </span>
                </div>
            )}

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
                    {result.website
                        ? <span className="text-brand-400">Has website</span>
                        : <span className="text-blue-400">No website — opportunity</span>
                    }
                </div>
            </div>

            {/* Action */}
            {existingLead ? (
                <span className="text-xs text-center py-2 rounded-lg bg-base-800 text-base-400 capitalize">
                    {existingLead.status.replace(/_/g, " ")}
                </span>
            ) : (
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="text-xs font-medium py-2 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 disabled:opacity-50 transition-colors"
                >
                    {isSaving ? "Saving..." : "Save Lead"}
                </button>
            )}
        </div>
    );
}