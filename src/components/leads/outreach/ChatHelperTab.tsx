import { useState, useEffect, useRef } from "react";
import { MessageCircle, Check, Copy, Send, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import { Lead, ChatMessage } from "../../../types";
import { useLeadsStore } from "../../../lib/stores/useLeadsStore";
import { useSettingsStore } from "../../../lib/stores/useSettingsStore";
import { useUsageStore } from "../../../lib/stores/useUsageStore";
import { useSubscriptionStore } from "../../../lib/stores/useSubscriptionStore";
import UpgradeModal from "../../ui/UpgradeModal";
import { copyText } from "./outreachUtils";

export default function ChatHelperTab({ lead }: { lead: Lead }) {
    const { outreachTone, serviceDescription } = useSettingsStore();
    const { canGenerateAi, incrementAiGenerations, resetIfNewDay } = useUsageStore();
    const { isPro } = useSubscriptionStore();
    const { saveChatHistory } = useLeadsStore();
    
    const [input, setInput] = useState("");
    const [history, setHistory] = useState<ChatMessage[]>(lead.chatHistory ?? []);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const pro = isPro();
    const whatsappNumber = lead.whatsappNumber ?? lead.phone;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history, isLoading]);

    const handleSend = async () => {
        resetIfNewDay();
        if (!canGenerateAi(pro)) {
            setShowUpgrade(true);
            return;
        }

        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const updatedHistory = [...history, { role: "prospect" as const, text: trimmed, timestamp: new Date().toISOString() }];
        setHistory(updatedHistory);
        setInput("");
        setIsLoading(true);

        try {
            const conversationContext = updatedHistory.map(m => `${m.role}: ${m.text}`).join("\n");

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
            if (!res.ok) throw new Error(data.error);

            const finalHistory = [...updatedHistory, { role: "suggested" as const, text: data.text.trim(), timestamp: new Date().toISOString() }];
            setHistory(finalHistory);
            await saveChatHistory(lead.id, finalHistory);
            incrementAiGenerations();
        } catch {
            toast.error("Could not generate reply");
            setHistory(updatedHistory);
        } finally {
            setIsLoading(false);
        }
    };

    const generateSummary = async () => {
        if (history.length < 4) return;
        try {
            const conversationContext = history.map(m => `${m.role}: ${m.text}`).join("\n");
            const res = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    scenario: "chat_helper_summary",
                    leadData: conversationContext
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error();
            
            await copyText(data.text.trim());
            toast.success("Summary copied");
        } catch {
            toast.error("Could not generate summary");
        }
    };

    return (
        <div className="space-y-3">
             <div className="flex items-center justify-between">
                <p className="text-xs text-base-500">Paste what they said and get a reply.</p>
                <div className="flex items-center gap-3">
                    {history.length >= 4 && <button onClick={generateSummary} className="text-xs text-base-500 hover:text-base-300">Copy summary</button>}
                    {history.length > 0 && <button onClick={() => setHistory([])} className="flex items-center gap-1 text-xs text-base-600 hover:text-red-400"><Trash2 className="w-3 h-3" /> Clear</button>}
                </div>
            </div>

            <div className="bg-base-950 rounded-xl p-3 space-y-3 min-h-32 max-h-96 overflow-y-auto">
                {history.map((msg, idx) => (
                    <div key={idx} className={clsx("flex", msg.role === "prospect" ? "justify-end" : "justify-start")}>
                        <div className={clsx("max-w-xs rounded-2xl px-3 py-2 space-y-1.5", msg.role === "prospect" ? "bg-brand-500/20 rounded-tr-sm" : "bg-base-800 rounded-tl-sm")}>
                            <p className={clsx("text-xs leading-relaxed", msg.role === "prospect" ? "text-brand-200" : "text-base-100")}>{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            <div className="flex items-end gap-2">
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Paste message..."
                    rows={2}
                    className="flex-1 bg-base-800 border border-base-700 rounded-xl px-4 py-3 text-sm text-base-100 focus:outline-none focus:border-brand-500 resize-none"
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />
                <button onClick={handleSend} disabled={!input.trim() || isLoading} className="p-3 rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50">
                    <Send className="w-4 h-4" />
                </button>
            </div>
            {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
        </div>
    );
}
