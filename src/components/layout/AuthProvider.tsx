import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../lib/stores/useAuthStore";
import { useSubscriptionStore } from "../../lib/stores/useSubscriptionStore";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { posthog } from "../../lib/posthog";

const isFirstVerification = (user: User) => {
    if (!user.email_confirmed_at || !user.last_sign_in_at) return false;
    const gap = Math.abs(
        new Date(user.last_sign_in_at).getTime() -
            new Date(user.email_confirmed_at).getTime()
    );
    return gap < 10000;
};

const trackSignup = (user: User) => {
    if (!isFirstVerification(user)) return;
    const key = `ph_signup_${user.id}`;
    try {
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, "1");
    } catch {
        return;
    }
    posthog.capture("signup_completed");
};

export default function AuthProvider({
    children
}: {
    children: React.ReactNode;
}) {
    const { setUser, setSession, setIsLoading } = useAuthStore();

    useEffect(() => {
        const initializeUser = (user: User) => {
            useSubscriptionStore.getState().fetchSubscription();
            useLeadsStore.getState().fetchLeads();
            useLeadsStore.getState().fetchActivity();

            posthog.identify(user.id, {
                email: user.email,
                created_at: user.created_at
            });

            trackSignup(user);
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);

            if (session?.user) {
                initializeUser(session.user);
            }
        });

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);

            if (
                session?.user &&
                (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
            ) {
                initializeUser(session.user);
            }

            if (event === "SIGNED_OUT") {
                posthog.reset();
                useSubscriptionStore.getState().reset();
                useLeadsStore.getState().reset();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [setSession, setUser, setIsLoading]);

    return <>{children}</>;
}