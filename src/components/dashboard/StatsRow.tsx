import { Globe, Zap, TrendingUp, MessageCircle, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Lead, LeadStatus } from "../../types";
import { getTodayMessagedCount } from "../../utils/todayStats";
import { clsx } from "clsx";

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    iconBg: string;
    onClick?: () => void;
}

function StatCard({
    label,
    value,
    icon: Icon,
    color,
    iconBg,
    onClick
}: StatCardProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="w-full text-left bg-base-900 border border-base-800 rounded-xl p-4 flex flex-col gap-3 hover:border-base-700 transition-colors"
        >
            <div className="flex items-center gap-3">
                <div
                    className={clsx(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        iconBg
                    )}
                >
                    <Icon className={clsx("w-4 h-4", color)} />
                </div>
                <p className="text-xs text-base-400">{label}</p>
            </div>
            <p className={clsx("text-2xl font-display font-bold", color)}>
                {value}
            </p>
        </motion.button>
    );
}

export default function StatsRow({ leads }: { leads: Lead[] }) {
    const navigate = useNavigate();

    const total = leads.length;
    const noWebsite = leads.filter(l => !l.website).length;
    const needsAction = leads.filter(l => l.status === "new").length;
    const messaged = leads.filter(l =>
        ["messaged", "replied", "converted"].includes(l.status)
    ).length;
    const converted = leads.filter(l => l.status === "converted").length;
    const conversionRate =
        total > 0 ? Math.round((converted / total) * 100) : 0;
    const todayMessaged = getTodayMessagedCount(leads);

    const stats = [
        {
            label: "No Website",
            value: noWebsite,
            icon: Globe,
            color: "text-red-400",
            iconBg: "bg-red-500/10",
            onClick: () => navigate("/leads?filter=no-website")
        },
        {
            label: "Needs Action",
            value: needsAction,
            icon: Zap,
            color: "text-yellow-400",
            iconBg: "bg-yellow-500/10",
            onClick: () => navigate("/leads?filter=new")
        },
        {
            label: "Messaged",
            value: messaged,
            icon: MessageCircle,
            color: "text-blue-400",
            iconBg: "bg-blue-500/10",
            onClick: () => navigate("/leads?filter=messaged")
        },
        {
            label: "Conversion",
            value: `${conversionRate}%`,
            icon: TrendingUp,
            color: "text-brand-400",
            iconBg: "bg-brand-500/10"
        },
        {
            label: "Today's Outreach",
            value: todayMessaged,
            icon: Send,
            color: "text-purple-400",
            iconBg: "bg-purple-500/10"
        }
    ];

    return (
  <div className="space-y-3">
    {/* Top 4 stats — 2 column grid */}
    <div className="grid grid-cols-2 gap-3">
      {stats.slice(0, 4).map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>

    {/* Today's Outreach — full width */}
    <div className="bg-base-900 border border-base-800 rounded-xl p-4 flex items-center justify-between hover:border-base-700 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
          <Send className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <p className="text-xs text-base-400">Today's Outreach</p>
          <p className="text-xs text-base-600">Resets at midnight</p>
        </div>
      </div>
      <p className="text-2xl font-display font-bold text-purple-400">
        {todayMessaged}
      </p>
    </div>
  </div>
);
}
