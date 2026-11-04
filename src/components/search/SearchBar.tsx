import { Search } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchStore } from "../../lib/stores/useSearchStore";
import { posthog } from "../../lib/posthog";

const LOCATIONS = ["Asaba", "Lagos", "Port Harcourt", "Abuja", "Enugu"];

const CATEGORIES = [
    "Restaurant",
    "Boutique",
    "Hotel",
    "Bar",
    "Pharmacy",
    "Salon",
    "Supermarket",
    "Church",
    "School",
    "Mechanic",
    "Bakery",
    "Gym",
    "Hospital",
    "Spa",
    "Laundry"
];

interface SearchBarProps {
    onSearch: () => void;
    isGeocoding?: boolean;
}

export default function SearchBar({ onSearch, isGeocoding }: SearchBarProps) {
    const {
        query,
        location,
        customLocation,
        locationMode,
        filters,
        setQuery,
        setLocation,
        setCustomLocation,
        setLocationMode,
        setFilter
    } = useSearchStore();

    const handleSubmit = () => {
        if (isGeocoding) return;

        if (!query.trim()) {
            posthog.capture("search_blocked", { reason: "missing_query" });
            toast.error("Enter what you want to search for");
            return;
        }

        const hasLocation =
            locationMode === "quick"
                ? Boolean(location)
                : Boolean(customLocation.trim());

        if (!hasLocation) {
            posthog.capture("search_blocked", {
                reason: "missing_location",
                location_mode: locationMode
            });
            toast.error("Select a location");
            return;
        }

        onSearch();
    };

    const handleCategory = (cat: string) => {
        posthog.capture("search_category_selected", { category: cat });
        setQuery(cat);
    };

    const handleLocationMode = (mode: "quick" | "custom") => {
        posthog.capture("search_location_mode_changed", { mode });
        setLocationMode(mode);
    };

    const handleFilter = (
        key: "noWebsiteOnly" | "hasPhone",
        value: boolean
    ) => {
        posthog.capture("search_filter_changed", { filter: key, value });
        setFilter(key, value);
    };

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col gap-3">
                <input
                    type="text"
                    placeholder="e.g. restaurant, salon, pharmacy"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    className="w-full bg-base-800 border border-base-700 rounded-lg px-4 py-2.5 text-sm text-base-100 placeholder:text-base-500 focus:outline-none focus:border-brand-500 transition-colors"
                />

                {locationMode === "quick" ? (
                    <div className="space-y-1.5">
                        <select
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            className="w-full bg-base-800 border border-base-700 rounded-lg px-4 py-2.5 text-sm text-base-100 focus:outline-none focus:border-brand-500 transition-colors"
                        >
                            <option value="">Select location</option>
                            {LOCATIONS.map(loc => (
                                <option key={loc} value={loc}>
                                    {loc}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => handleLocationMode("custom")}
                            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                        >
                            Type a different location →
                        </button>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <input
                            type="text"
                            placeholder="e.g. Warri, Benin City, Sapele..."
                            value={customLocation}
                            onChange={e => setCustomLocation(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSubmit()}
                            className="w-full bg-base-800 border border-base-700 rounded-lg px-4 py-2.5 text-sm text-base-100 placeholder:text-base-500 focus:outline-none focus:border-brand-500 transition-colors"
                        />
                        <button
                            onClick={() => handleLocationMode("quick")}
                            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                        >
                            ← Back to quick select
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <p className="text-xs text-base-500">Quick categories</p>
                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => handleCategory(cat)}
                            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                                query === cat
                                    ? "bg-brand-500/10 text-brand-400"
                                    : "bg-base-800 text-base-500 hover:text-base-300"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 text-sm text-base-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={filters.noWebsiteOnly}
                        onChange={e =>
                            handleFilter("noWebsiteOnly", e.target.checked)
                        }
                        className="accent-brand-500"
                    />
                    No website only
                </label>
                <label className="flex items-center gap-2 text-sm text-base-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={filters.hasPhone}
                        onChange={e =>
                            handleFilter("hasPhone", e.target.checked)
                        }
                        className="accent-brand-500"
                    />
                    Has phone
                </label>
            </div>

            <button
                onClick={handleSubmit}
                disabled={isGeocoding}
                className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
                <Search className="w-4 h-4" />
                {isGeocoding ? "Finding location..." : "Search"}
            </button>
        </div>
    );
}