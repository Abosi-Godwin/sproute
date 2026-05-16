import { useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../lib/stores/useAuthStore";

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
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setIsLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    return <>{children}</>;
}