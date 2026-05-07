import { useState } from "react";
import { clsx } from 'clsx';
import { SearchResult } from "../../types";
import { useSearchStore } from "../../lib/stores/useSearchStore";
import ResultCard from "./ResultCard";

type SortOption = "default" | "no-website" | "has-phone" | "rating";

export default function ResultsGrid({ results }: { results: SearchResult[] }) {
    const { filters } = useSearchStore();
    const [sort, setSort] = useState<SortOption>("default");

    const filtered = results.filter(r => {
        if (filters.noWebsiteOnly && r.website) return false;
        if (filters.hasPhone && !r.phone) return false;
        return true;
    });

    const sorted = [...filtered].sort((a, b) => {
        if (sort === "no-website") {
            return (a.website ? 1 : 0) - (b.website ? 1 : 0);
        }
        if (sort === "has-phone") {
            return (b.phone ? 1 : 0) - (a.phone ? 1 : 0);
        }
        if (sort === "rating") {
            return (b.rating ?? 0) - (a.rating ?? 0);
        }
        return 0;
    });

    if (sorted.length === 0) {
        return (
            <p className="text-center text-base-500 text-sm py-12">
                No results match your filters.
            </p>
        );
    }

    const SORT_OPTIONS: { label: string; value: SortOption }[] = [
        { label: "Default", value: "default" },
        { label: "No website first", value: "no-website" },
        { label: "Has phone first", value: "has-phone" },
        { label: "Top rated", value: "rating" }
    ];

    return (
        <div className="space-y-4">
            {/* Sort controls */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-base-500">Sort:</span>
                {SORT_OPTIONS.map(option => (
                    <button
                        key={option.value}
                        onClick={() => setSort(option.value)}
                        className={clsx(
                            "text-xs px-3 py-1.5 rounded-lg transition-colors",
                            sort === option.value
                                ? "bg-brand-500/10 text-brand-400"
                                : "bg-base-800 text-base-500 hover:text-base-300"
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.map(result => (
                    <ResultCard key={result.placeId} result={result} />
                ))}
            </div>
        </div>
    );
}
