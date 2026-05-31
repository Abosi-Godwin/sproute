import { ActivityLog } from '../types';

export function getTodayMessagedCount(activity: ActivityLog[]): number {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const uniqueLeads = new Set<string>();

    activity.forEach((log) => {
        const timestamp = new Date(log.timestamp);
        if (
            timestamp >= startOfDay &&
            timestamp <= endOfDay &&
            log.message.toLowerCase().includes('marked') &&
            log.message.toLowerCase().includes('messaged')
        ) {
            uniqueLeads.add(log.leadId);
        }
    });

    return uniqueLeads.size;
}