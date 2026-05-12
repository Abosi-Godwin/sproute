import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useLeadsStore } from "../lib/stores/useLeadsStore";
import LeadInfo from "../components/leads/LeadInfo";
import LeadNotes from "../components/leads/LeadNotes";
import LeadActivity from "../components/leads/LeadActivity";
import MessageGenerator from "../components/leads/MessageGenerator";
import ReplyTemplates from "../components/leads/ReplyTemplates";
import { useSettingsStore } from "../lib/stores/useSettingsStore";

export default function LeadDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { leads } = useLeadsStore();

    const { outreachTone } = useSettingsStore();
    const lead = leads.find(l => l.id === id);

    const showTemplates = ["messaged", "replied", "converted"].includes(
        lead?.status
    );

    if (!lead) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-4">
                <p className="text-base-400">Lead not found.</p>
                <button
                    onClick={() => navigate("/leads")}
                    className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
                >
                    Back to Leads
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate("/leads")}
                    className="p-2 rounded-lg text-base-400 hover:text-base-100 hover:bg-base-800 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <h1 className="font-display text-2xl font-bold text-base-50">
                        {lead.name}
                    </h1>
                    <p className="text-sm text-base-400 mt-0.5">
                        {lead.category}
                    </p>
                </div>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <LeadInfo lead={lead} />
                    <LeadNotes lead={lead} />
                </div>
                <div className="space-y-6">
                    <MessageGenerator lead={lead} />
                    {showTemplates && (
                        <ReplyTemplates
                            lead={lead}
                            tone={
                                outreachTone === "formal"
                                    ? "casual"
                                    : outreachTone
                            }
                        />
                    )}
                    <LeadActivity leadId={lead.id} />
                </div>
            </div>
        </div>
    );
}
