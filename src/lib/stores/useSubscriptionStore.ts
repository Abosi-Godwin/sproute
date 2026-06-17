import { create } from 'zustand';
import { supabase } from '../supabase';

interface SubscriptionStore {
    plan: 'free' | 'pro';
    status: string;
    currentPeriodEnd: string | null;
    isLoading: boolean;
    isPro: () => boolean;
    fetchSubscription: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
    plan: 'free',
    status: 'active',
    currentPeriodEnd: null,
    isLoading: false,

    isPro: () => {
        const { plan, status, currentPeriodEnd } = get();
        if (plan !== 'pro') return false;
        if (status !== 'active') return false;
        if (!currentPeriodEnd) return false;
        if (new Date(currentPeriodEnd) < new Date()) return false;
        return true;
    },

    fetchSubscription: async () => {
        set({ isLoading: true });
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            set({ isLoading: false });
            return;
        }

        const { data } = await supabase
            .from('subscriptions')
            .select('plan, status, current_period_end')
            .eq('user_id', user.id)
            .single();

        if (data) {
            set({
                plan: data.plan as 'free' | 'pro',
                status: data.status,
                currentPeriodEnd: data.current_period_end,
                isLoading: false,
            });
        } else {
            set({ plan: 'free', status: 'active', currentPeriodEnd: null, isLoading: false });
        }
    },
}));