import { useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Lead } from '../../types';
import { scoreLead, getTier, getOpportunityReasons } from '../../utils/leadScore';
import { clsx } from 'clsx';

export default function OpportunitySummary({ lead }: { lead: Lead }) {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const score = scoreLead(lead);
    const tier = getTier(score);
    const reasons = getOpportunityReasons(lead);

    const generate = async () => {
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{
                                text: `You analyze local businesses and explain in plain language why they might be a good prospect for a freelancer.

Rules:
- 2 to 3 sentences only
- Plain simple English
- No corporate language
- No exaggeration
- Only use facts provided
- Never invent information
- Focus on signals that suggest the business has customers, money, and a gap the freelancer can fill
- Sound like a knowledgeable friend giving honest advice
- Do not start with "This business" — vary the opening`
                            }]
                        },
                        contents: [{
                            parts: [{
                                text: `Business: ${lead.name}
Category: ${lead.category}
Location: ${lead.address}
Has website: ${lead.website ? `yes — ${lead.website}` : 'no'}
Rating: ${lead.rating ?? 'unknown'}
Reviews: ${lead.reviews ?? 'unknown'}
Phone available: ${lead.phone ? 'yes' : 'no'}
Unclaimed listing: ${lead.unclaimedListing ? 'yes' : 'no'}
Opportunity score: ${score}/10
Key signals: ${reasons.join(', ')}

Explain in 2-3 sentences why this business is or is not a good prospect.`
                            }]
                        }]
                    })
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message ?? 'Failed');

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            setSummary(text.trim());
        } catch (err: any) {
            const msg = err.message ?? '';
            if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
                setError('AI quota reached — try again tomorrow');
            } else {
                setError('Could not generate summary — try again');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-400" />
                    <h3 className="font-display font-semibold text-base-100">
                        Opportunity Summary
                    </h3>
                </div>
                <button
                    onClick={generate}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 disabled:opacity-50 transition-colors"
                >
                    {isLoading
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : summary
                            ? <RefreshCw className="w-3.5 h-3.5" />
                            : <Sparkles className="w-3.5 h-3.5" />
                    }
                    {summary ? 'Refresh' : 'Analyse'}
                </button>
            </div>

            {/* Score + reasons — always visible */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className={clsx(
                        'text-xs font-semibold px-2 py-0.5 rounded-lg',
                        tier === 'hot' && 'bg-orange-500/10 text-orange-400',
                        tier === 'warm' && 'bg-yellow-500/10 text-yellow-400',
                        tier === 'low' && 'bg-base-800 text-base-500',
                    )}>
                        {score}/10
                    </span>
                    <span className={clsx(
                        'text-xs',
                        tier === 'hot' && 'text-orange-400',
                        tier === 'warm' && 'text-yellow-400',
                        tier === 'low' && 'text-base-500',
                    )}>
                        {tier === 'hot' && 'Hot Prospect'}
                        {tier === 'warm' && 'Worth Contacting'}
                        {tier === 'low' && 'Low Priority'}
                    </span>
                </div>
                {reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {reasons.map((reason, i) => (
                            <span
                                key={i}
                                className="text-xs text-base-500 bg-base-800 px-2 py-0.5 rounded-md"
                            >
                                ✓ {reason}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* AI summary */}
            {isLoading && (
                <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                    <p className="text-xs text-base-500">Analysing this lead...</p>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-400">{error}</p>
            )}

            {summary && !isLoading && (
                <p className="text-sm text-base-300 leading-relaxed border-t border-base-800 pt-4">
                    {summary}
                </p>
            )}

            {!summary && !isLoading && !error && (
                <p className="text-xs text-base-500">
                    Tap Analyse for an AI read on why this business is or is not worth pursuing.
                </p>
            )}
        </div>
    );
}