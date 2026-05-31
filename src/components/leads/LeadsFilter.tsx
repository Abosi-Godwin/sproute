import { clsx } from "clsx";
import { useLeadsFilterStore } from "../../lib/stores/useLeadsFilterStore";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { scoreLead, getTier, tierConfig, OpportunityTier } from "../../utils/leadScore";

const STATUSES = [
    { value: "all", label: "All" },
    { value: "new", label: "New" },
    { value: "messaged", label: "Messaged" },
    { value: "replied", label: "Replied" },
    { value: "converted", label: "Converted" },
    { value: "not_on_whatsapp", label: "No WhatsApp" },
    { value: "dead", label: "Dead" },
];

const TIERS: { value: OpportunityTier | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'hot', label: '🔥 Hot' },
    { value: 'warm', label: 'Warm' },
    { value: 'low', label: 'Low' },
];

export default function LeadsFilter() {
    const {
        selectedStatus,
        noWebsiteOnly,
        hasPhoneOnly,
        groupBy,
        sortBy,
        selectedTier,
        setSelectedStatus,
        setNoWebsiteOnly,
        setHasPhoneOnly,
        setGroupBy,
        setSortBy,
        setSelectedTier,
    } = useLeadsFilterStore();

    return (
        <div className="space-y-3">
            {/* Status filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {STATUSES.map(s => (
                    <button
                        key={s.value}
                        onClick={() => setSelectedStatus(s.value as any)}
                        className={clsx(
                            "text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0",
                            selectedStatus === s.value
                                ? "bg-brand-500/10 text-brand-400"
                                : "bg-base-900 border border-base-800 text-base-500 hover:text-base-300"
                        )}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Tier filter */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-base-500 shrink-0">Tier:</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {TIERS.map(t => (
                        <button
                            key={t.value}
                            onClick={() => setSelectedTier(t.value as any)}
                            className={clsx(
                                "text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0",
                                selectedTier === t.value
                                    ? "bg-brand-500/10 text-brand-400"
                                    : "bg-base-900 border border-base-800 text-base-500 hover:text-base-300"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom row */}
            <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={noWebsiteOnly}
                        onChange={e => setNoWebsiteOnly(e.target.checked)}
                        className="w-3.5 h-3.5 accent-brand-500"
                    />
                    <span className="text-xs text-base-400">No website</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={hasPhoneOnly}
                        onChange={e => setHasPhoneOnly(e.target.checked)}
                        className="w-3.5 h-3.5 accent-brand-500"
                    />
                    <span className="text-xs text-base-400">Has phone</span>
                </label>

                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-base-500">Sort:</span>
                    <button
                        onClick={() => setSortBy(sortBy === 'score' ? 'default' : 'score')}
                        className={clsx(
                            "text-xs px-3 py-1.5 rounded-lg transition-colors",
                            sortBy === 'score'
                                ? "bg-brand-500/10 text-brand-400"
                                : "bg-base-900 border border-base-800 text-base-500 hover:text-base-300"
                        )}
                    >
                        Highest score
                    </button>

                    <button
                        onClick={() => setGroupBy(groupBy === 'status' ? 'category' : 'status')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-base-900 border border-base-800 text-base-500 hover:text-base-300 transition-colors"
                    >
                        By {groupBy === 'status' ? 'category' : 'status'}
                    </button>
                </div>
            </div>
        </div>
    );
}