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
    { id: "has_website", label: "Has website" },
    { id: "need_time", label: "Need time" },
    { id: "not_now", label: "Not now" },
    { id: "not_interested", label: "Not interested" },
    { id: "autoreply", label: "Auto reply" },
];

function getTemplate(scenario: string, tone: string, businessName: string, portfolioUrl: string = ""): string {
    const templates: Record<string, Record<string, string>> = {
        interested: {
            casual: `Great, thanks for getting back to me. To give ${businessName} something that actually fits, can I ask what you'd want customers to be able to do on the site, just check you out, message you directly, or book/order online?`,
            formal: `Thank you for your response. To tailor a solution for ${businessName}, could you share what you'd like customers to be able to do on the website, for example view your services, contact you directly, or place orders online?`,
            pidgin: `Ehen, thank you for the reply. Make I sabi wetin you want make customers do for the site, na just to see una work, message una direct, or order/book something?`,
        },
        asked_price: {
            casual: `Fair question. Pricing depends on what ${businessName} needs, a simple one-page site is different from something with booking or a product catalog. If you tell me roughly what you want on it, I can give you a proper number, no wahala.`,
            formal: `That's a fair question. Pricing varies depending on scope, a simple one-page site differs from one with booking or catalog features. If you could share what you'd like included, I'll provide an accurate quote.`,
            pidgin: `Good question. Price go depend on wetin you want, simple one page dey different from one wey get booking or product catalog. If you fit tell me small wetin you dey plan, I go give you correct price.`,
        },
        show_example: {
            casual: `Sure, here's a sample of my work so you can see the kind of quality I deliver: ${portfolioUrl}. Let me know what you think and we can talk about ${businessName}'s own.`,
            formal: `Certainly, here is a sample of previous work for your review: ${portfolioUrl}. Please let me know your thoughts, and we can discuss what would work best for ${businessName}.`,
            pidgin: `No wahala, see one example of my work make you sabi the kind quality wey I dey deliver: ${portfolioUrl}. Check am, make we yarn about ${businessName} own after.`,
        },
        how_found: {
            casual: `I came across ${businessName} while searching around your area and noticed you didn't have a website yet, just wanted to reach out directly in case it's something you're considering.`,
            formal: `I came across ${businessName} while researching businesses in your area and noticed there wasn't a website listed. I wanted to reach out directly in case this is something you're considering.`,
            pidgin: `I see ${businessName} while I dey find business for una area, I notice say una no get website, na why I decide to reach una direct.`,
        },
        has_website: {
            casual: `Ah, noted. If it's already handling everything you need, no pressure at all. If there's ever anything you'd want improved, faster loading, mobile friendly, better design, feel free to reach out.`,
            formal: `Understood, thank you for letting me know. If your current website is meeting your needs, no further action is required. Should you ever wish to enhance it, for speed, mobile responsiveness, or design, I'd be happy to help.`,
            pidgin: `Ok no wahala. If the website dey do wetin you need am for, no pressure. But if you ever want make anybody improve am, make e load fast or better design, you fit holla.`,
        },
        need_time: {
            casual: `No rush at all, take your time. I'll check back in a few days, but feel free to message me first whenever you're ready.`,
            formal: `Of course, please take whatever time you need. I'll follow up in a few days, but do reach out sooner if you'd like to proceed.`,
            pidgin: `No wahala, take your time. I go check back in few days, but you fit message me first anytime you ready.`,
        },
        not_now: {
            casual: `All good, I understand. I'll leave the door open, if things change down the line just holla and we can pick it up from there.`,
            formal: `Understood, thank you for the update. I'll leave this open on my end, please feel free to reach out whenever the timing works better for you.`,
            pidgin: `E dey ok, I understand. Door still open, if things change later, just holla make we continue from there.`,
        },
        not_interested: {
            casual: `No problem at all, thanks for letting me know. Wishing ${businessName} all the best, and if anything changes in the future, I'm just a message away.`,
            formal: `Not a problem, thank you for the response. I wish ${businessName} continued success, and I remain available should your needs change in the future.`,
            pidgin: `No wahala, thanks for the reply. I wish ${businessName} all the best, if anything change, I dey here.`,
        },
        autoreply: {
            casual: `Looks like this went to an auto-reply, I'll try reaching ${businessName} again shortly to speak with someone directly.`,
            formal: `This appears to be an automated response. I will attempt to contact ${businessName} again shortly to reach someone directly.`,
            pidgin: `I think na auto message be dis, I go try reach ${businessName} again small time make I fit talk to person direct.`,
        },
    };

    return templates[scenario]?.[tone] ?? templates.interested.casual;
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