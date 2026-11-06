import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Zap, ChevronRight, X } from 'lucide-react';
import { useLeadsStore } from '../../lib/stores/useLeadsStore';
import { scoreLead, getTier } from '../../utils/leadScore';
import { pickWhatsAppNumber } from '../../utils/phone';
import { posthog } from '../../lib/posthog';
import { Lead } from '../../types';

export default function OutreachQueue() {
    const { leads } = useLeadsStore();
    const [dismissed, setDismissed] = useState(false);

    const queue = useMemo(() => {
        const ranked: { lead: Lead; score: number }[] = [];

        for (const lead of leads) {
            if (lead.status !== 'new') continue;
            if (!pickWhatsAppNumber(lead)) continue;

            const score = scoreLead(lead);
            if (getTier(score) !== 'hot') continue;

            ranked.push({ lead, score });
        }

        return ranked.sort((a, b) => b.score - a.score);
    }, [leads]);

    if (dismissed || queue.length === 0) return null;

    const handleDismiss = () => {
        posthog.capture('outreach_queue_dismissed', { count: queue.length });
        setDismissed(true);
    };

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-400" />
                    <p className="text-sm font-semibold text-base-100">
                        Outreach Queue
                    </p>
                    <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full font-medium">
                        {queue.length} hot {queue.length === 1 ? 'lead' : 'leads'}
                    </span>
                </div>
                <button
                    onClick={handleDismiss}
                    className="p-1 text-base-600 hover:text-base-400 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <p className="text-xs text-base-500">
                Hot leads with a mobile number, ready for WhatsApp.
            </p>

            <div className="space-y-2">
                {queue.slice(0, 3).map(({ lead, score }, index) => (
                    <Link
                        key={lead.id}
                        to={`/leads/${lead.id}`}
                        onClick={() =>
                            posthog.capture('outreach_queue_clicked', {
                                lead_id: lead.id,
                                position: index + 1,
                                score
                            })
                        }
                        className="flex items-center justify-between bg-base-800 rounded-lg px-3 py-2.5 hover:bg-base-700 transition-colors"
                    >
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-base-100 truncate">
                                {lead.name}
                            </p>
                            <p className="text-xs text-base-500 truncate">
                                {lead.category} · {score}/10
                            </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-base-600 shrink-0" />
                    </Link>
                ))}
            </div>

            {queue.length > 3 && (
                <Link
                    to="/leads?tier=hot&status=new"
                    onClick={() =>
                        posthog.capture('outreach_queue_clicked', {
                            position: 'see_all',
                            count: queue.length
                        })
                    }
                    className="block text-center text-xs text-brand-400 hover:text-brand-300 transition-colors pt-1"
                >
                    See all {queue.length} hot leads
                </Link>
            )}
        </div>
    );
}