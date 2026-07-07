import { Check, Copy, MessageCircle } from "lucide-react";
import { OutreachStep } from "../../../types";

export async function copyText(text: string) {
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

export function CopyBtn({ text, id, copiedId, onCopy }: { text: string; id: string; copiedId: string | null; onCopy: (text: string, id: string) => void; }) {
    return (
        <button
            onClick={() => onCopy(text, id)}
            className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg bg-base-800 text-base-300 hover:text-base-100 hover:bg-base-700 transition-colors"
        >
            {copiedId === id ? (
                <><Check className="w-3.5 h-3.5 text-brand-400" /> Copied</>
            ) : (
                <><Copy className="w-3.5 h-3.5" /> Copy</>
            )}
        </button>
    );
}

export function WABtn({ text, number }: { text: string; number?: string }) {
    if (!number) return null;
    return (
        <button
            onClick={() => {
                const clean = number.replace(/\D/g, "");
                window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`, "_blank");
            }}
            className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
        >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
        </button>
    );
}

export function SequenceWABtn({ text, number, step, leadId, setLastOutreachStep }: { text: string; number?: string; step: OutreachStep; leadId: string; setLastOutreachStep: (id: string, step: OutreachStep) => void; }) {
    if (!number) return null;
    return (
        <button
            onClick={() => {
                const clean = number.replace(/\D/g, "");
                window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`, "_blank");
                setLastOutreachStep(leadId, step);
            }}
            className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
        >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
        </button>
    );
}
