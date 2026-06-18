import { useState } from 'react';
import { X, Sparkles, Check, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSubscriptionStore } from '../lib/stores/useSubscriptionStore';
import toast from 'react-hot-toast';

declare global {
    interface Window {
        PaystackPop: any;
    }
}

export default function UpgradeModal({ onClose }: { onClose: () => void }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const { fetchSubscription } = useSubscriptionStore();

    const handleUpgrade = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
            toast.error('Could not find your account email — try signing in again');
            return;
        }

        if (!window.PaystackPop) {
            toast.error('Payment system not loaded — refresh and try again');
            return;
        }

        const handler = window.PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
            email: user.email,
            amount: 350000,
            currency: 'NGN',
            ref: `sproute_${user.id}_${Date.now()}`,
            metadata: {
                custom_fields: [
                    { display_name: 'Plan', variable_name: 'plan', value: 'Sproute Pro' },
                ],
            },
            callback: function (response: { reference: string }) {
                verifyPayment(response.reference);
            },
            onClose: function () {
                toast('Payment cancelled');
            },
        });

        handler.openIframe();
    };

    const verifyPayment = async (reference: string) => {
        setIsProcessing(true);
        try {
            const res = await fetch('/api/paystack-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                await fetchSubscription();
                toast.success('Welcome to Pro! Your account is upgraded.');
                onClose();
            } else {
                toast.error('Payment received but verification failed — contact support');
            }
        } catch {
            toast.error('Could not verify payment — contact support');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
            <div className="bg-base-900 border border-base-800 rounded-2xl p-6 max-w-sm w-full space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-brand-400" />
                        <h3 className="font-display font-bold text-lg text-base-50">
                            Upgrade to Pro
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-base-500 hover:text-base-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-sm text-base-400">
                    You have hit your free plan limit. Upgrade to keep prospecting without interruptions.
                </p>

                <div className="space-y-2.5">
                    {[
                        'Unlimited saved leads',
                        '50 AI generations per day',
                        'Priority support',
                    ].map(item => (
                        <div key={item} className="flex items-center gap-2.5">
                            <Check className="w-4 h-4 text-brand-400 shrink-0" />
                            <span className="text-sm text-base-300">{item}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-base-800 rounded-xl p-4 text-center">
                    <p className="font-display text-3xl font-bold text-base-50">₦3,500</p>
                    <p className="text-xs text-base-500">per month</p>
                </div>

                <button
                    onClick={handleUpgrade}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
                >
                    {isProcessing
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                        : 'Upgrade Now'
                    }
                </button>

                <p className="text-xs text-base-600 text-center">
                    Your account upgrades instantly after payment.
                </p>
            </div>
        </div>
    );
}