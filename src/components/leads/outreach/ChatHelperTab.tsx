import { useState, useEffect, useRef } from "react";
import {
    Check,
    Copy,
    Loader2,
    MessageCircle,
    Send,
    Trash2
} from "lucide-react";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import { Lead, ChatMessage } from "../../../types";
import { useLeadsStore } from "../../../lib/stores/useLeadsStore";
import { useSettingsStore } from "../../../lib/stores/useSettingsStore";
import { useUsageStore } from "../../../lib/stores/useUsageStore";
import { useSubscriptionStore } from "../../../lib/stores/useSubscriptionStore";
import { posthog } from "../../../lib/posthog";
import { openWhatsApp, pickWhatsAppNumber } from "../../../utils/phone";
import UpgradeModal from "../../ui/UpgradeModal";
import { copyText } from "./outreachUtils";

export default function ChatHelperTab({ lead }: { lead: Lead }) {
    const { outreachTone, serviceDescription } = useSettingsStore();
    const { canGenerateAi, incrementAiGenerations, resetIfNewDay } =
        useUsageStore();
    const { isPro } = useSubscriptionStore();
    const { saveChatHistory } = useLeadsStore();

    const [input, setInput] = useState("");
    const [history, setHistory] = useState<ChatMessage[]>(
        lead.chatHistory ?? []
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const pro = isPro();
    const number = pickWhatsAppNumber(lead);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [history, isLoading]);

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        resetIfNewDay();
        if (!canGenerateAi(pro)) {
            posthog.capture("upgrade_modal_shown", {
                source: "chat_helper",
                lead_id: lead.id
            });
            setShowUpgrade(true);
            return;
        }

        const previous = history;
        const updatedHistory: ChatMessage[] = [
            ...history,
            {
                role: "prospect" as const,
                text: trimmed,
                timestamp: new Date().toISOString()
            }
        ];
        setHistory(updatedHistory);
        setInput("");
        setIsLoading(true);

        try {
            const conversationContext = updatedHistory
                .map(m => `${m.role}: ${m.text}`)
                .join("\n");

            const res = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    scenario: "chat_helper_reply",
                    tone: outreachTone,
                    service: serviceDescription,
                    leadData: `Context: Business is ${lead.name}.\n\nChat History:\n${conversationContext}`
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `status_${res.status}`);

            const reply = typeof data.text === "string" ? data.text.trim() : "";
            if (!reply) throw new Error("empty_reply");

            const finalHistory: ChatMessage[] = [
                ...updatedHistory,
                {
                    role: "suggested" as const,
                    text: reply,
                    timestamp: new Date().toISOString()
                }
            ];
            setHistory(finalHistory);
            await saveChatHistory(lead.id, finalHistory);
            incrementAiGenerations();
            posthog.capture("chat_reply_generated", {
                lead_id: lead.id,
                turns: finalHistory.length
            });
        } catch (err: any) {
            posthog.capture("generation_failed", {
                lead_id: lead.id,
                feature: "chat_helper",
                message: err?.message ?? ""
            });
            toast.error("Could not generate reply. Try again");
            setHistory(previous);
            setInput(trimmed);
        } finally {
            setIsLoading(false);
        }
    };

    const generateSummary = async () => {
        if (history.length < 4 || isSummarizing) return;
        setIsSummarizing(true);

        try {
            const conversationContext = history
                .map(m => `${m.role}: ${m.text}`)
                .join("\n");

            const res = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    scenario: "chat_helper_summary",
                    leadData: conversationContext
                })
            });

            const data = await res.json();
            if (!res.ok || typeof data.text !== "string") {
                throw new Error(data?.error || "summary_failed");
            }

            await copyText(data.text.trim());
            toast.success("Summary copied");
        } catch {
            toast.error("Could not generate summary");
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleClear = () => {
        setHistory([]);
        saveChatHistory(lead.id, []);
        posthog.capture("chat_cleared", { lead_id: lead.id });
    };

    const handleCopy = async (text: string, idx: number) => {
        try {
            await copyText(text);
        } catch {
            toast.error("Couldn't copy. Select the text and copy it manually");
            return;
        }

        posthog.capture("message_copied", {
            lead_id: lead.id,
            source: "chat_helper"
        });
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
        toast.success("Copied");
    };

    const handleWhatsApp = (text: string) => {
        if (!number) return;
        posthog.capture("message_sent", {
            lead_id: lead.id,
            channel: "whatsapp",
            source: "chat_helper"
        });
        openWhatsApp(number, text);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs text-base-500">
                    Paste what they said and get a reply.
                </p>
                <div className="flex items-center gap-3">
                    {history.length >= 4 && (
                        <button
                            onClick={generateSummary}
                            disabled={isSummarizing}
                            className="text-xs text-base-500 hover:text-base-300 disabled:opacity-50"
                        >
                            {isSummarizing ? "Summarizing..." : "Copy summary"}
                        </button>
                    )}
                    {history.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="flex items-center gap-1 text-xs text-base-600 hover:text-red-400"
                        >
                            <Trash2 className="w-3 h-3" /> Clear
                        </button>
                    )}
                </div>
            </div>

            <div
                ref={scrollRef}
                className="bg-base-950 rounded-xl p-3 space-y-3 min-h-32 max-h-96 overflow-y-auto"
            >
                {history.map((msg, idx) => {
                    const isProspect = msg.role === "prospect";
                    return (
                        <div
                            key={idx}
                            className={clsx(
                                "flex",
                                isProspect ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={clsx(
                                    "max-w-xs rounded-2xl px-3 py-2 space-y-2",
                                    isProspect
                                        ? "bg-brand-500/20 rounded-tr-sm"
                                        : "bg-base-800 rounded-tl-sm"
                                )}
                            >
                                <p
                                    className={clsx(
                                        "text-xs leading-relaxed whitespace-pre-wrap",
                                        isProspect
                                            ? "text-brand-200"
                                            : "text-base-100"
                                    )}
                                >
                                    {msg.text}
                                </p>
                                {!isProspect && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                handleCopy(msg.text, idx)
                                            }
                                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-base-700 text-base-200 hover:text-base-50 transition-colors"
                                        >
                                            {copiedIdx === idx ? (
                                                <>
                                                    <Check className="w-3 h-3 text-brand-400" />{" "}
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3 h-3" />{" "}
                                                    Copy
                                                </>
                                            )}
                                        </button>
                                        {number && (
                                            <button
                                                onClick={() =>
                                                    handleWhatsApp(msg.text)
                                                }
                                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                            >
                                                <MessageCircle className="w-3 h-3" />{" "}
                                                WhatsApp
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-base-800 rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-2">
                            <Loader2 className="w-3 h-3 text-brand-400 animate-spin" />
                            <p className="text-xs text-base-500">
                                Writing a reply...
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-end gap-2">
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Paste message..."
                    rows={2}
                    className="flex-1 bg-base-800 border border-base-700 rounded-xl px-4 py-3 text-sm text-base-100 focus:outline-none focus:border-brand-500 resize-none"
                    onKeyDown={e => {
                        if (
                            e.key === "Enter" &&
                            !e.shiftKey &&
                            window.matchMedia("(pointer: fine)").matches
                        ) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="p-3 rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>

            {showUpgrade && (
                <UpgradeModal onClose={() => setShowUpgrade(false)} />
            )}
        </div>
    );
}