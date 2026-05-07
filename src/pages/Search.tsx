import { useState } from "react";
import { useSearchStore } from "../lib/stores/useSearchStore";
import { useSearchQuery } from "../hooks/useSearchQuery";
import { geocodeLocation } from "../api/geocode";
import { getCityLL } from "../api/serpapi";
import SearchBar from "../components/search/SearchBar";
import SearchHistoryBar from "../components/search/SearchHistory";
import ResultsGrid from "../components/search/ResultsGrid";
import { Loader2 } from "lucide-react";
import { SearchResult } from "../types";

import EmptySearch from "../components/search/EmptySearch";
export default function Search() {
    const {
        query,
        location,
        customLocation,
        locationMode,
        addToHistory,
        clearSearch
    } = useSearchStore();

    const [searchParams, setSearchParams] = useState<{
        query: string;
        ll: string;
        locationLabel: string;
    } | null>(null);

    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodeError, setGeocodeError] = useState("");

    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useSearchQuery(
        searchParams?.query ?? "",
        searchParams?.ll ?? "",
        !!searchParams
    );

    const handleSearch = async () => {
        if (!query) return;
        setGeocodeError("");

        let ll = "";
        let locationLabel = "";

        if (locationMode === "quick") {
            if (!location) return;
            ll = getCityLL(location);
            locationLabel = location;
        } else {
            if (!customLocation) return;
            setIsGeocoding(true);
            try {
                const result = await geocodeLocation(customLocation);
                ll = result.ll;
                locationLabel = customLocation;
            } catch (err: any) {
                setGeocodeError(err.message);
                setIsGeocoding(false);
                return;
            } finally {
                setIsGeocoding(false);
            }
        }

        addToHistory({ query, location: locationLabel });
        setSearchParams({ query, ll, locationLabel });
        clearSearch();
    };

    const handleHistorySelect = async (q: string, l: string) => {
        setGeocodeError("");
        const ll = getCityLL(l);
        addToHistory({ query: q, location: l });
        setSearchParams({ query: q, ll, locationLabel: l });
    };

    const allResults: SearchResult[] =
        data?.pages.flatMap(p => p.results) ?? [];

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="font-display text-2xl font-bold text-base-50">
                    Search
                </h1>
                <p className="text-sm text-base-400 mt-1">
                    Discover local businesses to prospect
                </p>
            </div>

            <SearchBar onSearch={handleSearch} isGeocoding={isGeocoding} />

            {geocodeError && (
                <p className="text-sm text-red-400 text-center">
                    {geocodeError}
                </p>
            )}

            <SearchHistoryBar onSelect={handleHistorySelect} />
{isLoading && (
  <div className="flex justify-center py-12">
    <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
  </div>
)}

{error && (
  <p className="text-center text-red-400 text-sm py-6">
    Search failed. Check your API key or network.
  </p>
)}

{!isLoading && !error && allResults.length === 0 && (
  <EmptySearch searched={!!searchParams} />
)}

{allResults.length > 0 && (
  <div className="space-y-6">
    {searchParams && (
      <p className="text-xs text-base-500">
        Showing results for <span className="text-base-300">"{searchParams.query}"</span> in <span className="text-base-300">{searchParams.locationLabel}</span>
      </p>
    )}
    <ResultsGrid results={allResults} />
    {hasNextPage && (
      <div className="flex justify-center">
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-base-900 border border-base-800 text-sm font-medium text-base-300 hover:text-base-100 hover:border-base-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isFetchingNextPage
            ? <><Loader2 className="w-4 h-4 animate-spin" />Loading...</>
            : 'Load More'
          }
        </button>
      </div>
    )}
    {!hasNextPage && allResults.length > 0 && (
      <p className="text-center text-xs text-base-600 pb-4">
        All results loaded — {allResults.length} businesses found.
      </p>
    )}
  </div>
)}
        </div>
    );
}
