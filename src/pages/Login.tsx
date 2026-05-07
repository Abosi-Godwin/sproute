import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Sparkles, Loader2, Mail, Check } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSend = async () => {
        if (!email) return;
        setIsLoading(true);
        setError("");

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin
            }
        });

        if (error) {
            setError(error.message);
        } else {
            setSent(true);
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-base-950 flex items-center justify-center p-6">
            <div className="w-full max-w-sm space-y-8">
                {/* Logo */}
                <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center">
                       
                        <img src="/favicon.svg" alt="sproute logo" />
                    </div>
                    <div className="text-center">
                        <h1 className="font-display text-2xl font-bold text-base-50">
                            Sproute
                        </h1>
                        <p className="text-sm text-base-400 mt-1">
                            Find local businesses. Land clients.
                        </p>
                    </div>
                </div>

                {/* Form */}
                {sent ? (
                    <div className="bg-base-900 border border-base-800 rounded-2xl p-6 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center mx-auto">
                            <Check className="w-6 h-6 text-brand-400" />
                        </div>
                        <div>
                            <p className="font-display font-semibold text-base-100">
                                Check your email
                            </p>
                            <p className="text-sm text-base-400 mt-1">
                                We sent a magic link to{" "}
                                <span className="text-base-200">{email}</span>.
                                Click it to sign in.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setSent(false);
                                setEmail("");
                            }}
                            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                        >
                            Use a different email
                        </button>
                    </div>
                ) : (
                    <div className="bg-base-900 border border-base-800 rounded-2xl p-6 space-y-4">
                        <div>
                            <p className="font-display font-semibold text-base-100">
                                Sign in
                            </p>
                            <p className="text-sm text-base-400 mt-1">
                                Enter your email — we'll send you a magic link.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-500" />
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onKeyDown={e =>
                                        e.key === "Enter" && handleSend()
                                    }
                                    className="w-full bg-base-800 border border-base-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-base-100 placeholder:text-base-500 focus:outline-none focus:border-brand-500 transition-colors"
                                />
                            </div>

                            {error && (
                                <p className="text-xs text-red-400">{error}</p>
                            )}

                            <button
                                onClick={handleSend}
                                disabled={isLoading || !email}
                                className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Send Magic Link"
                                )}
                            </button>
                        </div>
                    </div>
                )}

                <p className="text-center text-xs text-base-600">
                    No password needed. No spam. Ever.
                </p>
            </div>
        </div>
    );
}
