import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { clsx } from "clsx";
import { Lead, OutreachFlowTab } from "../../../types";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";

import NoReplyTab from "./outreach/NoReplyTab";
import RepliedTab from "./outreach/RepliedTab";
import ChatHelperTab from "./outreach/ChatHelperTab";

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
