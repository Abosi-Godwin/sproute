import { useState, useEffect } from "react";
import {
    Sparkles, RefreshCw, Copy, Check, Loader2, MessageCircle
} from "lucide-react";
import { Lead, MessageAngle, OutreachStep } from "../../types";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { useSettingsStore } from "../../lib/stores/useSettingsStore";
import { useUsageStore } from "../../lib/stores/useUsageStore";
import { useSubscriptionStore } from "../../lib/stores/useSubscriptionStore";
import UpgradeModal from "../ui/UpgradeModal";
import { clsx } from "clsx";
import toast from "react-hot-toast";

interface GeneratedMessage {
    id: string;
    angle: MessageAngle;
    text: string;
}

const angleConfig: Record<MessageAngle, { label: string; color: string; bg: string }> = {
    curiosity: { label: "Curiosity", color: "text-purple-400", bg: "bg-purple-500/10" },
    friendly: { label: "Friendly", color: "text-brand-400", bg: "bg-brand-500/10" },
    direct: { label: "Direct", color: "text-blue-400", bg: "bg-blue-500/10" },
};

function parsePersistedMessages(raw?: string): GeneratedMessage[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (parsed.curiosity && parsed.friendly && parsed.direct) {
            return [
                { id: "curiosity", angle: "curiosity", text: parsed.curiosity },
                { id: "friendly", angle: "friendly", text: parsed.friendly },
                { id: "direct", angle: "direct", text: parsed.direct },
            ];
        }
    } catch {
        if (raw) return [{ id: "curiosity", angle: "curiosity", text: raw }];
    }
    return [];
}

