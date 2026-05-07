import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  count: number;
  icon: LucideIcon;
  onClick?: () => void;
}

export default function StatCard({ label, count, icon: Icon, onClick }: StatCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left bg-base-900 border border-base-800 rounded-xl p-5 flex items-center justify-between hover:border-brand-500/50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-brand-400" />
        </div>
        <p className="text-sm text-base-400">{label}</p>
      </div>
      <p className="text-2xl font-display font-bold text-base-50">{count}</p>
    </motion.button>
  );
}