import { useState } from "react";
import {
    Sparkles,
    RefreshCw,
    Copy,
    Check,
    Loader2,
    MessageCircle
} from "lucide-react";

import { Lead } from "../../types";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { useSettingsStore } from "../../lib/stores/useSettingsStore";

export default function MessageGenerator({ lead }: { lead: Lead }) {
    const { logActivity, saveGeneratedMessage } = useLeadsStore();
    const { outreachTone, serviceDescription } = useSettingsStore();

    const [message, setMessage] = useState(lead.generatedMessage ?? "");
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    const generate = async () => {
        setIsLoading(true);
        setError("");

        const toneInstructions: Record<string, string> = {
            casual: `Casual Nigerian English. Warm and direct like a trusted neighbour texting.`,
            formal: `Professional but approachable. Clear and respectful like a business consultant.`,
            pidgin: `Pure Nigerian Pidgin English throughout. Natural and street-smart, every sentence in Pidgin.`
        };

        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [
                                {
                                    text: `You write WhatsApp cold outreach messages for a freelance service provider.

Service offered: ${serviceDescription || "web development"}
Tone: ${toneInstructions[outreachTone]}

Every message must follow this exact structure:
- Open with a specific action you took — "I was trying to find [their service] online in [their area] but couldn't find [your business name]"
- One empathy line — acknowledge they're busy running their business, not blaming them
- Soft curiosity close — "Happy to share what I found if you're open to it" or similar
- Never more than 3 short paragraphs
- Never sound like a pitch — sound like someone who genuinely noticed something
- Never fabricate a person's name — only use the business name`
                                }
                            ]
                        },
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `Business name: ${lead.name}
Category: ${lead.category}
Location: ${lead.address}
Has website: ${lead.website ? `yes — ${lead.website}` : "no"}
Phone: ${lead.phone ?? "not available"}
Additional context: ${lead.notes ? lead.notes : "none"}

Write a WhatsApp outreach message for this business owner.`
                                    }
                                ]
                            }
                        ]
                    })
                }
            );

            const data = await res.json();
            if (!res.ok)
                throw new Error(
                    data.error?.message ?? "Gemini request failed."
                );

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            setMessage(text);
            saveGeneratedMessage(lead.id, text);
            logActivity({
                leadId: lead.id,
                leadName: lead.name,
                message: `Generated message for ${lead.name}`
            });
        } catch (err: any) {
            setError(err.message ?? "Failed to generate message.");
        } finally {
            setIsLoading(false);
        }
    };

    const copy = () => {
        navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openWhatsApp = () => {
        if (!lead.phone) return;
        const phone = lead.phone.replace(/\D/g, "");
        window.open(
            `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
            "_blank"
        );
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
                    {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : message ? (
                        <RefreshCw className="w-3.5 h-3.5" />
                    ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {message ? "Regenerate" : "Generate"}
                </button>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            {message && (
                <div className="space-y-3">
                    <textarea
                        readOnly
                        value={message}
                        rows={6}
                        className="w-full bg-base-800 border border-base-700 rounded-lg px-4 py-3 text-sm text-base-100 resize-none focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                        <button
                            onClick={copy}
                            className="flex items-center gap-2 flex-1 justify-center text-xs font-medium px-3 py-2.5 rounded-lg bg-base-800 text-base-300 hover:text-base-100 hover:bg-base-700 transition-colors"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-brand-400" />{" "}
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5" /> Copy
                                </>
                            )}
                        </button>
                        {lead.phone && (
                            <button
                                onClick={openWhatsApp}
                                className="flex items-center gap-2 flex-1 justify-center text-xs font-medium px-3 py-2.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                Open in WhatsApp
                            </button>
                        )}
                    </div>
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
