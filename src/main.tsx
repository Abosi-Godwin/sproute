import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    createBrowserRouter,
    Outlet,
    RouterProvider,
    useLocation,
    useNavigation,
    useRouteError
} from "react-router";
import { Loader2 } from "lucide-react";

import AuthProvider from "./components/layout/AuthProvider";
import RootLayout from "./components/layout/RootLayout";
import Login from "./pages/Login";
import Toast from "./components/ui/Toaster";
import { initPostHog, posthog } from "./lib/posthog";
import { inject } from "@vercel/analytics";

const queryClient = new QueryClient();

initPostHog();
inject();

const loadDashboard = () => import("./pages/Dashboard");
const loadSearch = () => import("./pages/Search");
const loadLeads = () => import("./pages/Leads");
const loadLeadDetail = () => import("./pages/LeadDetail");
const loadSettings = () => import("./pages/Settings");

const page = (load: () => Promise<{ default: React.ComponentType }>) => ({
    lazy: async () => ({ Component: (await load()).default })
});

window.addEventListener("vite:preloadError", () => {
    posthog.capture("chunk_load_failed");
    try {
        if (sessionStorage.getItem("chunk_reload")) return;
        sessionStorage.setItem("chunk_reload", "1");
        setTimeout(() => sessionStorage.removeItem("chunk_reload"), 10000);
    } catch {
        return;
    }
    window.location.reload();
});

const whenIdle = (fn: () => void) => {
    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(fn, { timeout: 4000 });
    } else {
        setTimeout(fn, 2500);
    }
};

whenIdle(() => {
    if (window.location.pathname === "/login") return;
    loadSearch().catch(() => {});
    loadLeads().catch(() => {});
});

function PageSpinner() {
    return (
        <div className="min-h-screen bg-base-950 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
    );
}

function RouteError() {
    const error = useRouteError();

    useEffect(() => {
        posthog.capture("route_error", {
            message: error instanceof Error ? error.message : String(error)
        });
    }, [error]);

    return (
        <div className="min-h-screen bg-base-950 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="font-display font-semibold text-base-100">
                Something went wrong
            </p>
            <p className="text-sm text-base-400">
                Reload the page to continue.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
                Reload
            </button>
        </div>
    );
}

function TrackedRoot() {
    const location = useLocation();
    const navigation = useNavigation();

    useEffect(() => {
        posthog.capture("$pageview", {
            $current_url: window.location.href
        });
    }, [location.pathname]);

    return (
        <>
            {navigation.state === "loading" && (
                <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-brand-500 animate-pulse" />
            )}
            <Outlet />
        </>
    );
}

const router = createBrowserRouter([
    {
        element: <TrackedRoot />,
        HydrateFallback: PageSpinner,
        ErrorBoundary: RouteError,
        children: [
            {
                path: "/login",
                element: <Login />
            },
            {
                path: "/",
                element: <RootLayout />,
                children: [
                    { index: true, ...page(loadDashboard) },
                    { path: "search", ...page(loadSearch) },
                    { path: "leads", ...page(loadLeads) },
                    { path: "leads/:id", ...page(loadLeadDetail) },
                    { path: "settings", ...page(loadSettings) }
                ]
            }
        ]
    }
]);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Toast />
                <RouterProvider
                    router={router}
                    future={{ v7_startTransition: true }}
                />
            </AuthProvider>
        </QueryClientProvider>
    </StrictMode>
);