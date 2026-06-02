import { useState } from "react";
import {
    Sparkles,
    RefreshCw,
    Copy,
    Check,
    Loader2,
    MessageCircle
} from "lucide-react";
import { Lead, MessageAngle } from "../../types";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { useSettingsStore } from "../../lib/stores/useSettingsStore";
import { clsx } from "clsx";
import toast from "react-hot-toast";

interface GeneratedMessage {
    id: string;
    angle: MessageAngle;
    text: string;
}

const angleConfig: Record<
    MessageAngle,
    { label: string; color: string; bg: string }
> = {
    curiosity: {
        label: "Curiosity",
        color: "text-purple-400",
        bg: "bg-purple-500/10"
    },
    friendly: {
        label: "Friendly",
        color: "text-brand-400",
        bg: "bg-brand-500/10"
    },
    direct: { label: "Direct", color: "text-blue-400", bg: "bg-blue-500/10" }
};

// Parse persisted messages from lead
function parsePersistedMessages(raw?: string): GeneratedMessage[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (parsed.curiosity && parsed.friendly && parsed.direct) {
            return [
                { id: "curiosity", angle: "curiosity", text: parsed.curiosity },
                { id: "friendly", angle: "friendly", text: parsed.friendly },
                { id: "direct", angle: "direct", text: parsed.direct }
            ];
        }
    } catch {
        if (raw) return [{ id: "curiosity", angle: "curiosity", text: raw }];
    }
    return [];
}

export default function MessageGenerator({ lead }: { lead: Lead }) {
    const { logActivity, saveGeneratedMessage, setSelectedMessageAngle } =
        useLeadsStore();
    const { outreachTone, serviceDescription } = useSettingsStore();

    const [messages, setMessages] = useState<GeneratedMessage[]>(() =>
        parsePersistedMessages(lead.generatedMessage)
    );
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const toneInstructions: Record<string, string> = {
        casual: "Casual Nigerian English. Warm and direct like a trusted neighbour texting.",
        formal: "Professional but approachable. Clear and respectful like a business consultant.",
        pidgin: "Pure Nigerian Pidgin English throughout. Natural and street-smart, every sentence in Pidgin."
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
                            parts: [
                                {
                                    text: `You write WhatsApp outreach messages for freelancers contacting local businesses.

The goal is to start a conversation, not sell immediately.

Tone: ${toneInstructions[outreachTone]}
Service: ${serviceDescription || "web development and online solutions"}

Generate exactly 3 different messages:

1. CURIOSITY
- Based on a real observation from the lead data
- End with a simple question

2. FRIENDLY
- Sound like a local person reaching out
- Relaxed and easy to reply to

3. DIRECT
- One observation
- One practical suggestion
- One question

Rules:
- Under 60 words each
- Sound like a real Nigerian freelancer using WhatsApp
- Use simple everyday English
- Avoid marketing language
- Avoid corporate language
- Avoid exaggerated compliments
- Avoid flattery
- Avoid mystery phrases like "I noticed something interesting", "I have an idea", "I spotted something", "I discovered something"
- Only reference information provided in the lead data
- Never invent facts
- Never invent personal names
- Mention the business name naturally
- End with a natural question
- Prioritize observations over pitches

Good style example:
"Hi [Business Name], I was checking ${lead.category?.toLowerCase() || "businesses"} around ${lead.searchLocation || "your area"} and noticed you don't seem to have a website yet. Considering the reviews you've already built up, have you ever thought about one?"

Return ONLY valid JSON with no markdown:
{
  "curiosity": "...",
  "friendly": "...",
  "direct": "..."
}`
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
Additional context: ${lead.notes || "none"}

Generate 3 outreach message variations.`
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

            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            const clean = raw.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(clean);

            const generated: GeneratedMessage[] = [
                { id: "curiosity", angle: "curiosity", text: parsed.curiosity },
                { id: "friendly", angle: "friendly", text: parsed.friendly },
                { id: "direct", angle: "direct", text: parsed.direct }
            ];

            setMessages(generated);

            // Save all 3 as JSON for persistence
            saveGeneratedMessage(lead.id, JSON.stringify(parsed));

            logActivity({
                leadId: lead.id,
                leadName: lead.name,
                message: `Generated 3 message variations for ${lead.name}`
            });
            toast.success("3 variations generated");
        } catch (err: any) {
            const message = err.message ?? "";
            if (
                message.includes("429") ||
                message.toLowerCase().includes("quota")
            ) {
                setError("Daily AI limit reached — try again tomorrow");
                toast.error("AI quota reached");
            } else if (
                message.includes("403") ||
                message.toLowerCase().includes("api key")
            ) {
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
            message: `Copied ${angle} message for ${lead.name}`
        });
    };
  
    const openWhatsApp = (text: string, angle?: MessageAngle) => {
        const number = lead.whatsappNumber ?? lead.phone;
        if (!number) return;
        const phone = number.replace(/\D/g, "");
        window.open(
            `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
            "_blank"
        );

        setSelectedMessageAngle(lead.id, angle);
        logActivity({
            leadId: lead.id,
            leadName: lead.name,
            message: `Sent ${angle} message to ${lead.name} via WhatsApp`
        });
    };

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h3 className="font-display font-semibold text-base-100">
                        Message Generator
                    </h3>
                    {lead.selectedMessageAngle && (
                        <p className="text-xs text-base-500">
                            Last used:{" "}
                            <span
                                className={
                                    angleConfig[lead.selectedMessageAngle].color
                                }
                            >
                                {angleConfig[lead.selectedMessageAngle].label}
                            </span>
                        </p>
                    )}
                </div>
                <button
                    onClick={generate}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                >
                    {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : messages.length > 0 ? (
                        <RefreshCw className="w-3.5 h-3.5" />
                    ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {messages.length > 0
                        ? "Regenerate"
                        : "Generate 3 Variations"}
                </button>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            {isLoading && (
                <div className="flex items-center justify-center py-6 gap-2">
                    <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                    <p className="text-xs text-base-500">
                        Generating 3 variations...
                    </p>
                </div>
            )}

            {messages.length > 0 && (
                <div className="space-y-3">
                    {messages.map(msg => {
                        const config = angleConfig[msg.angle];
                        const isLastUsed =
                            lead.selectedMessageAngle === msg.angle;
                        return (
                            <div
                                key={msg.id}
                                className={clsx(
                                    "border rounded-xl p-4 space-y-3 transition-colors",
                                    isLastUsed
                                        ? "border-brand-500/30 bg-brand-500/5"
                                        : "border-base-800"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className={clsx(
                                            "inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full",
                                            config.bg,
                                            config.color
                                        )}
                                    >
                                        {config.label}
                                    </span>
                                    {isLastUsed && (
                                        <span className="text-xs text-base-500">
                                            Last used
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm text-base-200 leading-relaxed whitespace-pre-wrap">
                                    {msg.text}
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() =>
                                            copy(msg.text, msg.angle)
                                        }
                                        className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg bg-base-800 text-base-300 hover:text-base-100 hover:bg-base-700 transition-colors"
                                    >
                                        {copiedId === msg.id ? (
                                            <>
                                                <Check className="w-3.5 h-3.5 text-brand-400" />{" "}
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5" />{" "}
                                                Copy
                                            </>
                                        )}
                                    </button>
                                    {lead.phone && (
                                        <button
                                            onClick={() =>
                                                openWhatsApp(
                                                    msg.text,
                                                    msg.angle
                                                )
                                            }
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
