import { clsx } from 'clsx';
import { LeadStatus } from '../../types';
import { useLeadsFilterStore } from '../../lib/stores/useLeadsFilterStore';

const STATUSES: { label: string; value: LeadStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Messaged', value: 'messaged' },
  { label: 'Replied', value: 'replied' },
  { label: 'Converted', value: 'converted' },
  { label: 'Dead', value: 'dead' },{ label: 'Not on WhatsApp', value:
  'not_on_whatsapp' },
];

const statusColors: Record<LeadStatus | 'all', string> = {
  all: 'bg-base-700 text-base-300',
  new: 'bg-base-700 text-base-300',
  messaged: 'bg-blue-500/10 text-blue-400',
  replied: 'bg-yellow-500/10 text-yellow-400',
  converted: 'bg-brand-500/10 text-brand-400',
  dead: 'bg-red-500/10 text-red-400',
};

export default function LeadsFilter() {
  const {
    selectedStatus, noWebsiteOnly, hasPhoneOnly, groupBy,
    setSelectedStatus, setNoWebsiteOnly, setHasPhoneOnly, setGroupBy,
  } = useLeadsFilterStore();

  return (
    <div className="bg-base-900 border border-base-800 rounded-xl p-4 space-y-4">
      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setSelectedStatus(value)}
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              selectedStatus === value
                ? statusColors[value]
                : 'bg-base-800 text-base-500 hover:text-base-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Toggles + Group by */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-base-400 cursor-pointer">
            <input
              type="checkbox"
              checked={noWebsiteOnly}
              onChange={(e) => setNoWebsiteOnly(e.target.checked)}
              className="accent-brand-500"
            />
            No website
          </label>
          <label className="flex items-center gap-2 text-sm text-base-400 cursor-pointer">
            <input
              type="checkbox"
              checked={hasPhoneOnly}
              onChange={(e) => setHasPhoneOnly(e.target.checked)}
              className="accent-brand-500"
            />
            Has phone
          </label>
        </div>

        {/* Group by toggle */}
        <div className="flex items-center gap-1 bg-base-800 rounded-lg p-1">
          {(['status', 'category'] as const).map((val) => (
            <button
              key={val}
              onClick={() => setGroupBy(val)}
              className={clsx(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize',
                groupBy === val
                  ? 'bg-base-700 text-base-100'
                  : 'text-base-500 hover:text-base-300'
              )}
            >
              {val}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}