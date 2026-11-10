import { useEffect, useRef, useState } from "react";
import { X, Sparkles, Check, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useSubscriptionStore } from "../../lib/stores/useSubscriptionStore";
import { posthog } from "../../lib/posthog";
import toast from "react-hot-toast";

declare global {
    interface Window {
        PaystackPop: any;
    }
}

const PRICE_KOBO = 350000;
const PAYSTACK_SRC = "https://js.paystack.co/v1/inline.js";

const waitFor = (check: () => boolean, timeoutMs: number) =>
    new Promise<boolean>(resolve => {
        const startedAt = Date.now();
        const tick = () => {
            if (check()) return resolve(true);
            if (Date.now() - startedAt > timeoutMs) return resolve(false);
            setTimeout(tick, 100);
        };
        tick();
    });

const loadPaystack = async () => {
    if (window.PaystackPop) return true;

    const selector = `script[src="${PAYSTACK_SRC}"]`;

    if (!document.querySelector(selector)) {
        const script = document.createElement("script");
        script.src = PAYSTACK_SRC;
        script.async = true;
        document.head.appendChild(script);
    }

    const loaded = await waitFor(() => Boolean(window.PaystackPop), 10000);

    if (!loaded) document.querySelector(selector)?.remove();

    return loaded;
};

export default function UpgradeModal({ onClose }: { onClose: () => void }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isOpening, setIsOpening] = useState(false);
    const { fetchSubscription, isPro } = useSubscriptionStore();
    const paidRef = useRef(false);

    const planCode =
        (import.meta.env.VITE_PAYSTACK_PLAN_CODE as string | undefined)?.trim() ||
        "";
    const recurring = planCode.length > 0;
    const alreadyPro = isPro();

    useEffect(() => {
        if (!alreadyPro) loadPaystack();
    }, [alreadyPro]);

    const handleUpgrade = async () => {
        if (isProcessing || isOpening) return;
        setIsOpening(true);

        try {
            const {
                data: { user }
            } = await supabase.auth.getUser();
            if (!user?.email) {
                toast.error(
                    "Could not find your account email. Try signing in again"
                );
                return;
            }

            const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
            if (!publicKey) {
                posthog.capture("payment_verify_failed", {
                    status: 0,
                    detail: "missing_public_key"
                });
                toast.error("Payments are not set up yet. Contact support");
                return;
            }

            const loaded = await loadPaystack();
            if (!loaded || !window.PaystackPop) {
                toast.error(
                    "Payment system not loaded. Check your connection and try again"
                );
                return;
            }

            paidRef.current = false;
            posthog.capture("payment_started", {
                amount: PRICE_KOBO / 100,
                recurring
            });

            const config: Record<string, unknown> = {
                key: publicKey,
                email: user.email,
                ref: `sproute_${user.id}_${Date.now()}`,
                metadata: {
                    user_id: user.id,
                    custom_fields: [
                        {
                            display_name: "Plan",
                            variable_name: "plan",
                            value: "Sproute Pro"
                        }
                    ]
                },
                callback: function (response: { reference: string }) {
                    paidRef.current = true;
                    verifyPayment(response.reference);
                },
                onClose: function () {
                    if (paidRef.current) return;
                    posthog.capture("payment_cancelled");
                    toast("Payment cancelled");
                }
            };

            if (recurring) {
                config.plan = planCode;
            } else {
                config.amount = PRICE_KOBO;
                config.currency = "NGN";
            }

            const handler = window.PaystackPop.setup(config);
            handler.openIframe();
        } finally {
            setIsOpening(false);
        }
    };

    const verifyPayment = async (reference: string) => {
        setIsProcessing(true);
        let confirmed = false;

        try {
            const {
                data: { session }
            } = await supabase.auth.getSession();

            const res = await fetch("/api/paystack-verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(session
                        ? { Authorization: `Bearer ${session.access_token}` }
                        : {})
                },
                body: JSON.stringify({ reference })
            });

            const data = await res.json().catch(() => null);

            if (res.ok && data?.success) {
                confirmed = true;
            } else {
                posthog.capture("payment_verify_failed", {
                    reference,
                    status: res.status,
                    detail: data?.message ?? ""
                });
            }
        } catch (err: any) {
            posthog.capture("payment_verify_failed", {
                reference,
                status: 0,
                detail: err?.message ?? ""
            });
        }

        await fetchSubscription();

        if (!confirmed) {
            confirmed = useSubscriptionStore.getState().isPro();
        }

        setIsProcessing(false);

        if (confirmed) {
            posthog.capture("payment_success", { reference, recurring });
            toast.success("Welcome to Pro! Your account is upgraded.");
            onClose();
            return;
        }

        toast.error(
            `Payment received but not confirmed yet. Contact support with reference ${reference}`,
            { duration: 10000 }
        );
    };

    if (alreadyPro) {
        return (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
                <div className="bg-base-900 border border-base-800 rounded-2xl p-6 max-w-sm w-full space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-brand-400" />
                            <h3 className="font-display font-bold text-lg text-base-50">
                                Daily limit reached
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-base-500 hover:text-base-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <p className="text-sm text-base-400">
                        You have used all your Pro AI generations for today. They
                        reset at 1:00 AM Nigeria time.
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-3 rounded-xl transition-colors"
                    >
                        Got it
                    </button>
                </div>
            </div>
        );
    }

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
                    <button
                        onClick={onClose}
                        className="text-base-500 hover:text-base-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-sm text-base-400">
                    You have hit your free plan limit. Upgrade to keep
                    prospecting without interruptions.
                </p>

                <div className="space-y-2.5">
                    {[
                        "Unlimited saved leads",
                        "50 AI generations per day",
                        "Priority support"
                    ].map(item => (
                        <div key={item} className="flex items-center gap-2.5">
                            <Check className="w-4 h-4 text-brand-400 shrink-0" />
                            <span className="text-sm text-base-300">
                                {item}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="bg-base-800 rounded-xl p-4 text-center">
                    <p className="font-display text-3xl font-bold text-base-50">
                        ₦{(PRICE_KOBO / 100).toLocaleString()}
                    </p>
                    <p className="text-xs text-base-500">
                        {recurring ? "per month" : "for 30 days"}
                    </p>
                </div>

                <button
                    onClick={handleUpgrade}
                    disabled={isProcessing || isOpening}
                    className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />{" "}
                            Verifying...
                        </>
                    ) : isOpening ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />{" "}
                            Opening checkout...
                        </>
                    ) : (
                        "Upgrade Now"
                    )}
                </button>

                <p className="text-xs text-base-600 text-center">
                    {recurring
                        ? "Renews every month until you cancel. Your account upgrades instantly after payment."
                        : "One payment for 30 days of Pro. Your account upgrades instantly after payment."}
                </p>
            </div>
        </div>
    );
}