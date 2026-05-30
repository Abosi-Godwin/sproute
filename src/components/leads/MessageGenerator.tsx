import { useState } from "react";
import {
    Sparkles, RefreshCw, Copy, Check,
    Loader2, MessageCircle
} from "lucide-react";
import { Lead } from "../../types";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { useSettingsStore } from "../../lib/stores/useSettingsStore";
import { clsx } from "clsx";

type MessageAngle = 'curiosity' | 'friendly' | 'direct';

interface GeneratedMessage {
    id: string;
    angle: MessageAngle;
    text: string;
}

const angleConfig: Record<MessageAngle, { label: string; color: string; bg: string }> = {
    curiosity: { label: 'Curiosity', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    friendly: { label: 'Friendly', color: 'text-brand-400', bg: 'bg-brand-500/10' },
    direct: { label: 'Direct', color: 'text-blue-400', bg: 'bg-blue-500/10' },
};

export default function MessageGenerator({ lead }: { lead: Lead }) {
    const { logActivity, saveGeneratedMessage } = useLeadsStore();
    const { outreachTone, serviceDescription } = useSettingsStore();

    const [messages, setMessages] = useState<GeneratedMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const toneInstructions: Record<string, string> = {
        casual: 'Casual Nigerian English. Warm and direct like a trusted neighbour texting.',
        formal: 'Professional but approachable. Clear and respectful like a business consultant.',
        pidgin: 'Pure Nigerian Pidgin English throughout. Natural and street-smart, every sentence in Pidgin.',
    };

    const generate = async () => {
        setIsLoading(true);
        setError("");
        setMessages([]);

        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{
                                text: `You write highly natural WhatsApp outreach messages for freelancers contacting local businesses.

The goal is to start conversations — not sell immediately.

Tone: ${toneInstructions[outreachTone]}
Service offered: ${serviceDescription || 'web development and online solutions'}

Generate exactly 3 different outreach messages with these angles:

1. CURIOSITY — Make them wonder what you noticed. Don't reveal everything. End with an intriguing question.
2. FRIENDLY — Warm, neighbourly, like someone from their area reaching out. Casual and easy to reply to.
3. DIRECT — Confident and clear. One observation, one offer, one question. No fluff.

Rules for ALL messages:
- Under 65 words each
- Sound like a real person texting on WhatsApp
- Never sound like marketing copy or AI
- Never use: "enhance your online presence", "reach more customers", "grow your business", "I hope you're doing well", "Many customers search online"
- Mention something specific or believable about the business
- Short sentences perform better
- No corporate language
- End with a soft natural question
- Never fabricate fake facts
- Never use the business owner's personal name — only the business name

Return ONLY a JSON object in this exact format, no markdown, no explanation:
{
  "curiosity": "message here",
  "friendly": "message here",
  "direct": "message here"
}`
                            }]
                        },
                        contents: [{
                            parts: [{
                                text: `Business name: ${lead.name}
Category: ${lead.category}
Location: ${lead.address}
Has website: ${lead.website ? `yes — ${lead.website}` : 'no'}
Additional context: ${lead.notes || 'none'}

Generate 3 outreach message variations.`
                            }]
                        }]
                    })
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message ?? "Gemini request failed.");

            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            const clean = raw.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(clean);

            const generated: GeneratedMessage[] = [
                { id: 'curiosity', angle: 'curiosity', text: parsed.curiosity },
                { id: 'friendly', angle: 'friendly', text: parsed.friendly },
                { id: 'direct', angle: 'direct', text: parsed.direct },
            ];

            setMessages(generated);

            // Save the curiosity variant as the default generated message
            saveGeneratedMessage(lead.id, parsed.curiosity);
            logActivity({
                leadId: lead.id,
                leadName: lead.name,
                message: `Generated 3 message variations for ${lead.name}`,
            });
        } catch (err: any) {
            setError(err.message ?? "Failed to generate messages.");
        } finally {
            setIsLoading(false);
        }
    };

    const copy = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            // fallback for older browsers
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        }
    };

    const openWhatsApp = (text: string) => {
        if (!lead.phone) return;
        const phone = lead.phone.replace(/\D/g, "");
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
    };

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-base-100">
                    Message Generator
                </h3>
                <button
                    onClick={generate}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                >
                    {isLoading
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : messages.length > 0
                            ? <RefreshCw className="w-3.5 h-3.5" />
                            : <Sparkles className="w-3.5 h-3.5" />
                    }
                    {messages.length > 0 ? "Regenerate" : "Generate 3 Variations"}
                </button>
            </div>

            {error && (
                <p className="text-xs text-red-400">{error}</p>
            )}

            {isLoading && (
                <div className="flex items-center justify-center py-6 gap-2">
                    <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                    <p className="text-xs text-base-500">Generating 3 variations...</p>
                </div>
            )}

            {messages.length > 0 && (
                <div className="space-y-3">
                    {messages.map((msg) => {
                        const config = angleConfig[msg.angle];
                        return (
                            <div
                                key={msg.id}
                                className="border border-base-800 rounded-xl p-4 space-y-3"
                            >
                                {/* Angle badge */}
                                <span className={clsx(
                                    'inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full',
                                    config.bg, config.color
                                )}>
                                    {config.label}
                                </span>

                                {/* Message */}
                                <p className="text-sm text-base-200 leading-relaxed whitespace-pre-wrap">
                                    {msg.text}
                                </p>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => copy(msg.text, msg.id)}
                                        className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg bg-base-800 text-base-300 hover:text-base-100 hover:bg-base-700 transition-colors"
                                    >
                                        {copiedId === msg.id
                                            ? <><Check className="w-3.5 h-3.5 text-brand-400" /> Copied</>
                                            : <><Copy className="w-3.5 h-3.5" /> Copy</>
                                        }
                                    </button>
                                    {lead.phone && (
                                        <button
                                            onClick={() => openWhatsApp(msg.text)}
                                            className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            WhatsApp
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {!lead.phone && (
                        <p className="text-xs text-base-500 text-center">
                            No phone number — copy and send manually.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}