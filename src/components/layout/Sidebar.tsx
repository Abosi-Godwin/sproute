import { NavLink } from 'react-router';
import {
    LayoutDashboard,
    Search,
    Users,
    Settings,
    PanelLeftClose,
    PanelLeftOpen,
    LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../lib/stores/useUIStore';
import { useAuthStore } from '../../lib/stores/useAuthStore';
import { clsx } from 'clsx';

const navLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/leads', icon: Users, label: 'Leads' },
];

export default function Sidebar() {
    const { isSidebarOpen, toggleSidebar } = useUIStore();
    const { signOut } = useAuthStore();

    return (
        <motion.aside
            animate={{ width: isSidebarOpen ? 224 : 64 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex flex-col h-screen bg-base-900 border-r border-base-800 overflow-hidden shrink-0"
        >
            {/* Logo */}
            <div className="flex items-center h-16 px-4 border-b border-base-800 gap-3">
                <div className="w-7 h-7 rounded-md bg-brand-500 shrink-0" />
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="font-display font-bold text-lg text-base-50 whitespace-nowrap"
                        >
                            Sproute
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-1 flex-1 p-3">
                {navLinks.map(({ to, icon: Icon, label, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                                isActive
                                    ? 'bg-brand-500/10 text-brand-400'
                                    : 'text-base-400 hover:text-base-100 hover:bg-base-800'
                            )
                        }
                    >
                        <Icon className="w-5 h-5 shrink-0" />
                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="text-sm font-medium whitespace-nowrap"
                                >
                                    {label}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </NavLink>
                ))}
            </nav>

            {/* Bottom */}
            <div className="p-3 border-t border-base-800 flex flex-col gap-1">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        clsx(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                            isActive
                                ? 'bg-brand-500/10 text-brand-400'
                                : 'text-base-400 hover:text-base-100 hover:bg-base-800'
                        )
                    }
                >
                    <Settings className="w-5 h-5 shrink-0" />
                    <AnimatePresence>
                        {isSidebarOpen && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="text-sm font-medium whitespace-nowrap"
                            >
                                Settings
                            </motion.span>
                        )}
                    </AnimatePresence>
                </NavLink>

                {/* Sign Out */}
                <button
                    onClick={signOut}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base-400 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    <AnimatePresence>
                        {isSidebarOpen && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="text-sm font-medium whitespace-nowrap"
                            >
                                Sign Out
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>

                {/* Toggle */}
                <button
                    onClick={toggleSidebar}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base-400 hover:text-base-100 hover:bg-base-800 transition-colors"
                >
                    {isSidebarOpen
                        ? <PanelLeftClose className="w-5 h-5 shrink-0" />
                        : <PanelLeftOpen className="w-5 h-5 shrink-0" />
                    }
                    <AnimatePresence>
                        {isSidebarOpen && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="text-sm font-medium whitespace-nowrap"
                            >
                                Collapse
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.aside>
    );
}