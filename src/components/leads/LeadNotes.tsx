import { useState } from 'react';
import { Lead } from '../../types';
import { useLeadsStore } from '../../lib/stores/useLeadsStore';

export default function LeadNotes({ lead }: { lead: Lead }) {
  const { updateNotes } = useLeadsStore();
  const [value, setValue] = useState(lead.notes ?? '');

  return (
    <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-3">
      <h3 className="font-display font-semibold text-base-100">Notes</h3>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => updateNotes(lead.id, value)}
        placeholder="Add notes about this lead..."
        rows={4}
        className="w-full bg-base-800 border border-base-700 rounded-lg px-4 py-3 text-sm text-base-100 placeholder:text-base-500 focus:outline-none focus:border-brand-500 transition-colors resize-none"
      />
    </div>
  );
}