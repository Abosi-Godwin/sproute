import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useLeadsStore } from "../lib/stores/useLeadsStore";
import LeadInfo from "../components/leads/LeadInfo";
import LeadNotes from "../components/leads/LeadNotes";
import LeadActivity from "../components/leads/LeadActivity";
import WhatsAppNumberField from "../components/leads/WhatsAppNumberField";
import MessageGenerator from "../components/leads/MessageGenerator";
import OutreachFlow from "../components/leads/OutreachFlow";
import ClosingGuide from "../components/leads/ClosingGuide";
import OpportunitySummary from "../components/leads/OpportunitySummary";

export default function LeadDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { leads } = useLeadsStore();

    const lead = leads.find(l => l.id === id);

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
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate("/leads")}
                    className="p-2 rounded-lg text-base-400 hover:text-base-100 hover:bg-base-800 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left — context */}
                <div className="space-y-6">
                    <LeadInfo lead={lead} />
                    <LeadNotes lead={lead} />
                    <LeadActivity leadId={lead.id} />
                </div>

                {/* Right — action */}
                <div className="space-y-6">
                    <OpportunitySummary lead={lead} />
                    <WhatsAppNumberField lead={lead} />
                    <MessageGenerator lead={lead} />
                    <OutreachFlow key={lead.id} lead={lead} />
                    <ClosingGuide />
                </div>
            </div>
        </div>
    );
}
