import { useState } from "react";
import { Loader2, Sparkles, RefreshCw, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Lead, FollowUpSequence, OutreachStep } from "../../../types";
import { useLeadsStore } from "../../../lib/stores/useLeadsStore";
import { useSettingsStore } from "../../../lib/stores/useSettingsStore";
import { painPointsToContext } from "../../../utils/painPoints";
import { useUsageStore } from "../../../lib/stores/useUsageStore";
import { useSubscriptionStore } from "../../../lib/stores/useSubscriptionStore";
import UpgradeModal from "../../ui/UpgradeModal";
import { copyText, CopyBtn } from "./outreachUtils";

function getDay14(tone: string, businessName: string): string {
    if (tone === "pidgin") {
        return `E go be my last message so I no go dey disturb your inbox.\n\nIf you ever wan explore wetin website fit do for ${businessName}, just reply this message — I go dey here.\n\nAll the best.`;
    }
    if (tone === "formal") {
        return `This will be my final follow-up as I do not want to take up too much of your time.\n\nShould you ever wish to explore what a website could do for ${businessName}, please do not hesitate to reach out — I will be happy to continue from where we left off.`;
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
    number?: string;
    step: OutreachStep;
    leadId: string;
    setLastOutreachStep: (id: string, step: OutreachStep) => Promise<void>;
    setFollowUpDate: (id: string, date: string) => Promise<void>;
}) {
    if (!number) return null;

    const handleClick = () => {
        const clean = number.replace(/\D/g, "");
        window.open(
            `https://wa.me/${clean}?text=${encodeURIComponent(text)}`,
            "_blank"
        );
        setLastOutreachStep(leadId, step);
        if (step === "day3") setFollowUpDate(leadId, addDays(2));
        if (step === "day7") setFollowUpDate(leadId, addDays(2));
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
    const whatsappNumber = lead.whatsappNumber ?? lead.phone;
    const painContext = lead.painPoints
        ? painPointsToContext(lead.painPoints)
        : "No specific signals";
    const day14 = getDay14(outreachTone, lead.name);
    const showSequenceBlock = isLoading || sequence !== null;

    const generate = async () => {
        resetIfNewDay();
        if (!canGenerateAi(pro)) {
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
            if (!res.ok) throw new Error(data.error || "Failed to generate");

            setSequence(data);
            await saveFollowUpSequence(lead.id, data);
            incrementAiGenerations();
            toast.success("Sequence generated");
        } catch {
            toast.error("Generation failed — try again");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async (text: string, id: string) => {
        await copyText(text);
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
                    <div className="border border-base-800 rounded-xl p-4 space-y-3">
                        <p className="text-xs font-semibold text-base-400">
                            Day 3 — Check in
                        </p>
                        {isLoading ? (
                            <MessageSkeleton />
                        ) : (
                            <>
                                <p className="text-sm text-base-200 leading-relaxed whitespace-pre-line">
                                    {sequence?.day3}
                                </p>
                                <div className="flex items-center gap-2">
                                    <CopyBtn
                                        text={sequence!.day3}
                                        id="day3"
                                        copiedId={copiedId}
                                        onCopy={handleCopy}
                                    />
                                    <SequenceBtn
                                        text={sequence!.day3}
                                        number={whatsappNumber}
                                        step="day3"
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

                    <div className="border border-base-800 rounded-xl p-4 space-y-3">
                        <p className="text-xs font-semibold text-base-400">
                            Day 7 — Add value
                        </p>
                        {isLoading ? (
                            <MessageSkeleton />
                        ) : (
                            <>
                                <p className="text-sm text-base-200 leading-relaxed whitespace-pre-line">
                                    {sequence?.day7}
                                </p>
                                <div className="flex items-center gap-2">
                                    <CopyBtn
                                        text={sequence!.day7}
                                        id="day7"
                                        copiedId={copiedId}
                                        onCopy={handleCopy}
                                    />
                                    <SequenceBtn
                                        text={sequence!.day7}
                                        number={whatsappNumber}
                                        step="day7"
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

                    <div className="border border-base-800 rounded-xl p-4 space-y-3 opacity-75">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-base-400">
                                Day 14 — Final message
                            </p>
                            <span className="text-xs text-base-600">
                                Static
                            </span>
                        </div>
                        {isLoading ? (
                            <MessageSkeleton />
                        ) : (
                            <>
                                <p className="text-sm text-base-200 leading-relaxed whitespace-pre-line">
                                    {day14}
                                </p>
                                <div className="flex items-center gap-2">
                                    <CopyBtn
                                        text={day14}
                                        id="day14"
                                        copiedId={copiedId}
                                        onCopy={handleCopy}
                                    />
                                    <SequenceBtn
                                        text={day14}
                                        number={whatsappNumber}
                                        step="day14"
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
                </div>
            )}

            {showUpgrade && (
                <UpgradeModal onClose={() => setShowUpgrade(false)} />
            )}
        </div>
    );
}
