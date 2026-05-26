import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
    MapPin,
    Phone,
    Globe,
    Star,
    Trash2,
    MoreVertical,
    CheckSquare,
    Loader2,
    MapPinned,
    ShieldAlert,
    TrendingUp,
    Flame,
    AlarmClock
} from "lucide-react";
import { clsx } from "clsx";
import { Lead, LeadStatus } from "../../types";
import { scoreLead, getScoreColor, getScoreBg } from "../../utils/leadScore";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { getLeadAge, ageConfig } from "../../utils/leadAge";

interface LeadCardProps {
    lead: Lead;
    selected: string[];
    toggleSelect: (id: string) => void;
}

const STATUSES: LeadStatus[] = [
    "new",
    "messaged",
    "replied",
    "converted",
    "not_on_whatsapp",
    "dead"
];

const statusStyles: Record<LeadStatus, string> = {
    new: "bg-base-800 text-base-400",
    messaged: "bg-blue-500/10 text-blue-400",
    replied: "bg-yellow-500/10 text-yellow-400",
    converted: "bg-brand-500/10 text-brand-400",
    dead: "bg-red-500/10 text-red-400",
    not_on_whatsapp: "bg-orange-500/10 text-orange-400"
};

export default function LeadCard({
    lead,
    selected,
    toggleSelect
}: LeadCardProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { updateStatus, deleteLead } = useLeadsStore();

    const isSelected = selected.includes(lead.id);
    const score = scoreLead(lead);
    const age = getLeadAge(lead.savedAt, lead.status);
    const ageConf = ageConfig[age];

    const isOverdue =
        ["messaged", "replied"].includes(lead.status) &&
        lead.followUpDate &&
        new Date(lead.followUpDate) < new Date();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node)
            ) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + " " + lead.address)}`;

    const handleDelete = async () => {
        setIsDeleting(true);
        await deleteLead(lead.id);
        setIsDeleting(false);
    };

    return (
        <div
            className={clsx(
                "bg-base-900 border rounded-xl p-4 flex flex-col gap-3 transition-colors",
                isSelected
                    ? "border-brand-500/50"
                    : "border-base-800 hover:border-base-700"
            )}
        >
             
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold text-base-50 leading-snug truncate">
                        {lead.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-base-500">
                            {lead.category}
                        </span>
                        {lead.rating && (
                            <>
                                <span className="text-base-700 text-xs">·</span>
                                <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <span className="text-xs text-base-400">
                                        {lead.rating}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <div
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${getScoreBg(score)}`}
                    >
                        <TrendingUp
                            className={`w-3 h-3 ${getScoreColor(score)}`}
                        />
                        <span
                            className={`text-xs font-semibold ${getScoreColor(score)}`}
                        >
                            {score}
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
                                    onClick={() => {
                                        toggleSelect(lead.id);
                                        setMenuOpen(false);
                                    }}
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

            {/* Badge strip — horizontal pills */}
            {(ageConf || isOverdue || lead.unclaimedListing) && (
                <div className="flex items-center gap-1.5 flex-wrap">
                    {ageConf && (
                        <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${ageConf.color} bg-current/10`}
                        >
                            <Flame className="w-3 h-3" />
                            {ageConf.label}
                        </span>
                    )}
                    {isOverdue && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-orange-400 bg-orange-500/10">
                            <AlarmClock className="w-3 h-3" />
                            Follow-up overdue
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

            {/* Details */}
            <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-base-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{lead.address}</span>
                </div>
                {lead.phone && (
                    <div className="flex items-center gap-2 text-xs text-base-400">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{lead.phone}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-xs">
                    <Globe className="w-3.5 h-3.5 shrink-0 text-base-400" />
                    {lead.website ? (
                        <span className="text-brand-400">Has website</span>
                    ) : (
                        <span className="text-blue-400">
                            No website — opportunity
                        </span>
                    )}
                </div>
                {lead.notes && (
                    <p className="text-xs text-base-500 italic truncate border-t border-base-800 pt-2 mt-1">
                        {lead.notes}
                    </p>
                )}
            </div>

            {/* Footer — status + actions on one row */}
            <div className="flex items-center gap-2">
                <select
                    value={lead.status}
                    onChange={e =>
                        updateStatus(lead.id, e.target.value as LeadStatus)
                    }
                    className={clsx(
                        "text-xs font-medium px-3 py-2 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer",
                        statusStyles[lead.status]
                    )}
                    style={{ flex: "0 0 52%" }}
                >
                    {STATUSES.map(s => (
                        <option
                            key={s}
                            value={s}
                            className="bg-base-800 text-base-100"
                        >
                            {s
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, c => c.toUpperCase())}
                        </option>
                    ))}
                </select>

                {confirmDelete ? (
                    <div className="flex items-center gap-1 flex-1">
                        <span className="text-xs text-red-400 flex-1">
                            Delete?
                        </span>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="text-xs font-medium px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                        >
                            {isDeleting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                "Yes"
                            )}
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