export default function MessageGenerator({ lead }: { lead: Lead }) {
    const {
        logActivity, saveGeneratedMessage,
        setSelectedMessageAngle, setLastOutreachStep
    } = useLeadsStore();

    const { outreachTone, serviceDescription } = useSettingsStore();
    const { canGenerateAi, incrementAiGenerations, remainingAiGenerations, resetIfNewDay } = useUsageStore();
    const { isPro } = useSubscriptionStore();
    const pro = isPro();

    const [messages, setMessages] = useState<GeneratedMessage[]>(() =>
        parsePersistedMessages(lead.generatedMessage)
    );
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [showUpgrade, setShowUpgrade] = useState(false);

    const toneInstructions: Record<string, string> = {
        casual: "Warm, conversational Standard Nigerian English. NOT Pidgin. Friendly but clear.",
        formal: "Professional and approachable Standard English. NOT Pidgin.",
        pidgin: "Natural Nigerian Pidgin English throughout — every sentence.",
    };

    const generate = async () => {
        resetIfNewDay();
        if (!canGenerateAi(pro)) {
            setShowUpgrade(true);
            return;
        }
        setIsLoading(true);
        setError("");
        setMessages([]);

        try {
            const res = await fetch("/api/gemini",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{
                                text: `You write WhatsApp cold outreach messages for Nigerian freelancers contacting local small businesses.

The goal is NOT to sell immediately. The goal is to get ONE response — ideally permission to send a preview, sample, or more details.

Tone: ${toneInstructions[outreachTone]}
Service: ${serviceDescription || "web development and online solutions"}

Nigerian market context:
- Nigerian small business owners are skeptical of cold messages. They have seen too many scammers and empty promises.
- They decide within seconds: "What does this person want?"
- They respond to clarity and low-risk offers, not long discovery questions.
- They buy after they SEE something, not after they understand a concept.
- The most effective CTA is "Can I send you a free preview?" not "Would you like to discuss this?"
- Do NOT lead with discovery questions. Lead with a specific observation, then a concrete offer.

Framework for every message:
1. Show you have actually looked at their business — mention something specific
2. Describe a concrete customer friction they already experience daily — not an abstract concept
3. Offer something tangible the business owner can say yes to seeing (a preview, a sample, a concept)
4. One simple low-friction question at the end — asking for permission, not commitment

Generate exactly 3 different messages:

1. CURIOSITY
- Open with a specific observation about this business
- Translate the gap (no website, unclaimed listing, etc.) into a real daily friction their customers experience
- Offer to send a free preview or sample
- End with "Can I send it over?" or similar low-friction permission question

2. FRIENDLY
- Sound like a local person who genuinely noticed something about their business
- Warm and easy to reply to
- Still includes the concrete friction and the tangible offer
- Feels like a neighbour, not a salesperson

3. DIRECT
- One sentence observation
- One sentence on what it costs them daily
- One sentence offer
- One yes/no question

Rules:
- Under 70 words each
- Sound like a real Nigerian freelancer, not a marketing template
- Use simple everyday English
- Never use abstract terms like "online presence", "online visibility", "digital footprint", "digital marketing", "brand awareness"
- Instead describe what customers physically have to do because the gap exists — "customers have to call before knowing your prices", "people driving past can't find your menu online", "new customers can't browse your products before visiting"
- Never use mystery phrases like "I noticed something interesting", "I have an idea", "I spotted something"
- Only reference facts from the lead data provided
- Never invent facts or names
- Mention the business name naturally
- The offer must be concrete — a preview, a sample, a concept — not a vague "help" or "solution"
- End with one simple question asking for permission to send something, not asking them to commit to anything
- If tone is casual or formal, write in Standard English only — no Pidgin
- If tone is pidgin, write entirely in Pidgin
- Never mix tones

Strong example (casual):
"Hi [Business Name], I came across your store while checking businesses around [location].

I noticed customers can't browse your products or see your prices online before deciding to visit or call you.

I put together a quick concept showing how your store could look online with a WhatsApp order button — completely free to view.

Can I send it over?"

Return ONLY valid JSON with no markdown:
{
  "curiosity": "...",
  "friendly": "...",
  "direct": "..."
}`
                            }]
                        },
                        contents: [{
                            parts: [{
                                text: `Business name: ${lead.name}
Category: ${lead.category}
Location: ${lead.address}
Has website: ${lead.website ? `yes — ${lead.website}` : "no"}
Rating: ${lead.rating ?? "unknown"}
Reviews: ${lead.reviews ?? "unknown"}
Unclaimed listing: ${lead.unclaimedListing ? "yes" : "no"}
Additional context: ${lead.notes || "none"}

Generate 3 outreach message variations.`
                            }]
                        }]
                    })
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message ?? "Gemini request failed.");

            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            const clean = raw.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(clean);

            const generated: GeneratedMessage[] = [
                { id: "curiosity", angle: "curiosity", text: parsed.curiosity },
                { id: "friendly", angle: "friendly", text: parsed.friendly },
                { id: "direct", angle: "direct", text: parsed.direct },
            ];

            setMessages(generated);
            saveGeneratedMessage(lead.id, JSON.stringify(parsed));
            logActivity({
                leadId: lead.id,
                leadName: lead.name,
                message: `Generated 3 message variations for ${lead.name}`,
            });
            incrementAiGenerations();
            toast.success("3 variations generated");
        } catch (err: any) {
            const message = err.message ?? "";
            if (message.includes("429") || message.toLowerCase().includes("quota")) {
                setError("Daily AI limit reached — try again tomorrow");
                toast.error("AI quota reached");
            } else if (message.includes("403") || message.toLowerCase().includes("api key")) {
                setError("API key error — contact support");
                toast.error("AI configuration error");
            } else if (message.includes("JSON") || message.includes("parse")) {
                setError("AI returned unexpected format — try again");
                toast.error("Generation failed — try again");
            } else {
                setError("Failed to generate — check your connection");
                toast.error("Generation failed");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const copy = async (text: string, angle: MessageAngle) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const el = document.createElement("textarea");
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
        }
        setCopiedId(angle);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success("Copied to clipboard");
        setSelectedMessageAngle(lead.id, angle);
        logActivity({
            leadId: lead.id,
            leadName: lead.name,
            message: `Copied ${angle} message for ${lead.name}`,
        });
    };

    const openWhatsApp = (text: string, angle?: MessageAngle) => {
        const number = lead.whatsappNumber ?? lead.phone;
        if (!number) return;
        const phone = number.replace(/\D/g, "");
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
        if (angle) {
            setSelectedMessageAngle(lead.id, angle);
            setLastOutreachStep(lead.id, `initial_${angle}` as OutreachStep);
        }
        logActivity({
            leadId: lead.id,
            leadName: lead.name,
            message: `Sent ${angle} message to ${lead.name} via WhatsApp`,
        });
    };

    useEffect(() => {
        resetIfNewDay();
    }, []);

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h3 className="font-display font-semibold text-base-100">Message Generator</h3>
                    {lead.selectedMessageAngle && (
                        <p className="text-xs text-base-500">
                            Last used: <span className={angleConfig[lead.selectedMessageAngle].color}>
                                {angleConfig[lead.selectedMessageAngle].label}
                            </span>
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!pro && (
                        <span className="text-xs text-base-600">
                            {remainingAiGenerations(pro)} left today
                        </span>
                    )}
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
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            {isLoading && (
                <div className="flex items-center justify-center py-6 gap-2">
                    <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                    <p className="text-xs text-base-500">Generating 3 variations...</p>
                </div>
            )}

            {messages.length > 0 && (
                <div className="space-y-3">
                    {messages.map(msg => {
                        const config = angleConfig[msg.angle];
                        const isLastUsed = lead.selectedMessageAngle === msg.angle;
                        return (
                            <div
                                key={msg.id}
                                className={clsx(
                                    "border rounded-xl p-4 space-y-3 transition-colors",
                                    isLastUsed ? "border-brand-500/30 bg-brand-500/5" : "border-base-800"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={clsx(
                                        "inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full",
                                        config.bg, config.color
                                    )}>
                                        {config.label}
                                    </span>
                                    {isLastUsed && (
                                        <span className="text-xs text-base-500">Last used</span>
                                    )}
                                </div>

                                <p className="text-sm text-base-200 leading-relaxed whitespace-pre-wrap">
                                    {msg.text}
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => copy(msg.text, msg.angle)}
                                        className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg bg-base-800 text-base-300 hover:text-base-100 hover:bg-base-700 transition-colors"
                                    >
                                        {copiedId === msg.id
                                            ? <><Check className="w-3.5 h-3.5 text-brand-400" /> Copied</>
                                            : <><Copy className="w-3.5 h-3.5" /> Copy</>
                                        }
                                    </button>
                                    {lead.phone && (
                                        <button
                                            onClick={() => openWhatsApp(msg.text, msg.angle)}
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

            {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
        </div>
    );
}