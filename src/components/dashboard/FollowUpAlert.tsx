import { useLeadsStore } from "../../lib/stores/useLeadsStore";

import { Link } from "react-router";
import { AlarmClock, MessageCircle } from "lucide-react";


export default function FollowUpAlert() {
    const { leads } = useLeadsStore();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const repliedOverdue = leads.filter(lead => {
        if (lead.status !== "replied") return false;
        if (!lead.followUpDate) return false;
        const due = new Date(lead.followUpDate);
        due.setHours(0, 0, 0, 0);
        return due <= today;
    });

    const messagedOverdue = leads.filter(lead => {
        if (lead.status !== "messaged") return false;
        if (!lead.followUpDate) return false;
        const due = new Date(lead.followUpDate);
        due.setHours(0, 0, 0, 0);
        return due <= today;
    });

    if (repliedOverdue.length === 0 && messagedOverdue.length === 0)
        return null;

    return (
        <div className="space-y-2">
            {repliedOverdue.length > 0 && (
                <Link
                    to="/leads?filter=replied-overdue"
                    className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 hover:bg-yellow-500/15 transition-colors"
                >
                    <MessageCircle className="w-4 h-4 text-yellow-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-yellow-400">
                            {repliedOverdue.length} replied{" "}
                            {repliedOverdue.length > 1 ? "leads" : "lead"}{" "}
                            waiting
                        </p>
                        <p className="text-xs text-base-500">
                            They replied — close them now
                        </p>
                    </div>
                </Link>
            )}
            {messagedOverdue.length > 0 && (
                <Link
                    to="/leads?filter=messaged-overdue"
                    className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 hover:bg-orange-500/15 transition-colors"
                >
                    <AlarmClock className="w-4 h-4 text-orange-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-orange-400">
                            {messagedOverdue.length} follow-up
                            {messagedOverdue.length > 1 ? "s" : ""} due
                        </p>
                        <p className="text-xs text-base-500">
                            Time to check in on these leads
                        </p>
                    </div>
                </Link>
            )}
        </div>
    );
}
