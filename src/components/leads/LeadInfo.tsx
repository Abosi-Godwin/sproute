import {
    MapPin,
    Phone,
    Globe,
    Star,
    MessageCircle,
    Calendar,
    Bell
} from "lucide-react";
import { clsx } from "clsx";
import { Lead, LeadStatus, DeadReason } from "../../types";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";

const STATUSES: LeadStatus[] = [
    "new",
    "messaged",
    "replied",
    "converted",
    "not_on_whatsapp",
    "dead"
];

const statusStyles: Record<LeadStatus, string> = {
    new: "bg-base-700 text-base-300",
    messaged: "bg-blue-500/10 text-blue-400",
    replied: "bg-yellow-500/10 text-yellow-400",
    converted: "bg-brand-500/10 text-brand-400",
    dead: "bg-red-500/10 text-red-400",
    not_on_whatsapp: "bg-orange-500/10 text-orange-400"
};

const DEAD_REASONS: { id: DeadReason; label: string }[] = [
    { id: "has_website", label: "Has website" },
    { id: "not_interested", label: "Not interested" },
    { id: "wrong_number", label: "Wrong number" },
    { id: "no_response", label: "No response" },
    { id: "too_expensive", label: "Too expensive" },
    { id: "other", label: "Other" },
];

export default function LeadInfo({ lead }: { lead: Lead }) {
    const { updateStatus, setFollowUpDate, setDeadReason } = useLeadsStore();
    const canFollowUp = lead.status !== "new";

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="font-display font-bold text-xl text-base-50">
                        {lead.name}
                    </h2>
                    <p className="text-sm text-base-500 mt-0.5">
                        {lead.category}
                    </p>
                </div>
                {lead.rating && (
                    <div className="flex items-center gap-1.5 shrink-0 bg-base-800 px-2.5 py-1.5 rounded-lg">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium text-base-200">
                            {lead.rating}
                        </span>
                        {lead.reviews && (
                            <span className="text-xs text-base-500">
                                ({lead.reviews})
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 text-sm text-base-400">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{lead.address}</span>
                </div>
                {lead.phone && (
                    <div className="flex items-center gap-2.5 text-sm text-base-400">
                        <Phone className="w-4 h-4 shrink-0" />
                        <a
                            href={`tel:${lead.phone}`}
                            className="hover:text-base-200 transition-colors"
                        >
                            {lead.phone}
                        </a>
                    </div>
                )}
                <div className="flex items-center gap-2.5 text-sm">
                    <Globe className="w-4 h-4 shrink-0 text-base-400" />
                    {lead.website ? (
                        <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-400 hover:text-brand-300 transition-colors truncate"
                        >
                            {lead.website}
                        </a>
                    ) : (
                        <span className="text-red-400">No website</span>
                    )}
                </div>
                <div className="flex items-center gap-2.5 text-sm text-base-500">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>
                        Saved {new Date(lead.savedAt).toLocaleDateString()}
                    </span>
                </div>

                <div className="flex items-center gap-2.5 text-sm">
                    <Bell className={clsx(
                        "w-4 h-4 shrink-0",
                        canFollowUp ? "text-base-400" : "text-base-600"
                    )} />
                    <div className="flex items-center gap-2 flex-1">
                        <span className={clsx(
                            "text-sm shrink-0",
                            canFollowUp ? "text-base-400" : "text-base-600"
                        )}>
                            Follow up:
                        </span>
                        {canFollowUp ? (
                            <input
                                type="date"
                                value={lead.followUpDate ?? ""}
                                min={new Date().toISOString().split("T")[0]}
                                onChange={e => setFollowUpDate(lead.id, e.target.value)}
                                className="flex-1 bg-base-800 border border-base-700 rounded-lg px-3 py-1.5 text-sm text-base-100 focus:outline-none focus:border-brand-500 transition-colors"
                            />
                        ) : (
                            <span className="text-xs text-base-600 italic">
                                Message this lead first
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Status */}
            <select
                value={lead.status}
                onChange={e => updateStatus(lead.id, e.target.value as LeadStatus)}
                className={clsx(
                    "w-full text-sm font-medium px-3 py-2.5 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer",
                    statusStyles[lead.status]
                )}
            >
                {STATUSES.map(s => (
                    <option key={s} value={s} className="bg-base-800 text-base-100">
                        {s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </option>
                ))}
            </select>

            {/* Dead reason — only when status is dead */}
            {lead.status === "dead" && (
                <div className="space-y-2 pt-1">
                    <p className="text-xs text-base-500 font-medium">
                        Why is this lead dead?
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {DEAD_REASONS.map(r => (
                            <button
                                key={r.id}
                                onClick={() => setDeadReason(lead.id, r.id)}
                                className={clsx(
                                    "text-xs px-3 py-1.5 rounded-lg transition-colors",
                                    lead.deadReason === r.id
                                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                        : "bg-base-800 text-base-500 hover:text-base-300 border border-transparent"
                                )}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    {lead.deadReason && (
                        <p className="text-xs text-base-600">
                            Marked as: {DEAD_REASONS.find(r => r.id === lead.deadReason)?.label}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}