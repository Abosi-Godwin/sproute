import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
    Phone, Globe, Star, Trash2, MoreVertical,
    CheckSquare, Loader2, MapPinned, ShieldAlert,
    Flame, AlarmClock, Sparkles, Clock, CheckCircle2,
    XCircle, MessageCircle, Search
} from "lucide-react";
import { clsx } from "clsx";
import { Lead, LeadStatus, DeadReason } from "../../types";
import { scoreLead, getTier, tierConfig, getOpportunityReasons } from "../../utils/leadScore";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { getLeadAge, ageConfig } from "../../utils/leadAge";

interface LeadCardProps {
    lead: Lead;
    selected: string[];
    toggleSelect: (id: string) => void;
}

const STATUSES: LeadStatus[] = [
    "new", "messaged", "replied", "converted", "not_on_whatsapp", "dead"
];

const statusStyles: Record<LeadStatus, string> = {
    new: "bg-base-800 text-base-400",
    messaged: "bg-blue-500/10 text-blue-400",
    replied: "bg-yellow-500/10 text-yellow-400",
    converted: "bg-brand-500/10 text-brand-400",
    dead: "bg-red-500/10 text-red-400",
    not_on_whatsapp: "bg-orange-500/10 text-orange-400",
};

const DEAD_REASON_LABELS: Record<DeadReason, string> = {
    has_website: "Has website",
    not_interested: "Not interested",
    wrong_number: "Wrong number",
    no_response: "No response",
    too_expensive: "Too expensive",
    other: "Other",
};

