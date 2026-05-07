 import { Outlet, Navigate } from 'react-router';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import OnboardingOverlay from '../onboarding/OnboardingOverlay';
import { useUIStore } from '../../lib/stores/useUIStore';
import { useAuthStore } from '../../lib/stores/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function RootLayout() {
  const { hasOnboarded } = useUIStore();
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-base-950">
      {!hasOnboarded && <OnboardingOverlay />}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}