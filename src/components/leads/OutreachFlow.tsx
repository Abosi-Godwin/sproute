import { useState } from "react";
import {
    MessageCircle,
    Loader2,
    Sparkles,
    Copy,
    Check,
    RefreshCw,
    Send
} from "lucide-react";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import { Lead, OutreachFlowTab, FollowUpSequence } from "../../types";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { useSettingsStore } from "../../lib/stores/useSettingsStore";
import { painPointsToContext } from "../../utils/painPoints";

// ─── Helpers ─────────────────────────────────────────────────────

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

async function callGemini(
    systemText: string,
    userText: string
): Promise<string> {
    const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemText }] },
            contents: [{ parts: [{ text: userText }] }]
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message ?? "Failed");
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

function CopyButton({
    text,
    id,
    copiedId,
    onCopy
}: {
    text: string;
    id: string;
    copiedId: string | null;
    onCopy: (text: string, id: string) => void;
}) {
    return (
        <button
            onClick={() => onCopy(text, id)}
            className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg bg-base-800 text-base-300 hover:text-base-100 hover:bg-base-700 transition-colors"
        >
            {copiedId === id ? (
                <>
                    <Check className="w-3.5 h-3.5 text-brand-400" /> Copied
                </>
            ) : (
                <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                </>
            )}
        </button>
    );
}

function WhatsAppButton({ text, number }: { text: string; number?: string }) {
    if (!number) return null;
    const open = () => {
        const clean = number.replace(/\D/g, "");
        window.open(
            `https://wa.me/${clean}?text=${encodeURIComponent(text)}`,
            "_blank"
        );
    };
    return (
        <button
            onClick={open}
            className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
        >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
        </button>
    );
}

async function copyText(text: string) {
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
}

// ─── No Reply Tab ─────────────────────────────────────────────────

const DAY14_STATIC =
    "I'll leave this here for now. Whenever you're ready to revisit it, just reach out — I'll be around.";
const DAY14_PIDGIN =
    "I go leave am here for now. Anytime you wan revisit am, just reach out — I dey.";

