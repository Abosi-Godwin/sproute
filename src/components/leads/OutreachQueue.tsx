import { useState } from 'react';
import { Link } from 'react-router';
import { Zap, ChevronRight, X } from 'lucide-react';
import { useLeadsStore } from '../../lib/stores/useLeadsStore';
import { scoreLead, getTier } from '../../utils/leadScore';
import { Lead } from '../../types';

export default function OutreachQueue() {
    const { leads } = useLeadsStore();
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const queue: Lead[] = leads
        .filter(l =>
            l.status === 'new' &&
            l.phone &&
            getTier(scoreLead(l)) === 'hot'
        )
        .sort((a, b) => scoreLead(b) - scoreLead(a))
        .slice(0, 10);

    if (queue.length === 0) return null;

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-400" />
                    <p className="text-sm font-semibold text-base-100">
                        Outreach Queue
                    </p>
                    <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full font-medium">
                        {queue.length} hot leads
                    </span>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="p-1 text-base-600 hover:text-base-400 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <p className="text-xs text-base-500">
                Hot leads with phone numbers ready to contact.
            </p>

            <div className="space-y-2">
                {queue.slice(0, 3).map(lead => (
                    <Link
                        key={lead.id}
                        to={`/leads/${lead.id}`}
                        className="flex items-center justify-between bg-base-800 rounded-lg px-3 py-2.5 hover:bg-base-700 transition-colors"
                    >
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-base-100 truncate">
                                {lead.name}
                            </p>
                            <p className="text-xs text-base-500 truncate">
                                {lead.category} · {scoreLead(lead)}/10
                            </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-base-600 shrink-0" />
                    </Link>
                ))}
            </div>

            {queue.length > 3 && (
                <Link
                    to="/leads?tier=hot&status=new"
                    className="block text-center text-xs text-brand-400 hover:text-brand-300 transition-colors pt-1"
                >
                    See all {queue.length} hot leads
                </Link>
            )}
        </div>
    );
}