/*import { useNavigate } from "react-router";
import { useLeadsStore } from "../lib/stores/useLeadsStore";
import StatsRow from "../components/dashboard/StatsRow";
import PipelineBar from "../components/dashboard/PipelineBar";
import QuickSearch from "../components/dashboard/QuickSearch";
import LeadRow from "../components/ui/LeadRow";
import ActivityItem from "../components/ui/ActivityItem";
import OutreachGoal from "../components/dashboard/OutreachGoal";
import FollowUpAlert from "../components/dashboard/FollowUpAlert";

export default function Dashboard() {
    const navigate = useNavigate();
    const { leads, activity } = useLeadsStore();

    const recentLeads = leads.slice(0, 5);
    const recentActivity = activity.slice(0, 10);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="font-display text-2xl font-bold text-base-50">
                    Dashboard
                </h1>
                <p className="text-sm text-base-400 mt-1">
                    Your prospecting overview
                </p>
            </div>

            <QuickSearch />
            <StatsRow leads={leads} activity={activity} />
            <FollowUpAlert />
            <PipelineBar leads={leads} />
            <OutreachGoal />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-base-900 border border-base-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display font-semibold text-base-100">
                            Recent Leads
                        </h2>
                        <button
                            onClick={() => navigate("/leads")}
                            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                        >
                            See all
                        </button>
                    </div>
                    {recentLeads.length === 0 ? (
                        <p className="text-sm text-base-500 py-6 text-center">
                            No leads saved yet
                        </p>
                    ) : (
                        recentLeads.map(lead => (
                            <LeadRow key={lead.id} lead={lead} />
                        ))
                    )}
                </div>

                <div className="bg-base-900 border border-base-800 rounded-xl p-5">
                    <h2 className="font-display font-semibold text-base-100 mb-4">
                        Activity
                    </h2>
                    {recentActivity.length === 0 ? (
                        <p className="text-sm text-base-500 py-6 text-center">
                            No activity yet
                        </p>
                    ) : (
                        recentActivity.map(entry => (
                            <ActivityItem key={entry.id} entry={entry} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
*/

import { useNavigate } from "react-router";
import { useLeadsStore } from "../lib/stores/useLeadsStore";
import StatsRow from "../components/dashboard/StatsRow";
import PipelineBar from "../components/dashboard/PipelineBar";
import QuickSearch from "../components/dashboard/QuickSearch";
import LeadRow from "../components/ui/LeadRow";
import ActivityItem from "../components/ui/ActivityItem";
import OutreachGoal from "../components/dashboard/OutreachGoal";
import FollowUpAlert from "../components/dashboard/FollowUpAlert";

export default function Dashboard() {
    const navigate = useNavigate();
    const { leads, activity } = useLeadsStore();

    const recentLeads = leads.slice(0, 5);
    const recentActivity = activity.slice(0, 10);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="font-display text-2xl font-bold text-base-50">
                    Dashboard
                </h1>
                <p className="text-sm text-base-400 mt-1">
                    Your prospecting overview
                </p>
            </div>

            <QuickSearch />

            {/* Key numbers */}
            <StatsRow leads={leads} activity={activity} />


            {/* Pipeline context */}
            <PipelineBar leads={leads} />

            {/* Daily accountability */}
            <OutreachGoal />


            {/* Urgent alerts first */}
            <FollowUpAlert />
            
            {/* History */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-base-900 border border-base-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display font-semibold text-base-100">
                            Recent Leads
                        </h2>
                        <button
                            onClick={() => navigate("/leads")}
                            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                        >
                            See all
                        </button>
                    </div>
                    {recentLeads.length === 0 ? (
                        <p className="text-sm text-base-500 py-6 text-center">
                            No leads saved yet
                        </p>
                    ) : (
                        recentLeads.map(lead => (
                            <LeadRow key={lead.id} lead={lead} />
                        ))
                    )}
                </div>

                <div className="bg-base-900 border border-base-800 rounded-xl p-5">
                    <h2 className="font-display font-semibold text-base-100 mb-4">
                        Activity
                    </h2>
                    {recentActivity.length === 0 ? (
                        <p className="text-sm text-base-500 py-6 text-center">
                            No activity yet
                        </p>
                    ) : (
                        recentActivity.map(entry => (
                            <ActivityItem key={entry.id} entry={entry} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
