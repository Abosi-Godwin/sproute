import { useState } from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';
import { Lead } from '../../types';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';

interface Template {
    id: string;
    label: string;
    scenario: string;
    messages: {
        casual: string;
        formal: string;
        pidgin: string;
    };
}

const getTemplates = (service: string): Template[] => [
    {
        id: 'interested',
        label: 'They are interested',
        scenario: 'Business replied positively',
        messages: {
            casual: `Nice one! Let me send you a quick example so you can see the direction clearly. What works for you — today or tomorrow?`,
            formal: `Thank you for your interest. I would love to share a brief overview of what I have in mind. Would today or tomorrow work for a quick look?`,
            pidgin: `Nice one! Make I send you quick example make you see the direction well. Today or tomorrow dey work for you?`,
        },
    },
    {
        id: 'price',
        label: 'They asked for price',
        scenario: 'Business wants to know cost',
        messages: {
            casual: `Depends on exactly what you need. Once I understand the scope, I'll give you the best price. Can I ask a few quick questions?`,
            formal: `The investment depends on the scope of work. I would like to ask a few questions to give you an accurate figure. Would that be alright?`,
            pidgin: `E depend on wetin you need exactly. Once I understand the scope, I go give you correct price. I fit ask small questions?`,
        },
    },
    {
        id: 'followup',
        label: 'No response after 3 days',
        scenario: 'Following up on unanswered message',
        messages: {
            casual: `Just checking in — still happy to share that idea whenever you're ready.`,
            formal: `I wanted to follow up on my earlier message. I am still available to discuss whenever it is convenient for you.`,
            pidgin: `Just dey check in — I still fit share that idea anytime you ready.`,
        },
    },
    {
        id: 'touch3',
        label: 'Final follow-up',
        scenario: 'Last message before moving on',
        messages: {
            casual: `I'll leave this here for now. If you ever want to revisit it, just reach out — I'll be around.`,
            formal: `I understand you may be occupied. Please do not hesitate to reach out whenever you are ready to explore this further.`,
            pidgin: `I go leave am here for now. Anytime you wan revisit am, just reach out — I dey.`,
        },
    },
    {
        id: 'notnow',
        label: 'They said not now',
        scenario: 'Business is not ready yet',
        messages: {
            casual: `No worries at all. Whenever the time is right, just message me and we'll pick up from there.`,
            formal: `Absolutely understood. Please feel free to reach out whenever you are ready and we can continue from there.`,
            pidgin: `No wahala at all. Anytime the time don reach, just message me make we continue from there.`,
        },
    },
    {
        id: 'autoreply',
        label: 'They sent an auto-reply',
        scenario: 'Got an automated response',
        messages: {
            casual: `Thanks — whenever a real person sees this, I'd love to share a quick idea for the business. No rush at all.`,
            formal: `Thank you for the response. Whenever a member of your team is available, I would be happy to share a brief idea. No urgency.`,
            pidgin: `Thanks — anytime real person see this message, I go love share quick idea for the business. No rush at all.`,
        },
    },
];

interface ReplyTemplatesProps {
    lead: Lead;
    tone: 'casual' | 'formal' | 'pidgin';
}

export default function ReplyTemplates({ lead, tone }: ReplyTemplatesProps) {
    const { serviceDescription } = useSettingsStore();
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    const TEMPLATES = getTemplates(serviceDescription);

    const getTemplate = (template: Template) => {
        return template.messages[tone].replace(/\[Business Name\]/g, lead.name);
    };

    const copy = async (template: Template) => {
        const text = getTemplate(template);
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
        setCopiedId(template.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const openWhatsApp = (template: Template) => {
        if (!lead.phone) return;
        const phone = lead.phone.replace(/\D/g, '');
        const text = getTemplate(template);
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-4">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between"
            >
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-brand-400" />
                    <h3 className="font-display font-semibold text-base-100">Reply Templates</h3>
                </div>
                <span className="text-xs text-base-500">
                    {expanded ? 'Hide' : 'Show'}
                </span>
            </button>

            {expanded && (
                <div className="space-y-3">
                    <p className="text-xs text-base-500">
                        Tap a template based on what happened. Business name is auto-filled.
                    </p>
                    {TEMPLATES.map((template) => (
                        <div
                            key={template.id}
                            className="border border-base-800 rounded-xl p-4 space-y-3"
                        >
                            <div>
                                <p className="text-xs font-semibold text-base-200">{template.label}</p>
                                <p className="text-xs text-base-500 mt-0.5">{template.scenario}</p>
                            </div>

                            <p className="text-xs text-base-400 leading-relaxed">
                                {getTemplate(template)}
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => copy(template)}
                                    className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg bg-base-800 text-base-300 hover:text-base-100 hover:bg-base-700 transition-colors"
                                >
                                    {copiedId === template.id
                                        ? <><Check className="w-3 h-3 text-brand-400" /> Copied</>
                                        : <><Copy className="w-3 h-3" /> Copy</>
                                    }
                                </button>
                                {lead.phone && (
                                    <button
                                        onClick={() => openWhatsApp(template)}
                                        className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                    >
                                        <MessageCircle className="w-3 h-3" />
                                        WhatsApp
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}