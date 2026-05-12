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
    MapPinned
} from "lucide-react";

import { clsx } from "clsx";
import { Lead, LeadStatus } from "../../types";

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
    new: "bg-base-700 text-base-300",
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

// Update the delete handler
const handleDelete = async () => {
    setIsDeleting(true);
    await deleteLead(lead.id);
    setIsDeleting(false);
};
    return (
        <div
            className={clsx(
                "bg-base-900 border rounded-xl p-5 flex flex-col gap-3 transition-colors",
                isSelected
                    ? "border-brand-500/50"
                    : "border-base-800 hover:border-base-700"
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-display font-semibold text-base-50 leading-snug truncate">
                        {lead.name}
                    </p>
                    <p className="text-xs text-base-500 mt-0.5">
                        {lead.category}
                    </p>
                    {(() => {
                        const age = getLeadAge(lead.savedAt, lead.status);
                        const config = ageConfig[age];
                        return config ? (
                            <span
                                className={`text-xs font-medium ${config.color}`}
                            >
                                ● {config.label}
                            </span>
                        ) : null;
                    })()}
                    {lead.followUpDate &&
                        new Date(lead.followUpDate) < new Date() && (
                            <span className="text-xs text-orange-400 font-medium">
                                ⏰ Follow-up overdue
                            </span>
                        )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {lead.rating && (
                        <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs text-base-300">
                                {lead.rating}
                            </span>
                        </div>
                    )}

                    {/* Three-dot menu */}
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
                        <span className="text-red-400">No website</span>
                    )}
                </div>
                {lead.notes && (
                    <p className="text-xs text-base-500 italic truncate border-t border-base-800 pt-2 mt-1">
                        {lead.notes}
                    </p>
                )}

                {lead.searchQuery && (
                    <p className="text-xs text-base-600 truncate">
                        Found via: {lead.searchQuery} · {lead.searchLocation}
                    </p>
                )}
            </div>

            {/* Status updater */}
            <select
                value={lead.status}
                onChange={e =>
                    updateStatus(lead.id, e.target.value as LeadStatus)
                }
                className={clsx(
                    "w-full text-xs font-medium px-3 py-2 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer",
                    statusStyles[lead.status]
                )}
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

            {/* Actions */}
            <div className="flex items-center gap-2">
                <Link
                    to={`/leads/${lead.id}`}
                    className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-base-800 text-base-300 hover:text-base-100 hover:bg-base-700 transition-colors"
                >
                    View Detail
                </Link>
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
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="p-2 rounded-lg bg-base-800 text-base-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
