import { useEffect, useRef } from "react";
import { Outlet, Navigate } from "react-router";
import toast from "react-hot-toast";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import OnboardingOverlay from "../onboarding/OnboardingOverlay";
import ScrollToTop from "./ScrollToTop";
import { supabase } from "../../lib/supabase";
import { useUIStore } from "../../lib/stores/useUIStore";
import { useAuthStore } from "../../lib/stores/useAuthStore";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { Loader2 } from "lucide-react";

export default function RootLayout() {
    const { hasOnboarded } = useUIStore();
    const { user, isLoading } = useAuthStore();
    const { leads, hasLoaded } = useLeadsStore();
    const onboardingShown = useRef(false);

    const flaggedOnAccount = user?.user_metadata?.onboarded === true;
    const showOnboarding =
        Boolean(user) &&
        hasLoaded &&
        !hasOnboarded &&
        !flaggedOnAccount &&
        leads.length === 0;

    useEffect(() => {
        if (showOnboarding) {
            onboardingShown.current = true;
            return;
        }
        if (
            !onboardingShown.current ||
            !hasOnboarded ||
            !user ||
            flaggedOnAccount
        )
            return;
        onboardingShown.current = false;
        supabase.auth.updateUser({ data: { onboarded: true } }).catch(() => {});
    }, [showOnboarding, hasOnboarded, user?.id, flaggedOnAccount]);

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
            {showOnboarding && <OnboardingOverlay />}
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