import { useLeadsStore } from '../../lib/stores/useLeadsStore';
import ActivityItem from '../ui/ActivityItem';

export default function LeadActivity({ leadId }: { leadId: string }) {
  const { activity } = useLeadsStore();
  const leadActivity = activity.filter((a) => a.leadId === leadId);

  return (
    <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-1">
      <h3 className="font-display font-semibold text-base-100 mb-3">Activity</h3>
      {leadActivity.length === 0 ? (
        <p className="text-sm text-base-500 py-4 text-center">No activity yet.</p>
      ) : (
        leadActivity.map((entry) => (
          <ActivityItem key={entry.id} entry={entry} />
        ))
      )}
    </div>
  );
}