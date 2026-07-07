import { useEffect } from "react";
import { Outlet, useLocation, Navigate } from "react-router";
import toast from "react-hot-toast";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import OnboardingOverlay from "../onboarding/OnboardingOverlay";
import ScrollToTop from "./ScrollToTop";
import { useUIStore } from "../../lib/stores/useUIStore";
import { useAuthStore } from "../../lib/stores/useAuthStore";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { Loader2 } from "lucide-react";
import { posthog } from "../../lib/posthog";

export default function RootLayout() {
    const { hasOnboarded } = useUIStore();
    const { user, isLoading } = useAuthStore();
    const { fetchLeads, fetchActivity } = useLeadsStore();
    const location = useLocation();

    // 1. Data fetching effect
    useEffect(() => {
        if (user) {
            fetchLeads();
            fetchActivity();
        }
    }, [user]);

    // 2. PostHog pageview tracking effect (MOVED OUT)
    useEffect(() => {
        posthog.capture("$pageview", {
            $current_url: window.location.href
        });
    }, [location.pathname]);

    // 3. Online/Offline status effect
    useEffect(() => {
        const handleOffline = () =>
            toast.error("You are offline", {
                duration: Infinity,
                id: "offline"
            });
            
        const handleOnline = () => {
            toast.dismiss("offline");
            toast.success("Back online");
        };

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);
        
        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
    }, []);

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
        </div>
    );
}
