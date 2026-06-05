import { useState, useEffect, useRef } from "react";
import {
    MessageCircle,
    Loader2,
    Sparkles,
    Copy,
    Check,
    RefreshCw,
    Send,
    Trash2
} from "lucide-react";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import {
    Lead,
    OutreachFlowTab,
    FollowUpSequence,
    ChatMessage
} from "../../types";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { useSettingsStore } from "../../lib/stores/useSettingsStore";
import { painPointsToContext } from "../../utils/painPoints";
import { scoreLead } from "../../utils/leadScore";

import { useUsageStore, FREE_AI_LIMIT } from "../../lib/stores/useUsageStore";

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

function CopyBtn({
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

function WABtn({ text, number }: { text: string; number?: string }) {
    if (!number) return null;
    return (
        <button
            onClick={() => {
                const clean = number.replace(/\D/g, "");
                window.open(
                    `https://wa.me/${clean}?text=${encodeURIComponent(text)}`,
                    "_blank"
                );
            }}
            className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
        >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
        </button>
    );
}

const TONE_MAP: Record<string, string> = {
    casual: "Warm, conversational Standard Nigerian English. NOT Pidgin. Friendly but clear.",
    formal: "Professional and approachable Standard English. NOT Pidgin.",
    pidgin: "Natural Nigerian Pidgin English throughout — every sentence in Pidgin."
};

const TONE_RULES = `- If tone is casual or formal, write in Standard English only — no Pidgin words or phrases
- If tone is pidgin, write entirely in Pidgin
- Never mix tones`;

const DAY14_CASUAL =
    "I'll leave this here for now. Whenever you're ready to revisit it, just reach out and I'll be around.";
const DAY14_PIDGIN =
    "I go leave am here for now. Anytime you wan revisit am, just reach out — I dey.";
const DAY14_FORMAL =
    "I understand you may be occupied. Please do not hesitate to reach out whenever you are ready to explore this further.";

function NoReplyTab({ lead }: { lead: Lead }) {
    const { outreachTone, serviceDescription } = useSettingsStore();
    const { canGenerateAi, incrementAiGenerations, resetIfNewDay } =
        useUsageStore();

    const { saveFollowUpSequence } = useLeadsStore();
    const [sequence, setSequence] = useState<FollowUpSequence | null>(
        lead.followUpSequence ?? null
    );
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const whatsappNumber = lead.whatsappNumber ?? lead.phone;
    const painContext = lead.painPoints
        ? painPointsToContext(lead.painPoints)
        : "No specific signals";
    const day14 =
        outreachTone === "pidgin"
            ? DAY14_PIDGIN
            : outreachTone === "formal"
              ? DAY14_FORMAL
              : DAY14_CASUAL;

    const generate = async () => {
        resetIfNewDay();
        if (!canGenerateAi(0)) {
            toast.error(
                `Daily AI limit reached (${FREE_AI_LIMIT}/day). Resets at midnight.`
            );
            return;
        }
        setIsLoading(true);
        try {
            const raw = await callGemini(
                `You write WhatsApp follow-up messages for freelancers who got no reply.

Tone: ${TONE_MAP[outreachTone]}
Service: ${serviceDescription || "web development"}

Generate 2 follow-up messages:

Day 3: Short check-in. One or two sentences. No pressure. Do not repeat the original pitch. End with a soft question.

Day 7: Reference ONE specific business signal from the data. Make a genuine observation about their business situation. Ask one question that makes the business owner think. No pitch. No "just checking in". Make it feel like you noticed something real about their business.

Rules:
- Each message under 50 words
- Sound like a real person not a bot
- No corporate language
- No fake flattery
- Only reference facts from the data provided
- Never invent information
- Natural question to end each message
${TONE_RULES}

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

    const messages = sequence
        ? [
              {
                  id: "day3",
                  label: "Day 3 — Check in",
                  text: sequence.day3,
                  isStatic: false
              },
              {
                  id: "day7",
                  label: "Day 7 — Add value",
                  text: sequence.day7,
                  isStatic: false
              },
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
                                msg.isStatic
                                    ? "border-base-800 opacity-70"
                                    : "border-base-800"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-base-400">
                                    {msg.label}
                                </p>
                                {msg.isStatic && (
                                    <span className="text-xs text-base-600">
                                        Static
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-base-200 leading-relaxed">
                                {msg.text}
                            </p>
                            <div className="flex items-center gap-2">
                                <CopyBtn
                                    text={msg.text}
                                    id={msg.id}
                                    copiedId={copiedId}
                                    onCopy={handleCopy}
                                />
                                <WABtn
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

const SCENARIOS = [
    { id: "interested", label: "Interested" },
    { id: "asked_price", label: "Asked price" },
    { id: "show_example", label: "Show example" },
    { id: "how_found", label: "How did you find us" },
    { id: "has_website", label: "Already has website" },
    { id: "need_time", label: "Need time to think" },
    { id: "not_now", label: "Not now" },
    { id: "not_interested", label: "Not interested" },
    { id: "autoreply", label: "Auto-reply" }
];

type ScenarioId =
    | "interested"
    | "asked_price"
    | "show_example"
    | "how_found"
    | "has_website"
    | "need_time"
    | "not_now"
    | "not_interested"
    | "autoreply";

function getTemplate(
    scenario: ScenarioId,
    tone: "casual" | "formal" | "pidgin",
    businessName: string,
    portfolioUrl: string = ""
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
        show_example: {
            casual: `Sure. Here is a quick example of the kind of website I build — simple, mobile-friendly, easy for customers to contact you from. Have a look: ${portfolioUrl || "[your portfolio link]"}`,
            formal: `Of course. Here is a brief example of my work — clean, mobile-optimised, designed to make it easy for customers to reach you. Please have a look: ${portfolioUrl || "[your portfolio link]"}`,
            pidgin: `Sure. Here na quick example of the kind of website I dey build — simple, e dey work well on phone. Take a look: ${portfolioUrl || "[your portfolio link]"}`
        },
        how_found: {
            casual: `I was looking through businesses in your area and came across ${b}. I noticed a few things that caught my attention — would you like me to share them?`,
            formal: `I came across ${b} while looking through local businesses in your area and noticed a few things worth mentioning. Would you be open to hearing them?`,
            pidgin: `I dey look through businesses for your area and I see ${b}. I notice some things wey catch my eye — you wan make I share them with you?`
        },
        has_website: {
            casual: `Got it. Out of curiosity, is it doing well for you — are you getting inquiries or bookings through it regularly?`,
            formal: `Understood. May I ask how well the current website is performing for ${b}? Is it generating inquiries or bookings consistently?`,
            pidgin: `I hear you. I just wan ask — the website dey bring customers or inquiries for ${b} regularly?`
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
        not_interested: {
            casual: `No worries at all. Thanks for getting back to me. If anything changes down the line, feel free to reach out. Wishing ${b} all the best.`,
            formal: `Absolutely understood. Thank you for letting me know. Should circumstances change in the future, please do not hesitate to reach out.`,
            pidgin: `No wahala at all. Thanks for replying. If anything change for future, just reach out. I dey wish ${b} all the best.`
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
    const { outreachTone, portfolioUrl } = useSettingsStore();
 
    const [activeScenario, setActiveScenario] =
        useState<ScenarioId>("interested");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const tone = outreachTone as "casual" | "formal" | "pidgin";

    const text = getTemplate(activeScenario, tone, lead.name, portfolioUrl);

    const whatsappNumber = lead.whatsappNumber ?? lead.phone;

    const handleCopy = async (t: string, id: string) => {
        await copyText(t);
        setCopiedId(id);
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
                    <CopyBtn
                        text={text}
                        id={activeScenario}
                        copiedId={copiedId}
                        onCopy={handleCopy}
                    />
                    <WABtn text={text} number={whatsappNumber} />
                </div>
            </div>
        </div>
    );
}

function ChatHelperTab({ lead }: { lead: Lead }) {
    const { outreachTone, serviceDescription } = useSettingsStore();
    
const { canGenerateAi, incrementAiGenerations, resetIfNewDay } = useUsageStore();

    const { saveChatHistory } = useLeadsStore();
    const [input, setInput] = useState("");
    const [history, setHistory] = useState<ChatMessage[]>(
        lead.chatHistory ?? []
    );
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const whatsappNumber = lead.whatsappNumber ?? lead.phone;
    const painContext = lead.painPoints
        ? painPointsToContext(lead.painPoints)
        : "No specific signals";
    const score = scoreLead(lead);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history, isLoading]);

    const handleSend = async () => {
      resetIfNewDay();
    if (!canGenerateAi(0)) {
        toast.error(`Daily AI limit reached. Resets at midnight.`);
        return;
    }
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const newMsg: ChatMessage = {
            role: "prospect",
            text: trimmed,
            timestamp: new Date().toISOString()
        };
        const updatedHistory = [...history, newMsg];
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

Tone: ${TONE_MAP[outreachTone]}
Service: ${serviceDescription || "web development"}

Lead context:
Business: ${lead.name}
Category: ${lead.category}
Has website: ${lead.website ? "yes" : "no"}
Rating: ${lead.rating ?? "unknown"}
Reviews: ${lead.reviews ?? "unknown"}
Business signals: ${painContext}
Opportunity score: ${score}/10

First determine the conversation stage:
EXPLORING — prospect is vague, uncertain or just replied for the first time
ASKING_ABOUT_SERVICE — prospect wants to know what you do or how it works
ASKING_PRICE — prospect is asking about cost or budget
BUYING_INTENT — prospect is clearly interested and moving toward a decision

Then respond accordingly:
If EXPLORING: ask one question to understand their situation better. Do not pitch.
If ASKING_ABOUT_SERVICE: explain simply and clearly what the service does for a business like theirs. Be direct.
If ASKING_PRICE: acknowledge the question, then ask one qualifying question about scope before giving a range.
If BUYING_INTENT: move naturally toward the next concrete step. Suggest a call or send an example.

Rules:
- Suggest ONE reply only
- Under 50 words
- Sound like a real person not a bot
- No corporate language
- No fake flattery
- Never make up facts
- Consider the full conversation history
${TONE_RULES}`,
                `Conversation so far:\n${conversationContext}\n\nSuggest the best reply to the prospect's latest message. Return the message text only, no explanation.`
            );

            const aiMsg: ChatMessage = {
                role: "suggested",
                text: reply.trim(),
                timestamp: new Date().toISOString()
            };
            incrementAiGenerations()
            const finalHistory = [...updatedHistory, aiMsg];
            setHistory(finalHistory);
            await saveChatHistory(lead.id, finalHistory);
        } catch {
            toast.error("Could not generate reply — try again");
            setHistory(updatedHistory);
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

    const handleClear = async () => {
        setHistory([]);
        await saveChatHistory(lead.id, []);
        toast.success("Chat cleared");
    };

    const generateSummary = async () => {
        if (history.length < 4) return;
        const conversationText = history
            .map(
                m => `${m.role === "prospect" ? "Prospect" : "You"}: ${m.text}`
            )
            .join("\n");
        try {
            const raw = await callGemini(
                `Summarise this WhatsApp sales conversation in 4 to 6 bullet points.
Focus on: what the prospect said about their situation, what they asked about, their level of interest, any objections raised, agreed next steps if any.
Return plain bullet points only. No headers. No intro sentence.`,
                conversationText
            );
            await copyText(raw.trim());
            toast.success("Summary copied to clipboard");
        } catch {
            toast.error("Could not generate summary");
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs text-base-500">
                    Paste what the prospect said and get a suggested reply.
                </p>
                <div className="flex items-center gap-3">
                    {history.length >= 4 && (
                        <button
                            onClick={generateSummary}
                            className="text-xs text-base-500 hover:text-base-300 transition-colors"
                        >
                            Copy summary
                        </button>
                    )}
                    {history.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="flex items-center gap-1 text-xs text-base-600 hover:text-red-400 transition-colors"
                        >
                            <Trash2 className="w-3 h-3" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Chat window */}
            <div className="bg-base-950 rounded-xl p-3 space-y-3 min-h-32 max-h-96 overflow-y-auto">
                {history.length === 0 && (
                    <p className="text-xs text-base-600 text-center py-6">
                        Paste their first message below to get started
                    </p>
                )}

                {history.map((msg, idx) => (
                    <div
                        key={idx}
                        className={clsx(
                            "flex",
                            msg.role === "prospect"
                                ? "justify-end"
                                : "justify-start"
                        )}
                    >
                        <div
                            className={clsx(
                                "max-w-xs rounded-2xl px-3 py-2 space-y-1.5",
                                msg.role === "prospect"
                                    ? "bg-brand-500/20 rounded-tr-sm"
                                    : "bg-base-800 rounded-tl-sm"
                            )}
                        >
                            <p
                                className={clsx(
                                    "text-xs leading-relaxed",
                                    msg.role === "prospect"
                                        ? "text-brand-200"
                                        : "text-base-100"
                                )}
                            >
                                {msg.text}
                            </p>

                            {msg.role === "suggested" && (
                                <div className="flex items-center gap-1.5 pt-1 border-t border-base-700">
                                    <button
                                        onClick={() =>
                                            handleCopy(msg.text, idx)
                                        }
                                        className="flex items-center gap-1 text-xs text-base-500 hover:text-base-300 transition-colors"
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
                                    {whatsappNumber && (
                                        <>
                                            <span className="text-base-700">
                                                ·
                                            </span>
                                            <button
                                                onClick={() => {
                                                    const clean =
                                                        whatsappNumber.replace(
                                                            /\D/g,
                                                            ""
                                                        );
                                                    window.open(
                                                        `https://wa.me/${clean}?text=${encodeURIComponent(msg.text)}`,
                                                        "_blank"
                                                    );
                                                }}
                                                className="flex items-center gap-1 text-xs text-green-500 hover:text-green-400 transition-colors"
                                            >
                                                <MessageCircle className="w-3 h-3" />
                                                Send
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-base-800 rounded-2xl rounded-tl-sm px-4 py-3">
                            <div className="flex items-center gap-1">
                                <span
                                    className="w-1.5 h-1.5 bg-base-500 rounded-full animate-bounce"
                                    style={{ animationDelay: "0ms" }}
                                />
                                <span
                                    className="w-1.5 h-1.5 bg-base-500 rounded-full animate-bounce"
                                    style={{ animationDelay: "150ms" }}
                                />
                                <span
                                    className="w-1.5 h-1.5 bg-base-500 rounded-full animate-bounce"
                                    style={{ animationDelay: "300ms" }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-end gap-2">
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Paste what the prospect said..."
                    rows={2}
                    className="flex-1 bg-base-800 border border-base-700 rounded-xl px-4 py-3 text-sm text-base-100 placeholder:text-base-500 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                    onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="p-3 rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors shrink-0"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

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
