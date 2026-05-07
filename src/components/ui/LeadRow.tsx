import { Link } from "react-router";
import { Lead, LeadStatus } from "../../types";
import { clsx } from "clsx";

const statusStyles: Record<LeadStatus, string> = {
    new: "bg-base-700 text-base-300",
    messaged: "bg-blue-500/10 text-blue-400",
    replied: "bg-yellow-500/10 text-yellow-400",
    converted: "bg-brand-500/10 text-brand-400",
    dead: "bg-red-500/10 text-red-400",
    not_on_whatsapp: "bg-orange-500/10 text-orange-400"
};

export default function LeadRow({ lead }: { lead: Lead }) {
    return (
        <div
            className="flex items-center justify-between py-3 border-b
        border-base-800 last:border-0"
        >
            <div className="min-w-0">
                <p className="text-sm font-medium text-base-100 truncate">
                    {lead.name}
                </p>
                <p className="text-xs text-base-500 mt-0.5 truncate">
                    {lead.category}
                </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
               
                <span
                    className={clsx(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        statusStyles[lead.status]
                    )}
                >
                    
                    {lead.status.replace(/_/g, ' ').replace(/\b\w/g, c =>
                    c.toUpperCase())}
                </span>
                <Link
                    to={`/leads/${lead.id}`}
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                    View
                </Link>
            </div>
        </div>
    );
}