function getNextAction(lead: Lead): { icon: React.ElementType; text: string; color: string } | null {
    const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date();

    switch (lead.status) {
        case "new":
            return { icon: Sparkles, text: "Ready to message — generate now", color: "text-brand-400" };
        case "messaged":
            if (isOverdue) return { icon: AlarmClock, text: "Follow-up overdue — reach out now", color: "text-orange-400" };
            if (lead.followUpDate) {
                const days = Math.ceil((new Date(lead.followUpDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return {
                    icon: Clock,
                    text: days === 0 ? "Follow up today" : `Follow up in ${days} day${days > 1 ? "s" : ""}`,
                    color: "text-blue-400",
                };
            }
            return { icon: Clock, text: "Set a follow-up date", color: "text-base-500" };
        case "replied":
            return { icon: MessageCircle, text: "They replied — close them now", color: "text-yellow-400" };
        case "converted":
            return { icon: CheckCircle2, text: "Client secured", color: "text-brand-400" };
        case "not_on_whatsapp":
            return { icon: Search, text: "Find their WhatsApp number", color: "text-base-500" };
        case "dead":
            return null;
        default:
            return null;
    }
}

export default function LeadCard({ lead, selected, toggleSelect }: LeadCardProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [localStatus, setLocalStatus] = useState<LeadStatus>(lead.status);
    const [menuOpen, setMenuOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const { updateStatus, deleteLead } = useLeadsStore();
    const isSelected = selected.includes(lead.id);
    const score = scoreLead(lead);
    const tier = getTier(score);
    const tConf = tierConfig[tier];
    const age = getLeadAge(lead.savedAt, lead.status);
    const ageConf = ageConfig[age];
    const reasons = getOpportunityReasons(lead);
    const nextAction = getNextAction(lead);

    const handleStatusChange = async (newStatus: LeadStatus) => {
        setLocalStatus(newStatus);
        await updateStatus(lead.id, newStatus);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + " " + lead.address)}`;

    const handleDelete = async () => {
        setIsDeleting(true);
        await deleteLead(lead.id);
        setIsDeleting(false);
    };

    return (
        <div className={clsx(
            "bg-base-900 border rounded-xl p-4 flex flex-col gap-3 transition-colors",
            isSelected ? "border-brand-500/50" : "border-base-800 hover:border-base-700"
        )}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold text-base-50 leading-snug truncate">
                        {lead.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-base-500">{lead.category}</span>
                        {lead.rating && (
                            <>
                                <span className="text-base-700 text-xs">·</span>
                                <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <span className="text-xs text-base-400">{lead.rating}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <div className={clsx("px-2 py-0.5 rounded-lg", tConf.bg)}>
                        <span className={clsx("text-xs font-semibold", tConf.color)}>
                            {score}/10
                        </span>
                    </div>
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-1 rounded-lg text-base-500 hover:text-base-300 hover:bg-base-800 transition-colors"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 top-7 z-20 w-48 bg-base-800 border border-base-700 rounded-xl shadow-lg overflow-hidden">
                                <button
                                    onClick={() => { toggleSelect(lead.id); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-base-300 hover:text-base-100 hover:bg-base-700 transition-colors"
                                >
                                    <CheckSquare className="w-3.5 h-3.5" />
                                    {isSelected ? "Deselect" : "Select"}
                                </button>
                                <a
                                    href={googleMapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-base-300 hover:text-base-100 hover:bg-base-700 transition-colors"
                                >
                                    <MapPinned className="w-3.5 h-3.5" />
                                    View on Google Maps
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {(ageConf || lead.unclaimedListing) && (
                <div className="flex items-center gap-1.5 flex-wrap">
                    {ageConf && (
                        <span className={clsx(
                            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                            ageConf.color, ageConf.bg
                        )}>
                            <Flame className="w-3 h-3" />
                            {ageConf.label}
                        </span>
                    )}
                    {lead.unclaimedListing && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-yellow-400 bg-yellow-500/10">
                            <ShieldAlert className="w-3 h-3" />
                            Unclaimed
                        </span>
                    )}
                </div>
            )}

            {tier !== "low" && reasons.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {reasons.slice(0, 2).map((reason, i) => (
                        <span key={i} className="text-xs text-base-500 bg-base-800 px-2 py-0.5 rounded-md">
                            ✓ {reason}
                        </span>
                    ))}
                </div>
            )}

            {nextAction && (
                <div className="flex items-center gap-2">
                    <nextAction.icon className={clsx("w-3.5 h-3.5 shrink-0", nextAction.color)} />
                    <p className={clsx("text-xs font-medium", nextAction.color)}>
                        {nextAction.text}
                    </p>
                </div>
            )}

            {localStatus === "dead" && lead.deadReason && (
                <p className="text-xs text-base-600">
                    Dead: {DEAD_REASON_LABELS[lead.deadReason]}
                </p>
            )}

            <div className="space-y-1.5">
                {lead.phone && (
                    <div className="flex items-center gap-2 text-xs text-base-400">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{lead.phone}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-xs">
                    <Globe className="w-3.5 h-3.5 shrink-0 text-base-400" />
                    {lead.website
                        ? <span className="text-brand-400">Has website</span>
                        : <span className="text-blue-400">No website — opportunity</span>
                    }
                </div>
                {lead.notes && (
                    <p className="text-xs text-base-500 italic truncate border-t border-base-800 pt-2 mt-1">
                        {lead.notes}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2">
                <select
                    value={localStatus}
                    onChange={e => handleStatusChange(e.target.value as LeadStatus)}
                    className={clsx(
                        "text-xs font-medium px-3 py-2 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer",
                        statusStyles[localStatus]
                    )}
                    style={{ flex: "0 0 52%" }}
                >
                    {STATUSES.map(s => (
                        <option key={s} value={s} className="bg-base-800 text-base-100">
                            {s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </option>
                    ))}
                </select>

                {confirmDelete ? (
                    <div className="flex items-center gap-1 flex-1">
                        <span className="text-xs text-red-400 flex-1">Delete?</span>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="text-xs font-medium px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                        >
                            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
                        </button>
                        <button
                            onClick={() => setConfirmDelete(false)}
                            disabled={isDeleting}
                            className="text-xs font-medium px-2 py-1.5 rounded-lg bg-base-800 text-base-400 hover:text-base-100 disabled:opacity-50 transition-colors"
                        >
                            No
                        </button>
                    </div>
                ) : (
                    <>
                        <Link
                            to={`/leads/${lead.id}`}
                            className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-base-800 text-base-300 hover:text-base-100 hover:bg-base-700 transition-colors"
                        >
                            View detail
                        </Link>
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="p-2 rounded-lg bg-base-800 text-base-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}