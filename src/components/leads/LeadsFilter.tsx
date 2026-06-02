import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { clsx } from "clsx";
import { useLeadsFilterStore } from "../../lib/stores/useLeadsFilterStore";
import { OpportunityTier } from "../../utils/leadScore";

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
    { value: 'all', label: 'All tiers' },
    { value: 'hot', label: '🔥 Hot' },
    { value: 'warm', label: 'Warm' },
    { value: 'low', label: 'Low priority' },
];

export default function LeadsFilter() {
    const [showPanel, setShowPanel] = useState(false);
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
        setSelectedTier,followUpDueOnly, setFollowUpDueOnly 
    } = useLeadsFilterStore();


    // Count active non-status filters
    const activeCount = [
        selectedTier !== 'all',
        noWebsiteOnly,
        hasPhoneOnly,
        sortBy === 'score',
        groupBy === 'category',
    ].filter(Boolean).length;

    return (
        <div className="space-y-3">
            {/* Status row + filter button */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
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

                {/* Filter button */}
                <button
                    onClick={() => setShowPanel(!showPanel)}
                    className={clsx(
                        "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors shrink-0",
                        showPanel || activeCount > 0
                            ? "bg-brand-500/10 border-brand-500/30 text-brand-400"
                            : "bg-base-900 border-base-800 text-base-500 hover:text-base-300"
                    )}
                >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {activeCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-bold">
                            {activeCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Expandable filter panel */}
            {showPanel && (
                <div className="bg-base-900 border border-base-800 rounded-xl p-4 space-y-4">

                    {/* Tier */}
                    <div className="space-y-2">
                        <p className="text-xs text-base-500">Opportunity tier</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            {TIERS.map(t => (
                                <button
                                    key={t.value}
                                    onClick={() => setSelectedTier(t.value as any)}
                                    className={clsx(
                                        "text-xs px-3 py-1.5 rounded-lg transition-colors",
                                        selectedTier === t.value
                                            ? "bg-brand-500/10 text-brand-400"
                                            : "bg-base-800 text-base-500 hover:text-base-300"
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-2">
                        <p className="text-xs text-base-500">Show only</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setNoWebsiteOnly(!noWebsiteOnly)}
                                className={clsx(
                                    "text-xs px-3 py-1.5 rounded-lg transition-colors",
                                    noWebsiteOnly
                                        ? "bg-brand-500/10 text-brand-400"
                                        : "bg-base-800 text-base-500 hover:text-base-300"
                                )}
                            >
                                No website
                            </button>
                            <button
                                onClick={() => setHasPhoneOnly(!hasPhoneOnly)}
                                className={clsx(
                                    "text-xs px-3 py-1.5 rounded-lg transition-colors",
                                    hasPhoneOnly
                                        ? "bg-brand-500/10 text-brand-400"
                                        : "bg-base-800 text-base-500 hover:text-base-300"
                                )}
                            >
                                Has phone
                            </button>
                            

<button
    onClick={() => setFollowUpDueOnly(!followUpDueOnly)}
    className={clsx(
        'text-xs px-3 py-1.5 rounded-lg transition-colors',
        followUpDueOnly
            ? 'bg-orange-500/10 text-orange-400'
            : 'bg-base-800 text-base-500 hover:text-base-300'
    )}
>
    Follow-up due
</button>
                        </div>
                    </div>

                    {/* Sort and group */}
                    <div className="space-y-2">
                        <p className="text-xs text-base-500">Sort and group</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSortBy(sortBy === 'score' ? 'default' : 'score')}
                                className={clsx(
                                    "text-xs px-3 py-1.5 rounded-lg transition-colors",
                                    sortBy === 'score'
                                        ? "bg-brand-500/10 text-brand-400"
                                        : "bg-base-800 text-base-500 hover:text-base-300"
                                )}
                            >
                                Top score first
                            </button>
                            <button
                                onClick={() => setGroupBy(groupBy === 'status' ? 'category' : 'status')}
                                className="text-xs px-3 py-1.5 rounded-lg bg-base-800 text-base-500 hover:text-base-300 transition-colors"
                            >
                                {groupBy === 'status' ? 'Group by category' : 'Group by status'}
                            </button>
                        </div>
                    </div>

                    {/* Clear all */}
                    {activeCount > 0 && (
                        <button
                            onClick={() => {
                                setSelectedTier('all');
                                setNoWebsiteOnly(false);
                                setHasPhoneOnly(false);
                                setSortBy('default');
                                setGroupBy('status');
                            }}
                            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            Clear all filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}