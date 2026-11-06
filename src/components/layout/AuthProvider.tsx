import { useEffect, useRef } from "react";
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

const resetStores = () => {
    useSubscriptionStore.getState().reset();
    useLeadsStore.getState().reset();
};

export default function AuthProvider({
    children
}: {
    children: React.ReactNode;
}) {
    const { setUser, setSession, setIsLoading } = useAuthStore();
    const initializedFor = useRef<string | null>(null);

    useEffect(() => {
        const initializeUser = (user: User) => {
            if (initializedFor.current === user.id) return;

            if (initializedFor.current) resetStores();
            initializedFor.current = user.id;

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
            if (event !== "TOKEN_REFRESHED") {
                setUser(session?.user ?? null);
            }
            setIsLoading(false);

            if (event === "SIGNED_OUT") {
                initializedFor.current = null;
                posthog.reset();
                resetStores();
                return;
            }

            if (session?.user) {
                initializeUser(session.user);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [setSession, setUser, setIsLoading]);

    return <>{children}</>;
}