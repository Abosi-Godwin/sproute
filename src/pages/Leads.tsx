import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useLeadsStore } from "../lib/stores/useLeadsStore";
import { useLeadsFilterStore } from "../lib/stores/useLeadsFilterStore";
import { Lead, LeadStatus } from "../types";
import LeadsFilter from "../components/leads/LeadsFilter";
import LeadsGroup from "../components/leads/LeadsGroup";
import { exportLeadsToCsv } from "../utils/exportCsv";
import { Download, Trash2, Users } from "lucide-react";

function groupLeads(
    leads: Lead[],
    groupBy: "status" | "category"
): Record<string, Lead[]> {
    return leads.reduce(
        (acc, lead) => {
            const key =
                groupBy === "status"
                    ? lead.status
                    : lead.category || "Uncategorized";
            if (!acc[key]) acc[key] = [];
            acc[key].push(lead);
            return acc;
        },
        {} as Record<string, Lead[]>
    );
}

export default function Leads() {
    const [selected, setSelected] = useState<string[]>([]);
    const { leads, deleteLead } = useLeadsStore();
    const {
        selectedStatus,
        noWebsiteOnly,
        hasPhoneOnly,
        groupBy,
        setSelectedStatus,
        setNoWebsiteOnly
    } = useLeadsFilterStore();

    const [searchParams] = useSearchParams();

    useEffect(() => {
        const filter = searchParams.get("filter");
        if (filter === "no-website") setNoWebsiteOnly(true);
        if (filter === "new") setSelectedStatus("new");
    }, []);

    const filtered = leads.filter(lead => {
        if (selectedStatus !== "all" && lead.status !== selectedStatus)
            return false;
        if (noWebsiteOnly && lead.website) return false;
        if (hasPhoneOnly && !lead.phone) return false;
        return true;
    });

    const groups = groupLeads(filtered, groupBy);

    const STATUS_ORDER: LeadStatus[] = [
        "new",
        "messaged",
        "replied",
        "converted",
        "not_on_whatsapp",
        "dead"
    ];

    const sortedKeys =
        groupBy === "status"
            ? STATUS_ORDER.filter(s => groups[s]?.length > 0)
            : Object.keys(groups).sort();

    const toggleSelect = (id: string) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        selected.forEach(id => deleteLead(id));
        setSelected([]);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-base-50">
                        Leads
                    </h1>
                    <p className="text-sm text-base-400 mt-1">
                        {filtered.length === leads.length
                            ? `${leads.length} saved leads`
                            : `Showing ${filtered.length} of ${leads.length} leads`}
                    </p>
                </div>
                {filtered.length > 0 && (
                    <button
                        onClick={() => exportLeadsToCsv(filtered)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-base-900 border border-base-800 text-sm font-medium text-base-300 hover:text-base-100 hover:border-base-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                )}
            </div>

            {selected.length > 0 && (
                <div className="flex items-center justify-between bg-base-900 border border-base-800 rounded-xl px-4 py-3">
                    <span className="text-sm text-base-300">
                        {selected.length} lead{selected.length > 1 ? "s" : ""}{" "}
                        selected
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelected([])}
                            className="text-xs text-base-500 hover:text-base-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete {selected.length}
                        </button>
                    </div>
                </div>
            )}

            <LeadsFilter />

            {filtered.length === 0 ? (
                leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                            <Users className="w-6 h-6 text-brand-400" />
                        </div>
                        <div>
                            <p className="font-display font-semibold text-base-100">
                                No leads yet
                            </p>
                            <p className="text-sm text-base-500 mt-1 max-w-xs">
                                Start by searching for local businesses and
                                saving the ones you want to reach out to.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/search")}
                            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                        >
                            <Search className="w-4 h-4" />
                            Find Businesses
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                        <p className="font-display font-semibold text-base-100">
                            No leads match your filters
                        </p>
                        <p className="text-sm text-base-500">
                            Try adjusting your filters to see more leads.
                        </p>
                    </div>
                )
            ) : (
                <div className="space-y-8">
                    {sortedKeys.map(key => (
                        <LeadsGroup
                            key={key}
                            label={key}
                            leads={groups[key]}
                            selected={selected}
                            toggleSelect={toggleSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
