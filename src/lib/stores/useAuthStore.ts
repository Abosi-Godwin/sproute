import { create } from "zustand";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../supabase";

interface AuthStore {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setSession: (session: Session | null) => void;
    setIsLoading: (loading: boolean) => void;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>(set => ({
    user: null,
    session: null,
    isLoading: true,
    setUser: user => set({ user }),
    setSession: session => set({ session }),
    setIsLoading: isLoading => set({ isLoading }),
    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null });
    }
}));
