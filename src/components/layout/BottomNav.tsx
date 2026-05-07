import { NavLink } from 'react-router';
import { LayoutDashboard, Search, Users, Settings } from 'lucide-react';
import { clsx } from 'clsx';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-base-900 border-t border-base-800 flex md:hidden">
      {links.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            clsx(
              'flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors',
              isActive ? 'text-brand-400' : 'text-base-500 hover:text-base-300'
            )
          }
        >
          <Icon className="w-5 h-5" />
          <span className="text-xs">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}