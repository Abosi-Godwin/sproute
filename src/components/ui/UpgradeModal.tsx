import { X, Sparkles, Check } from 'lucide-react';

const PAYSTACK_LINK = 'https://paystack.shop/pay/u00f3ooq4x';

export default function UpgradeModal({ onClose }: { onClose: () => void }) {
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

                <a
                    href={PAYSTACK_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center bg-brand-500 hover:bg-brand-600 text-white font-medium py-3 rounded-xl transition-colors"
                >
                    Upgrade Now
                </a>

                <p className="text-xs text-base-600 text-center">
                    Pay with the same email you used to sign up. Your account upgrades automatically within a minute of payment.
                </p>
            </div>
        </div>
    );
}