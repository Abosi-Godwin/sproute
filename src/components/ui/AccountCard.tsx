function AccountCard() {
    const { plan, currentPeriodEnd, fetchSubscription } = useSubscriptionStore();
    const { isPro } = useSubscriptionStore();
    const pro = isPro();
    const [user, setUser] = useState<any>(null);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const { signOut } = useAuthStore();

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);

    const renewalDate = currentPeriodEnd
        ? new Date(currentPeriodEnd).toLocaleDateString('en-NG', {
            day: 'numeric', month: 'long', year: 'numeric'
          })
        : null;

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-400" />
                    <h2 className="font-display font-semibold text-base-100">Account</h2>
                </div>
                {pro && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400">
                        <Sparkles className="w-3 h-3" />
                        Pro
                    </span>
                )}
            </div>

            <div className="space-y-1">
                <p className="text-sm text-base-100">{user?.email}</p>
                <p className="text-xs text-base-500">
                    Member since {user ? new Date(user.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : '...'}
                </p>
            </div>

            {pro ? (
                <div className="bg-brand-500/5 border border-brand-500/10 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-brand-400">Sproute Pro</p>
                        <span className="text-xs text-base-500">Active</span>
                    </div>
                    <p className="text-xs text-base-500">
                        Unlimited leads · 50 AI generations/day
                    </p>
                    {renewalDate && (
                        <p className="text-xs text-base-600">
                            Renews {renewalDate}
                        </p>
                    )}
                    <button
                        onClick={fetchSubscription}
                        className="text-xs text-base-600 hover:text-base-400 transition-colors"
                    >
                        Refresh status
                    </button>
                </div>
            ) : (
                <div className="bg-base-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-base-400">Free plan</p>
                        <span className="text-xs text-base-500">50 leads · 10 AI/day</span>
                    </div>
                    <button
                        onClick={() => setShowUpgrade(true)}
                        className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium py-2.5 rounded-lg transition-colors"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Upgrade to Pro — ₦3,500/month
                    </button>
                </div>
            )}

            <div className="pt-2 border-t border-base-800">
                <button
                    onClick={signOut}
                    className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>

            {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
        </div>
    );
}