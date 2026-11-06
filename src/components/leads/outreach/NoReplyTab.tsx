import { useState } from "react";
import { Loader2, Sparkles, RefreshCw, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Lead, FollowUpSequence, OutreachStep } from "../../../types";
import { useLeadsStore } from "../../../lib/stores/useLeadsStore";
import { useSettingsStore } from "../../../lib/stores/useSettingsStore";
import { painPointsToContext } from "../../../utils/painPoints";
import { useUsageStore } from "../../../lib/stores/useUsageStore";
import { useSubscriptionStore } from "../../../lib/stores/useSubscriptionStore";
import { posthog } from "../../../lib/posthog";
import { openWhatsApp, pickWhatsAppNumber } from "../../../utils/phone";
import UpgradeModal from "../../ui/UpgradeModal";
import { copyText, CopyBtn } from "./outreachUtils";

type SequenceId = "day3" | "day7" | "day14";

function getDay14(tone: string, businessName: string): string {
    if (tone === "pidgin") {
        return `E go be my last message so I no go dey disturb your inbox.\n\nIf you ever wan explore wetin website fit do for ${businessName}, just reply this message and I go dey here.\n\nAll the best.`;
    }
    if (tone === "formal") {
        return `This will be my final follow-up as I do not want to take up too much of your time.\n\nShould you ever wish to explore what a website could do for ${businessName}, please do not hesitate to reach out. I will be happy to continue from where we left off.`;
    }
    return `Hey, this will be my last message so I don't keep filling up your inbox.\n\nIf a website for ${businessName} is something you'd ever want to explore, just reply to this and we'll pick it up from here.\n\nAll the best.`;
}

function addDays(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
}

function SequenceBtn({
    text,
    number,
    step,
    leadId,
    setLastOutreachStep,
    setFollowUpDate
}: {
    text: string;
    number?: string | null;
    step: OutreachStep;
    leadId: string;
    setLastOutreachStep: (id: string, step: OutreachStep) => Promise<void>;
    setFollowUpDate: (id: string, date: string) => Promise<void>;
}) {
    if (!number) return null;

    const handleClick = () => {
        posthog.capture("message_sent", {
            lead_id: leadId,
            channel: "whatsapp",
            source: "no_reply_sequence",
            step
        });
        openWhatsApp(number, text);
        setLastOutreachStep(leadId, step);
        if (step === "day3" || step === "day7") {
            setFollowUpDate(leadId, addDays(2));
        }
    };

    return (
        <button
            onClick={handleClick}
            className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
        >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
        </button>
    );
}

function MessageSkeleton() {
    return (
        <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-base-700 rounded w-3/4" />
            <div className="h-3 bg-base-700 rounded w-full" />
            <div className="h-3 bg-base-700 rounded w-5/6" />
        </div>
    );
}

export default function NoReplyTab({ lead }: { lead: Lead }) {
    const { outreachTone, serviceDescription } = useSettingsStore();
    const { canGenerateAi, incrementAiGenerations, resetIfNewDay } =
        useUsageStore();
    const { isPro } = useSubscriptionStore();
    const { saveFollowUpSequence, setLastOutreachStep, setFollowUpDate } =
        useLeadsStore();

    const [sequence, setSequence] = useState<FollowUpSequence | null>(() => {
        const s = lead.followUpSequence;
        if (!s || !s.day3 || !s.day7) return null;
        return s;
    });
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showUpgrade, setShowUpgrade] = useState(false);

    const pro = isPro();
    const number = pickWhatsAppNumber(lead);
    const painContext = lead.painPoints
        ? painPointsToContext(lead.painPoints)
        : "No specific signals";
    const day14 = getDay14(outreachTone, lead.name);
    const showSequenceBlock = isLoading || sequence !== null;

    const blocks: {
        id: SequenceId;
        title: string;
        text: string;
        badge?: string;
    }[] = [
        { id: "day3", title: "Day 3: Check in", text: sequence?.day3 ?? "" },
        { id: "day7", title: "Day 7: Add value", text: sequence?.day7 ?? "" },
        {
            id: "day14",
            title: "Day 14: Final message",
            text: day14,
            badge: "Static"
        }
    ];

    const generate = async () => {
        resetIfNewDay();
        if (!canGenerateAi(pro)) {
            posthog.capture("upgrade_modal_shown", {
                source: "no_reply_sequence",
                lead_id: lead.id
            });
            setShowUpgrade(true);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    scenario: "no_reply_sequence",
                    tone: outreachTone,
                    service: serviceDescription || "web development",
                    leadData: `Business: ${lead.name}
Category: ${lead.category}
Has website: ${lead.website ? "yes" : "no"}
Business signals: ${painContext}
Notes: ${lead.notes || "none"}`
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `status_${res.status}`);
            if (!data?.day3 || !data?.day7) {
                throw new Error("incomplete_sequence");
            }

            setSequence(data);
            await saveFollowUpSequence(lead.id, data);
            incrementAiGenerations();
            posthog.capture("sequence_generated", {
                lead_id: lead.id,
                regenerate: sequence !== null
            });
            toast.success("Sequence generated");
        } catch (err: any) {
            posthog.capture("generation_failed", {
                lead_id: lead.id,
                feature: "no_reply_sequence",
                message: err?.message ?? ""
            });
            toast.error("Generation failed. Try again");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async (text: string, id: string) => {
        try {
            await copyText(text);
        } catch {
            toast.error("Couldn't copy. Select the text and copy it manually");
            return;
        }

        posthog.capture("message_copied", {
            lead_id: lead.id,
            source: "no_reply_sequence",
            step: id
        });
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success("Copied");
    };

    return (
        <div className="space-y-4">
            <p className="text-xs text-base-500">
                No reply yet. Generate follow-ups for day 3 and 7. Day 7
                references this business's specific signals. Day 14 is your
                final message.
            </p>

            <button
                onClick={generate}
                disabled={isLoading}
                className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
                {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : sequence ? (
                    <RefreshCw className="w-3.5 h-3.5" />
                ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                )}
                {sequence ? "Regenerate" : "Generate Sequence"}
            </button>

            {showSequenceBlock && (
                <div className="space-y-3">
                    {blocks.map(block => (
                        <div
                            key={block.id}
                            className={`border border-base-800 rounded-xl p-4 space-y-3 ${
                                block.badge ? "opacity-75" : ""
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-base-400">
                                    {block.title}
                                </p>
                                {block.badge && (
                                    <span className="text-xs text-base-600">
                                        {block.badge}
                                    </span>
                                )}
                            </div>
                            {isLoading ? (
                                <MessageSkeleton />
                            ) : (
                                <>
                                    <p className="text-sm text-base-200 leading-relaxed whitespace-pre-line">
                                        {block.text}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <CopyBtn
                                            text={block.text}
                                            id={block.id}
                                            copiedId={copiedId}
                                            onCopy={handleCopy}
                                        />
                                        <SequenceBtn
                                            text={block.text}
                                            number={number}
                                            step={block.id}
                                            leadId={lead.id}
                                            setLastOutreachStep={
                                                setLastOutreachStep
                                            }
                                            setFollowUpDate={setFollowUpDate}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    {!number && !isLoading && (
                        <p className="text-xs text-base-500 text-center">
                            No WhatsApp-ready number on this lead. Add a mobile
                            number above, or copy and send manually.
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