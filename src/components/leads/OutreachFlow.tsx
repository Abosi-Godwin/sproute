import { useState } from 'react';
import {
    MessageCircle, Loader2, Sparkles,
    Copy, Check, RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';
import { Lead, OutreachFlowTab } from '../../types';
import { useLeadsStore } from '../../lib/stores/useLeadsStore';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';
import { painPointsToContext } from '../../utils/painPoints';
import toast from 'react-hot-toast';

// ─── No Reply Sequence ───────────────────────────────────────────

interface SequenceMessage {
    day: number;
    label: string;
    text: string;
}

function NoReplyTab({ lead }: { lead: Lead }) {
    const { outreachTone, serviceDescription } = useSettingsStore();
    const [sequence, setSequence] = useState<SequenceMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedDay, setCopiedDay] = useState<number | null>(null);

    const toneMap: Record<string, string> = {
        casual: 'Casual Nigerian English, warm and direct.',
        formal: 'Professional but approachable.',
        pidgin: 'Natural Nigerian Pidgin English throughout.',
    };

    const painContext = lead.painPoints
        ? painPointsToContext(lead.painPoints)
        : 'No specific signals';

    const generate = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{
                                text: `You write WhatsApp follow-up messages for freelancers who got no reply after their first outreach.

Tone: ${toneMap[outreachTone]}
Service: ${serviceDescription || 'web development'}

Generate 3 follow-up messages:

Day 3: Short check-in. One or two sentences. No pressure. Do not repeat the original pitch.
Day 7: Add value. Reference a specific pain point from the business signals provided. Give them something useful — an observation, a tip, or a question that makes them think. Still no hard sell.
Day 14: Final message. Graceful exit. Leave the door open without being desperate.

Rules:
- Each message under 50 words
- Sound like a real person not a bot
- No corporate language
- No fake flattery
- Only reference facts from the data provided
- Never invent information
- Natural question to end each message
- Day 7 must reference the specific pain points provided

Return ONLY valid JSON:
{
  "day3": "...",
  "day7": "...",
  "day14": "..."
}`
                            }]
                        },
                        contents: [{
                            parts: [{
                                text: `Business: ${lead.name}
Category: ${lead.category}
Has website: ${lead.website ? 'yes' : 'no'}
Rating: ${lead.rating ?? 'unknown'}
Reviews: ${lead.reviews ?? 'unknown'}
Business signals: ${painContext}
Notes: ${lead.notes || 'none'}`
                            }]
                        }]
                    })
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message ?? 'Failed');

            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            const clean = raw.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(clean);

            setSequence([
                { day: 3, label: 'Day 3 — Check in', text: parsed.day3 },
                { day: 7, label: 'Day 7 — Add value', text: parsed.day7 },
                { day: 14, label: 'Day 14 — Final message', text: parsed.day14 },
            ]);
            toast.success('Follow-up sequence generated');
        } catch {
            toast.error('Generation failed — try again');
        } finally {
            setIsLoading(false);
        }
    };

    const copy = async (text: string, day: number) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopiedDay(day);
        setTimeout(() => setCopiedDay(null), 2000);
        toast.success('Copied');
    };

    return (
        <div className="space-y-4">
            <p className="text-xs text-base-500">
                No reply yet. Generate follow-up messages for day 3, 7 and 14.
                Day 7 references this business's specific signals.
            </p>

            <button
                onClick={generate}
                disabled={isLoading}
                className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
                {isLoading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : sequence.length > 0
                        ? <RefreshCw className="w-3.5 h-3.5" />
                        : <Sparkles className="w-3.5 h-3.5" />
                }
                {sequence.length > 0 ? 'Regenerate' : 'Generate Sequence'}
            </button>

            {isLoading && (
                <div className="flex items-center gap-2 py-4 justify-center">
                    <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                    <p className="text-xs text-base-500">Building your follow-up sequence...</p>
                </div>
            )}

            {sequence.length > 0 && !isLoading && (
                <div className="space-y-3">
                    {sequence.map(msg => (
                        <div
                            key={msg.day}
                            className="border border-base-800 rounded-xl p-4 space-y-3"
                        >
                            <p className="text-xs font-semibold text-base-400">
                                {msg.label}
                            </p>
                            <p className="text-sm text-base-200 leading-relaxed">
                                {msg.text}
                            </p>
                            <button
                                onClick={() => copy(msg.text, msg.day)}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-base-800 text-base-300 hover:text-base-100 hover:bg-base-700 transition-colors"
                            >
                                {copiedDay === msg.day
                                    ? <><Check className="w-3.5 h-3.5 text-brand-400" /> Copied</>
                                    : <><Copy className="w-3.5 h-3.5" /> Copy</>
                                }
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── They Replied Templates ──────────────────────────────────────

const SCENARIOS = [
    { id: 'interested', label: 'Interested' },
    { id: 'price', label: 'Asked price' },
    { id: 'not_now', label: 'Not now' },
    { id: 'autoreply', label: 'Auto-reply' },
    { id: 'final_followup', label: 'Final follow-up' },
];

type ScenarioId = 'interested' | 'price' | 'not_now' | 'autoreply' | 'final_followup';

function getTemplate(
    scenario: ScenarioId,
    tone: 'casual' | 'formal' | 'pidgin',
    service: string,
    businessName: string
): string {
    const s = service || 'web development';
    const b = businessName;

    const templates: Record<ScenarioId, Record<'casual' | 'formal' | 'pidgin', string>> = {
        interested: {
            casual: `Nice one! Let me send you a quick example so you can see the direction clearly. What works for you — today or tomorrow?`,
            formal: `Thank you for your interest. I would love to share a brief overview of what I have in mind for ${b}. Would today or tomorrow work for a quick look?`,
            pidgin: `Nice one! Make I send you quick example so you fit see the direction well. Today or tomorrow go work for you?`,
        },
        price: {
            casual: `Depends on exactly what you need. Once I understand your situation I can give you an accurate number. Can I ask a few quick questions?`,
            formal: `The cost depends on the scope of work. I would like to ask a few questions first to give ${b} the most accurate figure. Would that be alright?`,
            pidgin: `E depend on wetin you need exactly. Once I understand your situation I go fit give you correct price. I fit ask small questions?`,
        },
        not_now: {
            casual: `No problem at all. Whenever the time is right, just reach out and we will continue from there.`,
            formal: `Absolutely understood. Please feel free to reach out whenever you are ready and we can take it from there.`,
            pidgin: `No wahala at all. Anytime the time don reach, just message me make we continue from there.`,
        },
        autoreply: {
            casual: `Thanks. Whenever a real person from ${b} sees this, I would love to share a quick idea. No rush at all.`,
            formal: `Thank you for the response. Whenever a member of the ${b} team is available, I would be happy to share a brief idea. No urgency.`,
            pidgin: `Thanks. Anytime real person from ${b} see this message, I go love share quick idea. No rush at all.`,
        },
        final_followup: {
            casual: `I will leave this here for now. If you ever want to revisit it, just message me and I will be around.`,
            formal: `I understand you may be occupied. Please do not hesitate to reach out whenever you are ready to explore this further.`,
            pidgin: `I go leave am here for now. Anytime you wan revisit am, just message me — I dey.`,
        },
    };

    return templates[scenario][tone];
}

function RepliedTab({ lead }: { lead: Lead }) {
    const { outreachTone, serviceDescription } = useSettingsStore();
    const [activeScenario, setActiveScenario] = useState<ScenarioId>('interested');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const tone = outreachTone === 'formal' ? 'formal' : outreachTone as 'casual' | 'pidgin';
    const text = getTemplate(activeScenario, tone, serviceDescription, lead.name);

    const whatsappNumber = lead.whatsappNumber ?? lead.phone;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopiedId(activeScenario);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success('Copied');
    };

    const openWhatsApp = () => {
        if (!whatsappNumber) return;
        const clean = whatsappNumber.replace(/\D/g, '');
        window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="space-y-4">
            <p className="text-xs text-base-500">
                Select what happened and copy the right response.
            </p>

            {/* Scenario picker */}
            <div className="flex items-center gap-2 flex-wrap">
                {SCENARIOS.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveScenario(s.id as ScenarioId)}
                        className={clsx(
                            'text-xs px-3 py-1.5 rounded-lg transition-colors',
                            activeScenario === s.id
                                ? 'bg-brand-500/10 text-brand-400'
                                : 'bg-base-800 text-base-500 hover:text-base-300'
                        )}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Message preview */}
            <div className="border border-base-800 rounded-xl p-4 space-y-3">
                <p className="text-sm text-base-200 leading-relaxed">
                    {text}
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={copy}
                        className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg bg-base-800 text-base-300 hover:text-base-100 hover:bg-base-700 transition-colors"
                    >
                        {copiedId === activeScenario
                            ? <><Check className="w-3.5 h-3.5 text-brand-400" /> Copied</>
                            : <><Copy className="w-3.5 h-3.5" /> Copy</>
                        }
                    </button>
                    {whatsappNumber && (
                        <button
                            onClick={openWhatsApp}
                            className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────

export default function OutreachFlow({ lead }: { lead: Lead }) {
    const { setOutreachFlowTab } = useLeadsStore();
    const [expanded, setExpanded] = useState(false);

    const activeTab: OutreachFlowTab = lead.outreachFlowTab ?? 'no_reply';

    const handleTabChange = async (tab: OutreachFlowTab) => {
        await setOutreachFlowTab(lead.id, tab);
    };

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-4">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between"
            >
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-brand-400" />
                    <h3 className="font-display font-semibold text-base-100">
                        Outreach Flow
                    </h3>
                </div>
                <span className="text-xs text-base-500">
                    {expanded ? 'Hide' : 'Show'}
                </span>
            </button>

            {expanded && (
                <div className="space-y-4">
                    {/* Tab switcher */}
                    <div className="flex items-center gap-2 p-1 bg-base-800 rounded-xl">
                        <button
                            onClick={() => handleTabChange('no_reply')}
                            className={clsx(
                                'flex-1 text-xs font-medium py-2 rounded-lg transition-colors',
                                activeTab === 'no_reply'
                                    ? 'bg-base-700 text-base-100'
                                    : 'text-base-500 hover:text-base-300'
                            )}
                        >
                            No Reply
                        </button>
                        <button
                            onClick={() => handleTabChange('replied')}
                            className={clsx(
                                'flex-1 text-xs font-medium py-2 rounded-lg transition-colors',
                                activeTab === 'replied'
                                    ? 'bg-base-700 text-base-100'
                                    : 'text-base-500 hover:text-base-300'
                            )}
                        >
                            They Replied
                        </button>
                    </div>

                    {/* Tab content */}
                    {activeTab === 'no_reply'
                        ? <NoReplyTab lead={lead} />
                        : <RepliedTab lead={lead} />
                    }
                </div>
            )}
        </div>
    );
}