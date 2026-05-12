import { Search } from "lucide-react";
import { useSearchStore } from "../../lib/stores/useSearchStore";

const LOCATIONS = ["Asaba", "Lagos", "Port Harcourt", "Abuja", "Enugu"];

const CATEGORIES = [
    "Restaurant",
    "Boutique",
    "Hotel","Bar",
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

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-4">
            {/* Inputs */}
            <div className="flex flex-col gap-3">
                <input
                    type="text"
                    placeholder="e.g. restaurant, salon, pharmacy"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
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
                            onClick={() => setLocationMode("custom")}
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
                            className="w-full bg-base-800 border border-base-700 rounded-lg px-4 py-2.5 text-sm text-base-100 placeholder:text-base-500 focus:outline-none focus:border-brand-500 transition-colors"
                        />
                        <button
                            onClick={() => setLocationMode("quick")}
                            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                        >
                            ← Back to quick select
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Categories */}
            <div className="space-y-2">
                <p className="text-xs text-base-500">Quick categories</p>
                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setQuery(cat)}
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

            {/* Filters */}
            <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 text-sm text-base-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={filters.noWebsiteOnly}
                        onChange={e =>
                            setFilter("noWebsiteOnly", e.target.checked)
                        }
                        className="accent-brand-500"
                    />
                    No website only
                </label>
                <label className="flex items-center gap-2 text-sm text-base-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={filters.hasPhone}
                        onChange={e => setFilter("hasPhone", e.target.checked)}
                        className="accent-brand-500"
                    />
                    Has phone
                </label>
            </div>

            <button
                onClick={onSearch}
                disabled={isGeocoding}
                className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
                <Search className="w-4 h-4" />
                {isGeocoding ? "Finding location..." : "Search"}
            </button>
        </div>
    );
}
