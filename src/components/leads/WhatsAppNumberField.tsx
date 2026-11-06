import { useState } from "react";
import { MessageCircle, Save, X } from "lucide-react";
import { Lead } from "../../types";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { posthog } from "../../lib/posthog";
import {
    formatInternational,
    openWhatsApp,
    pickWhatsAppNumber,
    toWhatsAppNumber
} from "../../utils/phone";

export default function WhatsAppNumberField({ lead }: { lead: Lead }) {
    const { setWhatsappNumber } = useLeadsStore();
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState("");
    const [error, setError] = useState("");

    const target = pickWhatsAppNumber(lead);
    const shown = lead.whatsappNumber || lead.phone;
    const showMapsNumber =
        Boolean(lead.whatsappNumber && lead.phone) &&
        (toWhatsAppNumber(lead.whatsappNumber) ?? lead.whatsappNumber) !==
            (toWhatsAppNumber(lead.phone) ?? lead.phone);

    const startEdit = () => {
        setValue(lead.whatsappNumber ?? "");
        setError("");
        setEditing(true);
    };

    const cancel = () => {
        setEditing(false);
        setError("");
    };

    const handleSave = async () => {
        const trimmed = value.trim();

        if (!trimmed) {
            await setWhatsappNumber(lead.id, "");
            setEditing(false);
            return;
        }

        const normalized = toWhatsAppNumber(trimmed);
        if (!normalized) {
            posthog.capture("whatsapp_number_invalid", {
                lead_id: lead.id,
                length: trimmed.length
            });
            setError(
                "Enter a mobile number, like 0803 123 4567 or +234 803 123 4567"
            );
            return;
        }

        await setWhatsappNumber(lead.id, `+${normalized}`);
        setEditing(false);
        setError("");
    };

    const handleOpen = () => {
        if (!target) return;
        posthog.capture("whatsapp_opened", {
            lead_id: lead.id,
            source: "number_field"
        });
        openWhatsApp(target);
    };

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-400" />
                    <p className="text-sm font-medium text-base-100">
                        WhatsApp Number
                    </p>
                </div>
                {!editing && (
                    <button
                        onClick={startEdit}
                        className="text-xs text-base-500 hover:text-base-300 transition-colors"
                    >
                        {lead.whatsappNumber ? "Edit" : "Add"}
                    </button>
                )}
            </div>

            {editing ? (
                <div className="space-y-2">
                    <input
                        type="tel"
                        inputMode="tel"
                        value={value}
                        onChange={e => {
                            setValue(e.target.value);
                            setError("");
                        }}
                        onKeyDown={e => e.key === "Enter" && handleSave()}
                        placeholder="0803 123 4567"
                        className="w-full bg-base-800 border border-base-700 rounded-lg px-4 py-2.5 text-sm text-base-100 placeholder:text-base-500 focus:outline-none focus:border-brand-500 transition-colors"
                        autoFocus
                    />
                    {error && <p className="text-xs text-red-400">{error}</p>}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                        >
                            <Save className="w-3.5 h-3.5" />
                            Save
                        </button>
                        <button
                            onClick={cancel}
                            className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium py-2 rounded-lg bg-base-800 text-base-400 hover:text-base-100 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-base-400 truncate">
                            {shown || "No number"}
                        </p>
                        {target && (
                            <button
                                onClick={handleOpen}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors shrink-0"
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                Open WhatsApp
                            </button>
                        )}
                    </div>
                    {target && (
                        <p className="text-xs text-base-600">
                            Opens {formatInternational(target)}
                        </p>
                    )}
                    {!target && shown && (
                        <p className="text-xs text-orange-400">
                            This looks like a landline or an invalid number. Add
                            a mobile number to message them on WhatsApp.
                        </p>
                    )}
                </div>
            )}

            {showMapsNumber && (
                <p className="text-xs text-base-600">
                    Google Maps number: {lead.phone}
                </p>
            )}
        </div>
    );
}