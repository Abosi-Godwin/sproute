import { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import OnboardingOverlay from "../onboarding/OnboardingOverlay";
import ScrollToTop from "./ScrollToTop";
import { useUIStore } from "../../lib/stores/useUIStore";
import { useAuthStore } from "../../lib/stores/useAuthStore";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { Loader2 } from "lucide-react";

export default function RootLayout() {
    const { hasOnboarded } = useUIStore();
    const { user, isLoading } = useAuthStore();
    const { fetchLeads, fetchActivity } = useLeadsStore();

    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        if (user) {
            fetchLeads();
            fetchActivity();
        }
    }, [user]);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
            setShowInstallBanner(true);
        };
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === "accepted") {
            setShowInstallBanner(false);
            setInstallPrompt(null);
        }
    };

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
            <ScrollToTop />
            {!hasOnboarded && <OnboardingOverlay />}
            <div className="hidden md:block">
                <Sidebar />
            </div>
            <main
                id="main-content"
                className="flex-1 overflow-y-auto pb-16 md:pb-0"
            >
                <Outlet />
            </main>
            <BottomNav />

            {/* Install banner */}
            {showInstallBanner && (
                <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-80">
                    <div className="bg-base-900 border border-brand-500/30 rounded-xl p-4 flex items-center gap-3 shadow-2xl">
                        <img
                            src="/icons/android-chrome-192x192.png"
                            alt="Sproute"
                            className="w-10 h-10 rounded-xl shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-base-100">
                                Install Sproute
                            </p>
                            <p className="text-xs text-base-500">
                                Add to your home screen
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setShowInstallBanner(false)}
                                className="text-xs text-base-500 hover:text-base-300 transition-colors"
                            >
                                Later
                            </button>
                            <button
                                onClick={handleInstall}
                                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                            >
                                Install
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}