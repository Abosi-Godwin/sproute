import { useState, useEffect } from "react";
import {
    Sparkles,
    RefreshCw,
    Copy,
    Check,
    Loader2,
    MessageCircle
} from "lucide-react";
import { Lead, MessageAngle, OutreachStep } from "../../types";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { useSettingsStore } from "../../lib/stores/useSettingsStore";
import { useUsageStore } from "../../lib/stores/useUsageStore";
import { posthog } from "../../lib/posthog";

import {
    useGenerateMessages,
    GeneratedMessage
} from "../../hooks/useGenerateMessages";
import UpgradeModal from "../ui/UpgradeModal";
import { clsx } from "clsx";
import toast from "react-hot-toast";

import { copyText } from "./outreach/outreachUtils";

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
    const { setSelectedMessageAngle, setLastOutreachStep, logActivity } =
        useLeadsStore();
    const { outreachTone, serviceDescription } = useSettingsStore();
    const { remainingAiGenerations, resetIfNewDay } = useUsageStore();

    const { generate, isLoading, error, showUpgrade, setShowUpgrade, pro } =
        useGenerateMessages(lead, outreachTone, serviceDescription);

    const [messages, setMessages] = useState<GeneratedMessage[]>(
        () => parsePersistedMessages(lead?.generatedMessage) || []
    );
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const number = lead.whatsappNumber || lead.phone;

    useEffect(() => {
        resetIfNewDay();
    }, [resetIfNewDay]);

    useEffect(() => {
        if (!error) return;
        posthog.capture("generation_failed", {
            lead_id: lead.id,
            message: String(error)
        });
    }, [error]);

    useEffect(() => {
        if (!showUpgrade) return;
        posthog.capture("upgrade_modal_shown", {
            source: "message_generator",
            lead_id: lead.id
        });
    }, [showUpgrade]);

    const handleGenerate = async () => {
        resetIfNewDay();
        const regenerate = messages.length > 0;
        const results = await generate();
        if (results) {
            posthog.capture("messages_generated", {
                lead_id: lead.id,
                regenerate,
                count: results.length
            });
            setMessages(results);
        }
    };

    const handleCopy = async (
        text: string,
        msgId: string,
        angle: MessageAngle
    ) => {
        try {
            await copyText(text);
        } catch (err: any) {
            posthog.capture("message_copy_failed", {
                lead_id: lead.id,
                angle,
                message: err?.message ?? ""
            });
            toast.error("Couldn't copy. Select the text and copy it manually");
            return;
        }

        posthog.capture("message_copied", { lead_id: lead.id, angle });

        setCopiedId(msgId);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success("Copied to clipboard");
        setSelectedMessageAngle(lead.id, angle);
        logActivity({
            leadId: lead.id,
            leadName: lead.name,
            message: `Copied ${angle} message for ${lead.name}`
        });
    };

    const handleWhatsApp = (text: string, angle?: MessageAngle) => {
        if (!number) return;
        const phone = number.replace(/\D/g, "");

        posthog.capture("message_sent", {
            lead_id: lead.id,
            angle,
            channel: "whatsapp"
        });

        window.open(
            `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
            "_blank"
        );
        if (angle) {
            setSelectedMessageAngle(lead.id, angle);
            setLastOutreachStep(lead.id, `initial_${angle}` as OutreachStep);
        }
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
                <div className="flex items-center gap-2">
                    {!pro && (
                        <span className="text-xs text-base-600">
                            {remainingAiGenerations(pro)} left today
                        </span>
                    )}
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                        {isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : messages?.length > 0 ? (
                            <RefreshCw className="w-3.5 h-3.5" />
                        ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                        )}
                        {messages?.length > 0
                            ? "Regenerate"
                            : "Generate 3 Variations"}
                    </button>
                </div>
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

            {messages?.length > 0 && (
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
                                            handleCopy(
                                                msg.text,
                                                msg.id,
                                                msg.angle
                                            )
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
                                    {number && (
                                        <button
                                            onClick={() =>
                                                handleWhatsApp(
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

                    {!number && (
                        <p className="text-xs text-base-500 text-center">
                            No phone number. Copy and send manually.
                        </p>
                    )}
                </div>
            )}

            {showUpgrade && (
                <UpgradeModal onClose={() => setShowUpgrade(false)} />
            )}
        </div>
    );
}