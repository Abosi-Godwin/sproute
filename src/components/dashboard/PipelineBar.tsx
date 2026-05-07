import { Lead, LeadStatus } from '../../types';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router';

const PIPELINE_STAGES: { status: LeadStatus; label: string; color: string; bg: string }[] = [
  { status: 'new', label: 'New', color: 'text-base-300', bg: 'bg-base-600' },
  { status: 'messaged', label: 'Messaged', color: 'text-blue-400', bg: 'bg-blue-500' },
  { status: 'replied', label: 'Replied', color: 'text-yellow-400', bg: 'bg-yellow-500' },
  { status: 'converted', label: 'Converted', color: 'text-brand-400', bg: 'bg-brand-500' },
  { status: 'not_on_whatsapp', label: 'Not on WhatsApp', color: 'text-orange-400', bg: 'bg-orange-500' },
  { status: 'dead', label: 'Dead', color: 'text-red-400', bg: 'bg-red-500' },
];

export default function PipelineBar({ leads }: { leads: Lead[] }) {
  const navigate = useNavigate();
  const total = leads.length;

  if (total === 0) {
    return (
      <div className="bg-base-900 border border-base-800 rounded-xl p-5">
        <p className="text-xs font-semibold text-base-400 uppercase tracking-wider mb-4">Pipeline</p>
        <div className="h-3 bg-base-800 rounded-full" />
        <p className="text-xs text-base-600 mt-3 text-center">No leads yet</p>
      </div>
    );
  }

  const counts = PIPELINE_STAGES.map(stage => ({
    ...stage,
    count: leads.filter(l => l.status === stage.status).length,
    percentage: (leads.filter(l => l.status === stage.status).length / total) * 100,
  })).filter(s => s.count > 0);

  return (
    <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-4">
      <p className="text-xs font-semibold text-base-400 uppercase tracking-wider">Pipeline</p>

      {/* Bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {counts.map(stage => (
          <div
            key={stage.status}
            className={clsx('h-full transition-all', stage.bg)}
            style={{ width: `${stage.percentage}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {counts.map(stage => (
          <button
            key={stage.status}
            onClick={() => navigate(`/leads?filter=${stage.status}`)}
            className="flex items-center gap-1.5 group"
          >
            <div className={clsx('w-2 h-2 rounded-full', stage.bg)} />
            <span className={clsx('text-xs group-hover:text-base-100 transition-colors', stage.color)}>
              {stage.label}
            </span>
            <span className="text-xs text-base-600">({stage.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
}