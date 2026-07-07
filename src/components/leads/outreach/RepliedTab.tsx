import { useState } from "react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { Lead } from "../../../types";
import { useSettingsStore } from "../../../lib/stores/useSettingsStore";
import { copyText, CopyBtn, WABtn } from "./outreachUtils";

const SCENARIOS = [
    { id: "interested", label: "Interested" },
    { id: "asked_price", label: "Asked price" },
    { id: "show_example", label: "Show example" },
    { id: "how_found", label: "How did you find us" },
    { id: "not_interested", label: "Not interested" },
];

function getTemplate(scenario: string, tone: string, businessName: string, portfolioUrl: string = ""): string {
    // Keep your full getTemplate object logic here...
    return `Placeholder template for ${scenario} in ${tone} for ${businessName}`; 
}

export default function RepliedTab({ lead }: { lead: Lead }) {
    const { outreachTone, portfolioUrl } = useSettingsStore();
    const [activeScenario, setActiveScenario] = useState("interested");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const text = getTemplate(activeScenario, outreachTone, lead.name, portfolioUrl);
    const whatsappNumber = lead.whatsappNumber ?? lead.phone;

    const handleCopy = async (t: string, id: string) => {
        await copyText(t);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success("Copied");
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
                {SCENARIOS.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveScenario(s.id)}
                        className={clsx("text-xs px-3 py-1.5 rounded-lg transition-colors", activeScenario === s.id ? "bg-brand-500/10 text-brand-400" : "bg-base-800 text-base-500 hover:text-base-300")}
                    >
                        {s.label}
                    </button>
                ))}
            </div>
            <div className="border border-base-800 rounded-xl p-4 space-y-3">
                <p className="text-sm text-base-200 leading-relaxed">{text}</p>
                <div className="flex items-center gap-2">
                    <CopyBtn text={text} id={activeScenario} copiedId={copiedId} onCopy={handleCopy} />
                    <WABtn text={text} number={whatsappNumber} />
                </div>
            </div>
        </div>
    );
}
