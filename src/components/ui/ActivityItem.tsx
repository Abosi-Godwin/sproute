import { ActivityLog } from '../../types';

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ActivityItem({ entry }: { entry: ActivityLog }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-base-800 last:border-0">
      <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-base-200">{entry.message}</p>
        <p className="text-xs text-base-500 mt-0.5">{timeAgo(entry.timestamp)}</p>
      </div>
    </div>
  );
}