function NoReplyTab({ lead }: { lead: Lead }) {
    const { outreachTone, serviceDescription } = useSettingsStore();
    const { saveFollowUpSequence } = useLeadsStore();

    const [sequence, setSequence] = useState<FollowUpSequence | null>(
        lead.followUpSequence ?? null
    );
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const whatsappNumber = lead.whatsappNumber ?? lead.phone;
    const toneMap: Record<string, string> = {
        casual: "Casual Nigerian English, warm and direct.",
        formal: "Professional but approachable.",
        pidgin: "Natural Nigerian Pidgin English throughout."
    };
    const painContext = lead.painPoints
        ? painPointsToContext(lead.painPoints)
        : "No specific signals";
    const day14 = outreachTone === "pidgin" ? DAY14_PIDGIN : DAY14_STATIC;

    const generate = async () => {
        setIsLoading(true);
        try {
            const raw = await callGemini(
                `You write WhatsApp follow-up messages for freelancers who got no reply.

Tone: ${toneMap[outreachTone]}
Service: ${serviceDescription || "web development"}

Generate 2 follow-up messages:

Day 3: Short check-in. One or two sentences. No pressure. Do not repeat the original pitch. End with a soft question.

Day 7: Reference ONE specific business signal from the data. Make a genuine observation. Ask one question that makes the business owner think. No pitch. No "just checking in". Make it feel like you actually noticed something about their business.

Rules:
- Each message under 50 words
- Sound like a real person
- No corporate language
- No fake flattery
- Only reference facts from the data
- Never invent information

Return ONLY valid JSON:
{
  "day3": "...",
  "day7": "..."
}`,
                `Business: ${lead.name}
Category: ${lead.category}
Has website: ${lead.website ? "yes" : "no"}
Rating: ${lead.rating ?? "unknown"}
Reviews: ${lead.reviews ?? "unknown"}
Business signals: ${painContext}
Notes: ${lead.notes || "none"}`
            );

            const clean = raw.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(clean);
            const seq: FollowUpSequence = {
                day3: parsed.day3,
                day7: parsed.day7
            };
            setSequence(seq);
            await saveFollowUpSequence(lead.id, seq);
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

    const messages = sequence
        ? [
              { id: "day3", label: "Day 3 — Check in", text: sequence.day3 },
              { id: "day7", label: "Day 7 — Add value", text: sequence.day7 },
              {
                  id: "day14",
                  label: "Day 14 — Final message",
                  text: day14,
                  isStatic: true
              }
          ]
        : [];

    return (
        <div className="space-y-4">
            <p className="text-xs text-base-500">
                No reply yet. Generate follow-ups for day 3 and 7. Day 7
                references this business's specific signals. Day 14 is always a
                graceful exit.
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

            {isLoading && (
                <div className="flex items-center gap-2 py-4 justify-center">
                    <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                    <p className="text-xs text-base-500">
                        Generating follow-up sequence...
                    </p>
                </div>
            )}

            {messages.length > 0 && !isLoading && (
                <div className="space-y-3">
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={clsx(
                                "border rounded-xl p-4 space-y-3",
                                "isStatic" in msg && msg.isStatic
                                    ? "border-base-800 opacity-75"
                                    : "border-base-800"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-base-400">
                                    {msg.label}
                                </p>
                                {"isStatic" in msg && msg.isStatic && (
                                    <span className="text-xs text-base-600">
                                        Static
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-base-200 leading-relaxed">
                                {msg.text}
                            </p>
                            <div className="flex items-center gap-2">
                                <CopyButton
                                    text={msg.text}
                                    id={msg.id}
                                    copiedId={copiedId}
                                    onCopy={handleCopy}
                                />
                                <WhatsAppButton
                                    text={msg.text}
                                    number={whatsappNumber}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── They Replied Tab ─────────────────────────────────────────────

const SCENARIOS = [
    { id: "interested", label: "Interested" },
    { id: "asked_price", label: "Asked price" },
    { id: "how_found", label: "How did you find us" },
    { id: "has_website", label: "Already has website" },
    { id: "need_time", label: "Need time to think" },
    { id: "not_now", label: "Not now" },
    { id: "autoreply", label: "Auto-reply" }
];

type ScenarioId =
    | "interested"
    | "asked_price"
    | "how_found"
    | "has_website"
    | "need_time"
    | "not_now"
    | "autoreply";

function getTemplate(
    scenario: ScenarioId,
    tone: "casual" | "formal" | "pidgin",
    businessName: string
): string {
    const b = businessName;

    const templates: Record<
        ScenarioId,
        Record<"casual" | "formal" | "pidgin", string>
    > = {
        interested: {
            casual: `Nice one! Let me send you a quick example so you can see the direction clearly. What works for you — today or tomorrow?`,
            formal: `Thank you for your interest. I would love to share a brief overview of what I have in mind for ${b}. Would today or tomorrow work for a quick look?`,
            pidgin: `Nice one! Make I send you quick example so you fit see the direction well. Today or tomorrow go work for you?`
        },
        asked_price: {
            casual: `Depends on exactly what you need. Once I understand your situation I can give you an accurate number. Can I ask a few quick questions?`,
            formal: `The cost depends on the scope of work. I would like to ask a few questions first to give ${b} the most accurate figure. Would that be alright?`,
            pidgin: `E depend on wetin you need exactly. Once I understand your situation I go fit give you correct price. I fit ask small questions?`
        },
        how_found: {
            casual: `I was searching for ${b} online and noticed a few things worth mentioning. That's what prompted me to reach out. Is this a good time to share what I found?`,
            formal: `I came across ${b} while conducting some research and noticed a few observations I thought might be useful. Would you be open to hearing them?`,
            pidgin: `I dey search for ${b} online and I see some things wey I think fit interest you. Na that one make me reach out. E good time to share wetin I see?`
        },
        has_website: {
            casual: `Got it. Out of curiosity, is it doing well for you — are you getting inquiries or bookings through it?`,
            formal: `Understood. May I ask how well the current website is performing for ${b}? Is it generating inquiries or bookings consistently?`,
            pidgin: `I hear you. I just wan ask — the website dey bring customers or inquiries for ${b}?`
        },
        need_time: {
            casual: `No problem. When would be a good time for me to follow up — next week or the week after?`,
            formal: `Of course, take all the time you need. When would it be convenient for me to check back with you?`,
            pidgin: `No wahala. When go be better time make I check back with you — next week or the one after?`
        },
        not_now: {
            casual: `No problem at all. Whenever the time is right, just reach out and we will continue from there.`,
            formal: `Absolutely understood. Please feel free to reach out whenever you are ready and we can take it from there.`,
            pidgin: `No wahala at all. Anytime the time don reach, just message me make we continue from there.`
        },
        autoreply: {
            casual: `Thanks. Whenever a real person from ${b} sees this, I would love to share a quick idea. No rush at all.`,
            formal: `Thank you for the response. Whenever a member of the ${b} team is available, I would be happy to share a brief idea. No urgency.`,
            pidgin: `Thanks. Anytime real person from ${b} see this message, I go love share quick idea. No rush at all.`
        }
    };

    return templates[scenario][tone];
}

function RepliedTab({ lead }: { lead: Lead }) {
    const { outreachTone } = useSettingsStore();
    const [activeScenario, setActiveScenario] =
        useState<ScenarioId>("interested");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const tone = outreachTone as "casual" | "formal" | "pidgin";
    const text = getTemplate(activeScenario, tone, lead.name);
    const whatsappNumber = lead.whatsappNumber ?? lead.phone;

    const handleCopy = async () => {
        await copyText(text);
        setCopiedId(activeScenario);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success("Copied");
    };

    return (
        <div className="space-y-4">
            <p className="text-xs text-base-500">
                Select what happened and copy the right response.
            </p>

            <div className="flex items-center gap-2 flex-wrap">
                {SCENARIOS.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveScenario(s.id as ScenarioId)}
                        className={clsx(
                            "text-xs px-3 py-1.5 rounded-lg transition-colors",
                            activeScenario === s.id
                                ? "bg-brand-500/10 text-brand-400"
                                : "bg-base-800 text-base-500 hover:text-base-300"
                        )}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <div className="border border-base-800 rounded-xl p-4 space-y-3">
                <p className="text-sm text-base-200 leading-relaxed">{text}</p>
                <div className="flex items-center gap-2">
                    <CopyButton
                        text={text}
                        id={activeScenario}
                        copiedId={copiedId}
                        onCopy={handleCopy}
                    />
                    <WhatsAppButton text={text} number={whatsappNumber} />
                </div>
            </div>
        </div>
    );
}

// ─── Chat Helper Tab ──────────────────────────────────────────────

interface ChatMessage {
    role: "prospect" | "suggested";
    text: string;
}

function ChatHelperTab({ lead }: { lead: Lead }) {
    const { outreachTone, serviceDescription } = useSettingsStore();
    const [input, setInput] = useState("");
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

    const whatsappNumber = lead.whatsappNumber ?? lead.phone;
    const painContext = lead.painPoints
        ? painPointsToContext(lead.painPoints)
        : "No specific signals";

    const toneMap: Record<string, string> = {
        casual: "Casual Nigerian English, warm and direct.",
        formal: "Professional but approachable.",
        pidgin: "Natural Nigerian Pidgin English throughout."
    };

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const newMessage: ChatMessage = { role: "prospect", text: trimmed };
        const updatedHistory = [...history, newMessage];
        setHistory(updatedHistory);
        setInput("");
        setIsLoading(true);

        try {
            const conversationContext = updatedHistory
                .map(
                    m =>
                        `${m.role === "prospect" ? "Prospect" : "You (suggested)"}: ${m.text}`
                )
                .join("\n");

            const reply = await callGemini(
                `You are a sales conversation coach helping a freelancer respond to a prospect on WhatsApp.

Tone: ${toneMap[outreachTone]}
Service: ${serviceDescription || "web development"}

Lead context:
Business: ${lead.name}
Category: ${lead.category}
Has website: ${lead.website ? "yes" : "no"}
Rating: ${lead.rating ?? "unknown"}
Reviews: ${lead.reviews ?? "unknown"}
Business signals: ${painContext}

Rules:
- Suggest ONE reply only
- Under 50 words
- Sound like a real person not a bot
- No corporate language
- Move the conversation toward understanding their situation
- Ask one question if appropriate
- Never pitch directly
- Never make up facts
- Consider the full conversation history when suggesting`,
                `Conversation so far:
${conversationContext}

Suggest the best reply to the prospect's latest message.`
            );

            setHistory(prev => [
                ...prev,
                { role: "suggested", text: reply.trim() }
            ]);
        } catch {
            toast.error("Could not generate reply — try again");
            setHistory(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async (text: string, idx: number) => {
        await copyText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
        toast.success("Copied");
    };

    return (
        <div className="space-y-4">
            <p className="text-xs text-base-500">
                Paste what the prospect said and get a suggested reply based on
                this lead's context and your service.
            </p>

            {/* Conversation history */}
            {history.length > 0 && (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {history.map((msg, idx) => (
                        <div
                            key={idx}
                            className={clsx(
                                "rounded-xl p-3 space-y-2",
                                msg.role === "prospect"
                                    ? "bg-base-800 border border-base-700"
                                    : "bg-brand-500/5 border border-brand-500/20"
                            )}
                        >
                            <p className="text-xs font-semibold text-base-500">
                                {msg.role === "prospect"
                                    ? "Prospect said"
                                    : "Suggested reply"}
                            </p>
                            <p className="text-sm text-base-200 leading-relaxed">
                                {msg.text}
                            </p>
                            {msg.role === "suggested" && (
                                <div className="flex items-center gap-2">
                                    <CopyButton
                                        text={msg.text}
                                        id={String(idx)}
                                        copiedId={
                                            copiedIdx !== null
                                                ? String(copiedIdx)
                                                : null
                                        }
                                        onCopy={text => handleCopy(text, idx)}
                                    />
                                    <WhatsAppButton
                                        text={msg.text}
                                        number={whatsappNumber}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-2 py-2">
                            <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                            <p className="text-xs text-base-500">
                                Thinking of a reply...
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Input */}
            <div className="space-y-2">
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Paste what the prospect said..."
                    rows={3}
                    className="w-full bg-base-800 border border-base-700 rounded-lg px-4 py-3 text-sm text-base-100 placeholder:text-base-500 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                    onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setHistory([])}
                        className="text-xs text-base-600 hover:text-base-400 transition-colors"
                    >
                        Clear history
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Send className="w-3.5 h-3.5" />
                        )}
                        Suggest Reply
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────

export default function OutreachFlow({ lead }: { lead: Lead }) {
    const { setOutreachFlowTab } = useLeadsStore();
    const [expanded, setExpanded] = useState(false);

    const activeTab: OutreachFlowTab = lead.outreachFlowTab ?? "no_reply";

    const handleTabChange = async (tab: OutreachFlowTab) => {
        await setOutreachFlowTab(lead.id, tab);
    };

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-4">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between"
            >
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-brand-400" />
                    <h3 className="font-display font-semibold text-base-100">
                        Outreach Flow
                    </h3>
                    {activeTab !== "no_reply" && (
                        <span className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                            {activeTab === "replied"
                                ? "They Replied"
                                : "Chat Helper"}
                        </span>
                    )}
                </div>
                <span className="text-xs text-base-500">
                    {expanded ? "Hide" : "Show"}
                </span>
            </button>

            {expanded && (
                <div className="space-y-4">
                    {/* Tab switcher */}
                    <div className="flex items-center gap-1 p-1 bg-base-800 rounded-xl">
                        {[
                            { id: "no_reply", label: "No Reply" },
                            { id: "replied", label: "Replied" },
                            { id: "chatHelper", label: "Chat Helper" }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() =>
                                    handleTabChange(tab.id as OutreachFlowTab)
                                }
                                className={clsx(
                                    "flex-1 text-xs font-medium py-2 rounded-lg transition-colors",
                                    activeTab === tab.id
                                        ? "bg-base-700 text-base-100"
                                        : "text-base-500 hover:text-base-300"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    {activeTab === "no_reply" && <NoReplyTab lead={lead} />}
                    {activeTab === "replied" && <RepliedTab lead={lead} />}
                    {activeTab === "chatHelper" && (
                        <ChatHelperTab lead={lead} />
                    )}
                </div>
            )}
        </div>
    );
}
