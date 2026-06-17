import { useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../lib/stores/useAuthStore";
import { useSubscriptionStore } from "../../lib/stores/useSubscriptionStore";
import { useLeadsStore } from "../../lib/stores/useLeadsStore";

export default function AuthProvider({
    children
}: {
    children: React.ReactNode;
}) {
    const { setUser, setSession, setIsLoading } = useAuthStore();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);

            if (session?.user) {
                useSubscriptionStore.getState().fetchSubscription();
                useLeadsStore.getState().fetchLeads();
                useLeadsStore.getState().fetchActivity();
            }
        });

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);

            if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
                useSubscriptionStore.getState().fetchSubscription();
                useLeadsStore.getState().fetchLeads();
                useLeadsStore.getState().fetchActivity();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return <>{children}</>;
}