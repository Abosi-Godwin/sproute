import { Lead } from "../../types";
import LeadCard from "./LeadCard";

interface LeadsGroupProps {
    label: string;
    leads: Lead[];
    selected: string[];
    toggleSelect: (id: string) => void;
}

export default function LeadsGroup({
    label,
    leads,
    selected,
    toggleSelect
}: LeadsGroupProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <p className="text-xs font-semibold text-base-400 uppercase tracking-wider capitalize">
                    
                    {label
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, c => c.toUpperCase())}
                </p>
                <span className="text-xs text-base-600">{leads.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {leads.map(lead => (
                    <LeadCard
                        key={lead.id}
                        lead={lead}
                        selected={selected}
                        toggleSelect={toggleSelect}
                    />
                ))}
            </div>
        </div>
    );
}
