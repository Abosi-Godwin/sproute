import { useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../lib/stores/useAuthStore";
import { useSubscriptionStore } from "../../lib/stores/useSubscriptionStore";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";
import { posthog } from "../../lib/posthog";

export default function AuthProvider({
    children
}: {
    children: React.ReactNode;
}) {
    const { setUser, setSession, setIsLoading } = useAuthStore();

    useEffect(() => {
        
        const initializeUser = (user: any) => {
            useSubscriptionStore.getState().fetchSubscription();
            useLeadsStore.getState().fetchLeads();
            useLeadsStore.getState().fetchActivity();

            posthog.identify(user.id, {
                email: user.email,
                created_at: user.created_at
            });
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
