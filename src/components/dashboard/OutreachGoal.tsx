import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { useSettingsStore } from "../../lib/stores/useSettingsStore";
import { getTodayMessagedCount } from "../../utils/todayStats";
import { Flame } from "lucide-react";

export default function OutreachGoal() {
    const { leads } = useLeadsStore();
    const { dailyGoal, currentStreak } = useSettingsStore();

    const today = getTodayMessagedCount(leads);
    const percentage = Math.min((today / dailyGoal) * 100, 100);
    const completed = today >= dailyGoal;

    const circumference = 2 * Math.PI * 36;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-base-100">
                    Today's Goal
                </h2>
                <div className="flex items-center gap-1.5 bg-orange-500/10 px-2.5 py-1 rounded-lg">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-xs font-semibold text-orange-400">
                        {currentStreak} day{currentStreak !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Progress ring */}
                <div className="relative shrink-0">
                    <svg width="88" height="88" className="-rotate-90">
                        {/* Background circle */}
                        <circle
                            cx="44"
                            cy="44"
                            r="36"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-base-800"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="44"
                            cy="44"
                            r="36"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className={
                                completed ? "text-brand-500" : "text-brand-400"
                            }
                            style={{
                                transition: "stroke-dashoffset 0.5s ease"
                            }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="font-display font-bold text-lg text-base-50 leading-none">
                            {today}
                        </p>
                        <p className="text-xs text-base-500">/ {dailyGoal}</p>
                    </div>
                </div>

                {/* Status text */}
                <div className="space-y-1">
                    {completed ? (
                        <>
                            <p className="text-sm font-semibold text-brand-400">
                                Goal reached! 🎉
                            </p>
                            <p className="text-xs text-base-500">
                                You've hit your daily target. Keep the streak
                                going tomorrow.
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-sm font-semibold text-base-100">
                                {dailyGoal - today} more to go
                            </p>
                            <p className="text-xs text-base-500">
                                {today === 0
                                    ? "You haven't sent any messages today yet."
                                    : `Good progress — ${today} message${today > 1 ? "s" : ""} sent today.`}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
