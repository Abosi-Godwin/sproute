import { useEffect, useState } from "react";
import { useSearchStore } from "../lib/stores/useSearchStore";
import { useSearchQuery } from "../hooks/useSearchQuery";
import { geocodeLocation } from "../api/geocode";
import { getCityLL } from "../api/serpapi";
import SearchBar from "../components/search/SearchBar";
import SearchHistoryBar from "../components/search/SearchHistory";
import ResultsGrid from "../components/search/ResultsGrid";
import ResultsSummary from "../components/search/ResultsSummary";
import EmptySearch from "../components/search/EmptySearch";
import { Loader2 } from "lucide-react";
import { SearchResult } from "../types";
import { scoreSearchResult, getTier } from "../utils/leadScore";
import { posthog } from "../lib/posthog";
import toast from "react-hot-toast";

const getSearchError = (err: any) => {
    const message = err?.message ?? "";
    if (message.includes("401") || message.includes("403"))
        return "Search API key error";
    if (message.includes("429") || message.toLowerCase().includes("quota"))
        return "Search limit reached for today";
    if (message.includes("network") || message.includes("fetch"))
        return "Network error. Check your connection";
    return "Search failed, try again";
};

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

    const {
        data,
        isLoading,
        error,
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useSearchQuery(
        searchParams?.query ?? "",
        searchParams?.ll ?? "",
        !!searchParams
    );

    const allResults: SearchResult[] =
        data?.pages.flatMap(p => p.results) ?? [];

    useEffect(() => {
        if (!error || !searchParams) return;
        posthog.capture("search_failed", {
            query: searchParams.query,
            location: searchParams.locationLabel,
            reason: getSearchError(error),
            message: (error as any)?.message ?? ""
        });
    }, [error]);

    useEffect(() => {
        if (!searchParams || isLoading || error || !data) return;
        if (allResults.length === 0) {
            posthog.capture("search_no_results", {
                query: searchParams.query,
                location: searchParams.locationLabel
            });
        }
    }, [data]);

    const handleSearch = async () => {
        if (!query) return;

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
                posthog.capture("search_location_failed", {
                    location: customLocation,
                    source: "form",
                    message: err?.message ?? ""
                });
                toast.error(err?.message ?? "Couldn't find that location");
                return;
            } finally {
                setIsGeocoding(false);
            }
        }

        posthog.capture("search_performed", {
            query,
            location: locationLabel,
            location_mode: locationMode,
            source: "form"
        });

        addToHistory({ query, location: locationLabel });
        setSearchParams({ query, ll, locationLabel });
        clearSearch();
    };

    const handleHistorySelect = async (q: string, l: string) => {
        let ll = getCityLL(l);

        if (!ll) {
            setIsGeocoding(true);
            try {
                const result = await geocodeLocation(l);
                ll = result.ll;
            } catch (err: any) {
                posthog.capture("search_location_failed", {
                    location: l,
                    source: "history",
                    message: err?.message ?? ""
                });
                toast.error(err?.message ?? "Couldn't find that location");
                return;
            } finally {
                setIsGeocoding(false);
            }
        }

        posthog.capture("search_performed", {
            query: q,
            location: l,
            source: "history"
        });

        addToHistory({ query: q, location: l });
        setSearchParams({ query: q, ll, locationLabel: l });
    };

    const handleLoadMore = () => {
        posthog.capture("search_load_more", {
            query: searchParams?.query,
            location: searchParams?.locationLabel,
            loaded: allResults.length
        });
        fetchNextPage();
    };

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

            <SearchHistoryBar onSelect={handleHistorySelect} />

            {isLoading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
                </div>
            )}

            {error && (
                <div className="text-center py-6 space-y-2">
                    <p className="text-sm text-red-400">
                        {getSearchError(error)}
                    </p>
                    <button
                        onClick={() => {
                            posthog.capture("search_retry", {
                                query: searchParams?.query,
                                location: searchParams?.locationLabel
                            });
                            refetch();
                        }}
                        className="text-xs text-base-500 hover:text-base-300 transition-colors underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {!isLoading && !error && allResults.length === 0 && (
                <EmptySearch searched={!!searchParams} />
            )}

            {allResults.length > 0 && (
                <div className="space-y-6">
                    {searchParams && (
                        <div className="space-y-2">
                            <p className="text-xs text-base-500">
                                Results for{" "}
                                <span className="text-base-300">
                                    "{searchParams.query}"
                                </span>{" "}
                                in{" "}
                                <span className="text-base-300">
                                    {searchParams.locationLabel}
                                </span>
                            </p>
                            <ResultsSummary results={allResults} />
                        </div>
                    )}
                    {(() => {
                        const hotCount = allResults.filter(
                            r => getTier(scoreSearchResult(r)) === "hot"
                        ).length;
                        return hotCount > 0 ? (
                            <p className="text-xs font-medium text-orange-400">
                                🔥 {hotCount} hot prospect
                                {hotCount > 1 ? "s" : ""} found
                            </p>
                        ) : null;
                    })()}
                    <ResultsGrid
                        results={allResults}
                        searchQuery={searchParams?.query ?? ""}
                        searchLocation={searchParams?.locationLabel ?? ""}
                    />

                    {hasNextPage && (
                        <div className="flex justify-center">
                            <button
                                onClick={handleLoadMore}
                                disabled={isFetchingNextPage}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-base-900 border border-base-800 text-sm font-medium text-base-300 hover:text-base-100 hover:border-base-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isFetchingNextPage ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    "Load More"
                                )}
                            </button>
                        </div>
                    )}

                    {!hasNextPage && allResults.length > 0 && (
                        <p className="text-center text-xs text-base-600 pb-4">
                            All results loaded. {allResults.length} businesses
                            found.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}