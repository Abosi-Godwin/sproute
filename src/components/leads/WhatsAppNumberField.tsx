import { useState } from 'react';
import { MessageCircle, Save, X } from 'lucide-react';
import { Lead } from '../../types';
import { useLeadsStore } from '../../lib/stores/useLeadsStore';

export default function WhatsAppNumberField({ lead }: { lead: Lead }) {
    const { setWhatsappNumber } = useLeadsStore();
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(lead.whatsappNumber ?? '');

    const handleSave = async () => {
        await setWhatsappNumber(lead.id, value.trim());
        setEditing(false);
    };

    const openWhatsApp = () => {
        const number = lead.whatsappNumber ?? lead.phone;
        if (!number) return;
        const clean = number.replace(/\D/g, '');
        window.open(`https://wa.me/${clean}`, '_blank');
    };

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-400" />
                    <p className="text-sm font-medium text-base-100">WhatsApp Number</p>
                </div>
                {!editing && (
                    <button
                        onClick={() => setEditing(true)}
                        className="text-xs text-base-500 hover:text-base-300 transition-colors"
                    >
                        {lead.whatsappNumber ? 'Edit' : 'Add'}
                    </button>
                )}
            </div>

            {editing ? (
                <div className="space-y-2">
                    <input
                        type="tel"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        placeholder="+234 800 000 0000"
                        className="w-full bg-base-800 border border-base-700 rounded-lg px-4 py-2.5 text-sm text-base-100 placeholder:text-base-500 focus:outline-none focus:border-brand-500 transition-colors"
                        autoFocus
                    />
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                        >
                            <Save className="w-3.5 h-3.5" />
                            Save
                        </button>
                        <button
                            onClick={() => { setEditing(false); setValue(lead.whatsappNumber ?? ''); }}
                            className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium py-2 rounded-lg bg-base-800 text-base-400 hover:text-base-100 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-base-400">
                        {lead.whatsappNumber ?? lead.phone ?? 'No number'}
                    </p>
                    {(lead.whatsappNumber || lead.phone) && (
                        <button
                            onClick={openWhatsApp}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Open WhatsApp
                        </button>
                    )}
                </div>
            )}

            {lead.whatsappNumber && lead.phone && lead.whatsappNumber !== lead.phone && (
                <p className="text-xs text-base-600">
                    Google Maps number: {lead.phone}
                </p>
            )}
        </div>
    );
}