import { useState } from "react";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { Lead, FollowUpSequence } from "../../../types";
import { useLeadsStore } from "../../../lib/stores/useLeadsStore";
import { useSettingsStore } from "../../../lib/stores/useSettingsStore";
import { painPointsToContext } from "../../../utils/painPoints";
import { useUsageStore } from "../../../lib/stores/useUsageStore";
import { useSubscriptionStore } from "../../../lib/stores/useSubscriptionStore";
import UpgradeModal from "../../ui/UpgradeModal";
import { copyText, CopyBtn, SequenceWABtn } from "./outreachUtils";

const TONE_MAP: Record<string, string> = {
    casual: "Warm, conversational Standard Nigerian English. NOT Pidgin. Friendly but clear.",
    formal: "Professional and approachable Standard English. NOT Pidgin.",
    pidgin: "Natural Nigerian Pidgin English throughout — every sentence in Pidgin."
};

const DAY14_CASUAL = "I'll leave this here for now. Whenever you're ready to revisit it, just reach out and I'll be around.";
const DAY14_PIDGIN = "I go leave am here for now. Anytime you wan revisit am, just reach out — I dey.";
const DAY14_FORMAL = "I understand you may be occupied. Please do not hesitate to reach out whenever you are ready to explore this further.";

export default function NoReplyTab({ lead }: { lead: Lead }) {
    const { outreachTone, serviceDescription } = useSettingsStore();
    const { canGenerateAi, incrementAiGenerations, resetIfNewDay } = useUsageStore();
    const { isPro } = useSubscriptionStore();
    const { saveFollowUpSequence, setLastOutreachStep } = useLeadsStore();
    
    const [sequence, setSequence] = useState<FollowUpSequence | null>(() => lead.followUpSequence || null);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showUpgrade, setShowUpgrade] = useState(false);

    const pro = isPro();
    const whatsappNumber = lead.whatsappNumber ?? lead.phone;
    const painContext = lead.painPoints ? painPointsToContext(lead.painPoints) : "No specific signals";
    const day14 = outreachTone === "pidgin" ? DAY14_PIDGIN : outreachTone === "formal" ? DAY14_FORMAL : DAY14_CASUAL;

    const generate = async () => {
        resetIfNewDay();
        if (!canGenerateAi(pro)) {
            setShowUpgrade(true);
            return;
        }

        setIsLoading(true);
        try {
            const leadContext = `
                Business: ${lead.name}
                Category: ${lead.category}
                Has website: ${lead.website ? "yes" : "no"}
                Business signals: ${painContext}
                Notes: ${lead.notes || "none"}
            `;

            const res = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    scenario: "no_reply_sequence",
                    tone: TONE_MAP[outreachTone],
                    service: serviceDescription || "web development",
                    leadData: leadContext
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate");

            setSequence(data);
            await saveFollowUpSequence(lead.id, data);
            incrementAiGenerations();
            toast.success("Sequence generated");
        } catch (error) {
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
            <button onClick={generate} disabled={isLoading} className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors">
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : sequence ? <RefreshCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                {sequence ? "Regenerate" : "Generate Sequence"}
            </button>

            {(isLoading || sequence) && (
                <div className="space-y-3">
                    <div className="border border-base-800 rounded-xl p-4 space-y-3">
                        <p className="text-xs font-semibold text-base-400">Day 3 — Check in</p>
                        {isLoading ? <div className="h-4 bg-base-800 animate-pulse rounded" /> : (
                            <>
                                <p className="text-sm text-base-200 leading-relaxed">{sequence?.day3}</p>
                                <div className="flex items-center gap-2">
                                    <CopyBtn text={sequence!.day3} id="day3" copiedId={copiedId} onCopy={handleCopy} />
                                    <SequenceWABtn text={sequence!.day3} number={whatsappNumber} step="day3" leadId={lead.id} setLastOutreachStep={setLastOutreachStep} />
                                </div>
                            </>
                        )}
                    </div>
                    <div className="border border-base-800 rounded-xl p-4 space-y-3">
                        <p className="text-xs font-semibold text-base-400">Day 7 — Add value</p>
                        {isLoading ? <div className="h-4 bg-base-800 animate-pulse rounded" /> : (
                            <>
                                <p className="text-sm text-base-200 leading-relaxed">{sequence?.day7}</p>
                                <div className="flex items-center gap-2">
                                    <CopyBtn text={sequence!.day7} id="day7" copiedId={copiedId} onCopy={handleCopy} />
                                    <SequenceWABtn text={sequence!.day7} number={whatsappNumber} step="day7" leadId={lead.id} setLastOutreachStep={setLastOutreachStep} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
        </div>
    );
}
