import { useState } from "react";
import { clsx } from "clsx";
import {
    Trash2,
    Download,
    Upload,
    MapPin,
    MessageSquare,
    Database,
    Loader2,
    User,
    LogOut,
    Sparkles,
    ExternalLink
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../lib/stores/useAuthStore";
import { useSettingsStore, OutreachTone } from "../lib/stores/useSettingsStore";
import { useLeadsStore } from "../lib/stores/useLeadsStore";
import { useSubscriptionStore } from "../lib/stores/useSubscriptionStore";
import {
    FREE_AI_LIMIT,
    FREE_LEADS_LIMIT,
    PRO_AI_LIMIT
} from "../lib/stores/useUsageStore";
import { posthog } from "../lib/posthog";
import UpgradeModal from "../components/ui/UpgradeModal";
import toast from "react-hot-toast";

const LOCATIONS = ["Asaba", "Lagos", "Port Harcourt", "Abuja", "Enugu"];

const TONES: { value: OutreachTone; label: string; description: string }[] = [
    {
        value: "casual",
        label: "Casual",
        description: "Warm, conversational Nigerian English"
    },
    {
        value: "formal",
        label: "Formal",
        description: "Professional but approachable"
    },
    {
        value: "pidgin",
        label: "Pidgin",
        description: "Natural Nigerian Pidgin English"
    }
];

const PAGE_SIZE = 1000;
const BATCH_SIZE = 100;
const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

const formatDate = (value: string | number | Date) =>
    new Date(value).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

const normalizeUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const isRecord = (value: unknown): value is Record<string, any> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const fetchAllRows = async (table: "leads" | "activity") => {
    const rows: any[] = [];

    for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await supabase
            .from(table)
            .select("*")
            .order("id", { ascending: true })
            .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;

        rows.push(...(data ?? []));
        if (!data || data.length < PAGE_SIZE) break;
    }

    return rows;
};

function SectionHeader({
    icon: Icon,
    title
}: {
    icon: React.ElementType;
    title: string;
}) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <Icon className="w-4 h-4 text-brand-400" />
            <h2 className="font-display font-semibold text-base-100">{title}</h2>
        </div>
    );
}

function AccountCard() {
    const { user, signOut } = useAuthStore();
    const { currentPeriodEnd, hasSubscription, fetchSubscription, isPro } =
        useSubscriptionStore();
    const {
        serviceDescription,
        setServiceDescription,
        portfolioUrl,
        setPortfolioUrl
    } = useSettingsStore();

    const [showUpgrade, setShowUpgrade] = useState(false);
    const [isOpeningManage, setIsOpeningManage] = useState(false);
    const [service, setService] = useState(serviceDescription);
    const [portfolio, setPortfolio] = useState(portfolioUrl);

    const pro = isPro();
    const recurring = Boolean(
        (import.meta.env.VITE_PAYSTACK_PLAN_CODE as string | undefined)?.trim()
    );
    const endDate = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
    const lapsed = !pro && endDate !== null && endDate.getTime() < Date.now();

    const handleManage = async () => {
        if (isOpeningManage) return;
        setIsOpeningManage(true);

        const popup = window.open("", "_blank");

        try {
            const {
                data: { session }
            } = await supabase.auth.getSession();

            if (!session) {
                popup?.close();
                toast.error("Please sign in again");
                return;
            }

            const res = await fetch("/api/paystack-manage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`
                }
            });
            const data = await res.json().catch(() => null);

            if (!res.ok || typeof data?.link !== "string") {
                popup?.close();
                toast.error(
                    data?.message ?? "Could not open subscription settings"
                );
                return;
            }

            posthog.capture("subscription_manage_opened");

            if (popup) {
                popup.opener = null;
                popup.location.href = data.link;
            } else {
                window.location.assign(data.link);
            }
        } catch {
            popup?.close();
            toast.error("Could not open subscription settings");
        } finally {
            setIsOpeningManage(false);
        }
    };

    return (
        <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-brand-400" />
                <h2 className="font-display font-semibold text-base-100">Account</h2>
            </div>

            <div className="space-y-1">
                <p className="text-sm text-base-100">{user?.email}</p>
                <p className="text-xs text-base-500">
                    Member since{" "}
                    {user?.created_at ? formatDate(user.created_at) : "..."}
                </p>
            </div>

            {pro ? (
                <div className="bg-brand-500/5 border border-brand-500/10 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                            <p className="text-xs font-semibold text-brand-400">
                                Sproute Pro
                            </p>
                        </div>
                        <span className="text-xs text-base-500">Active</span>
                    </div>
                    <p className="text-xs text-base-500">
                        Unlimited leads · {PRO_AI_LIMIT} AI generations/day
                    </p>
                    {endDate && (
                        <p className="text-xs text-base-600">
                            Pro until {formatDate(endDate)}
                            {hasSubscription &&
                                ". Renews automatically unless cancelled."}
                        </p>
                    )}
                    <div className="flex items-center gap-4 pt-1">
                        {hasSubscription && (
                            <button
                                onClick={handleManage}
                                disabled={isOpeningManage}
                                className="flex items-center gap-1.5 text-xs font-medium text-brand-400 hover:text-brand-300 disabled:opacity-50 transition-colors"
                            >
                                {isOpeningManage ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <ExternalLink className="w-3 h-3" />
                                )}
                                Manage or cancel
                            </button>
                        )}
                        <button
                            onClick={fetchSubscription}
                            className="text-xs text-base-600 hover:text-base-400 transition-colors"
                        >
                            Refresh status
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-base-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-base-400">Free plan</p>
                        <span className="text-xs text-base-500">
                            {FREE_LEADS_LIMIT} leads · {FREE_AI_LIMIT} AI/day
                        </span>
                    </div>
                    {lapsed && endDate && (
                        <p className="text-xs text-base-500">
                            Your Pro plan ended on {formatDate(endDate)}.
                        </p>
                    )}
                    <button
                        onClick={() => setShowUpgrade(true)}
                        className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium py-2.5 rounded-lg transition-colors"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Upgrade to Pro: ₦3,500 {recurring ? "per month" : "for 30 days"}
                    </button>
                </div>
            )}

            <div className="border-t border-base-800 pt-4 space-y-2">
                <p className="text-sm font-medium text-base-100">Your Service</p>
                <p className="text-xs text-base-500">
                    Used to personalise your AI-generated outreach messages.
                </p>
                <input
                    type="text"
                    value={service}
                    onChange={e => setService(e.target.value)}
                    placeholder="e.g. Web development, Photography..."
                    className="w-full bg-base-800 border border-base-700 rounded-lg px-4 py-2.5 text-sm text-base-100 placeholder:text-base-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
                <button
                    onClick={() => {
                        const clean = service.trim();
                        setServiceDescription(clean);
                        setService(clean);
                        toast.success("Service saved");
                    }}
                    className="w-full py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
                >
                    Save Service
                </button>
            </div>

            <div className="border-t border-base-800 pt-4 space-y-2">
                <p className="text-sm font-medium text-base-100">Portfolio URL</p>
                <p className="text-xs text-base-500">
                    Included automatically when you send a "Show example" reply.
                </p>
                <input
                    type="url"
                    value={portfolio}
                    onChange={e => setPortfolio(e.target.value)}
                    placeholder="https://yourportfolio.com"
                    className="w-full bg-base-800 border border-base-700 rounded-lg px-4 py-2.5 text-sm text-base-100 placeholder:text-base-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
                <button
                    onClick={() => {
                        const clean = normalizeUrl(portfolio);
                        setPortfolioUrl(clean);
                        setPortfolio(clean);
                        toast.success("Portfolio saved");
                    }}
                    className="w-full py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
                >
                    Save Portfolio
                </button>
            </div>

            <div className="border-t border-base-800 pt-4">
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

export default function Settings() {
    const { user } = useAuthStore();
    const { isPro } = useSubscriptionStore();
    const {
        defaultLocation,
        outreachTone,
        followUpDays,
        dailyGoal,
        setDefaultLocation,
        setOutreachTone,
        setFollowUpDays,
        setDailyGoal
    } = useSettingsStore();

    const { leads, activity, fetchLeads, fetchActivity } = useLeadsStore();

    const [clearConfirm, setClearConfirm] = useState<"leads" | "activity" | null>(
        null
    );
    const [importError, setImportError] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    const pro = isPro();

    const handleExport = async () => {
        if (isExporting) return;
        setIsExporting(true);

        try {
            const [leadsData, activityData] = await Promise.all([
                fetchAllRows("leads"),
                fetchAllRows("activity")
            ]);

            const backup = {
                leads: leadsData,
                activity: activityData,
                exportedAt: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(backup, null, 2)], {
                type: "application/json"
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `sproute-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);

            posthog.capture("backup_exported", {
                leads: leadsData.length,
                activity: activityData.length
            });
            toast.success("Backup exported");
        } catch (err: any) {
            posthog.capture("backup_export_failed", {
                message: err?.message ?? ""
            });
            toast.error("Export failed. Try again");
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const file = input.files?.[0];
        input.value = "";

        if (!file || isImporting) return;

        setImportError("");

        if (file.size > MAX_BACKUP_BYTES) {
            setImportError("That file is too large to be a Sproute backup.");
            return;
        }

        setIsImporting(true);
        let importedLeads = 0;

        try {
            let data: any;
            try {
                data = JSON.parse(await file.text());
            } catch {
                setImportError(
                    "Could not read file. Make sure it is a valid JSON backup."
                );
                return;
            }

            if (!isRecord(data) || !Array.isArray(data.leads)) {
                setImportError(
                    "Invalid backup file. Make sure it was exported from Sproute."
                );
                return;
            }

            if (!user) {
                toast.error("Please sign in again to import");
                return;
            }

            const incoming = data.leads.filter(
                (row: any) =>
                    isRecord(row) &&
                    typeof row.id === "string" &&
                    typeof row.name === "string"
            );

            if (incoming.length === 0) {
                setImportError("No leads found in that file.");
                return;
            }

            const existingIds = new Set(leads.map(l => l.id));
            const known = incoming.filter((row: any) => existingIds.has(row.id));
            const fresh = incoming.filter((row: any) => !existingIds.has(row.id));
            const room = pro
                ? fresh.length
                : Math.max(0, FREE_LEADS_LIMIT - leads.length);
            const addedFresh = fresh.slice(0, room);
            const accepted = [...known, ...addedFresh];
            const skipped = fresh.length - addedFresh.length;

            if (accepted.length === 0) {
                toast.error(
                    `Your free plan holds ${FREE_LEADS_LIMIT} leads. Upgrade to Pro to import more.`
                );
                return;
            }

            const leadRows = accepted.map((row: any) => ({
                ...row,
                user_id: user.id
            }));

            for (let i = 0; i < leadRows.length; i += BATCH_SIZE) {
                const batch = leadRows.slice(i, i + BATCH_SIZE);
                const { error } = await supabase.from("leads").upsert(batch);
                if (error) throw error;
                importedLeads += batch.length;
            }

            const availableLeadIds = new Set([
                ...existingIds,
                ...accepted.map((row: any) => row.id)
            ]);

            const activityRows = Array.isArray(data.activity)
                ? data.activity
                      .filter(
                          (row: any) =>
                              isRecord(row) &&
                              typeof row.id === "string" &&
                              (!row.lead_id || availableLeadIds.has(row.lead_id))
                      )
                      .map((row: any) => ({ ...row, user_id: user.id }))
                : [];

            for (let i = 0; i < activityRows.length; i += BATCH_SIZE) {
                const batch = activityRows.slice(i, i + BATCH_SIZE);
                const { error } = await supabase.from("activity").upsert(batch);
                if (error) throw error;
            }

            await fetchLeads();
            await fetchActivity();

            posthog.capture("backup_imported", {
                leads: importedLeads,
                skipped
            });

            if (skipped > 0) {
                toast(
                    `${importedLeads} leads imported. ${skipped} skipped because the free plan holds ${FREE_LEADS_LIMIT} leads.`,
                    { duration: 8000 }
                );
            } else {
                toast.success(`${importedLeads} leads imported`);
            }
        } catch (err: any) {
            posthog.capture("backup_import_failed", {
                imported: importedLeads,
                message: err?.message ?? ""
            });
            setImportError(
                importedLeads > 0
                    ? `Import stopped after ${importedLeads} leads. Run the same file again to finish.`
                    : "Import failed. Check the file and try again."
            );
            toast.error("Import failed");

            if (importedLeads > 0) {
                await fetchLeads();
                await fetchActivity();
            }
        } finally {
            setIsImporting(false);
        }
    };

    const handleClearLeads = async () => {
        if (!user || isClearing) return;
        setIsClearing(true);

        const { error } = await supabase
            .from("leads")
            .delete()
            .eq("user_id", user.id);

        if (!error) {
            await fetchLeads();
            await fetchActivity();
            posthog.capture("leads_cleared");
            toast.success("All leads cleared");
        } else {
            toast.error("Couldn't clear leads");
        }

        setIsClearing(false);
        setClearConfirm(null);
    };

    const handleClearActivity = async () => {
        if (!user || isClearing) return;
        setIsClearing(true);

        const { error } = await supabase
            .from("activity")
            .delete()
            .eq("user_id", user.id);

        if (!error) {
            await fetchActivity();
            posthog.capture("activity_cleared");
            toast.success("Activity cleared");
        } else {
            toast.error("Couldn't clear activity");
        }

        setIsClearing(false);
        setClearConfirm(null);
    };

    return (
        <div className="p-6 space-y-6 max-w-xl pb-24">
            <div>
                <h1 className="font-display text-2xl font-bold text-base-50">
                    Settings
                </h1>
                <p className="text-sm text-base-400 mt-1">
                    Manage your preferences and data
                </p>
            </div>

            <div className="bg-base-900 border border-base-800 rounded-xl p-5">
                <SectionHeader icon={MapPin} title="Search Preferences" />
                <div className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-sm text-base-100">Default Location</p>
                        <p className="text-xs text-base-500">
                            Pre-selected every time you open the Search page.
                        </p>
                        <select
                            value={defaultLocation}
                            onChange={e => setDefaultLocation(e.target.value)}
                            className="w-full bg-base-800 border border-base-700 rounded-lg px-4 py-2.5 text-sm text-base-100 focus:outline-none focus:border-brand-500 transition-colors"
                        >
                            <option value="">No default</option>
                            {LOCATIONS.map(loc => (
                                <option key={loc} value={loc}>
                                    {loc}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-base-800">
                        <p className="text-sm text-base-100">Default Follow-up Days</p>
                        <p className="text-xs text-base-500">
                            Auto-set the follow-up date this many days after you
                            mark a lead as messaged.
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                            {[1, 2, 3, 5, 7, 14].map(day => (
                                <button
                                    key={day}
                                    onClick={() => setFollowUpDays(day)}
                                    className={clsx(
                                        "text-xs px-3 py-1.5 rounded-lg transition-colors",
                                        followUpDays === day
                                            ? "bg-brand-500/10 text-brand-400"
                                            : "bg-base-800 text-base-500 hover:text-base-300"
                                    )}
                                >
                                    {day}d
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-base-800">
                        <p className="text-sm text-base-100">Daily Outreach Goal</p>
                        <p className="text-xs text-base-500">
                            Number of businesses to message per day.
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                            {[5, 10, 15, 20, 30, 50].map(goal => (
                                <button
                                    key={goal}
                                    onClick={() => setDailyGoal(goal)}
                                    className={clsx(
                                        "text-xs px-3 py-1.5 rounded-lg transition-colors",
                                        dailyGoal === goal
                                            ? "bg-brand-500/10 text-brand-400"
                                            : "bg-base-800 text-base-500 hover:text-base-300"
                                    )}
                                >
                                    {goal}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-base-900 border border-base-800 rounded-xl p-5">
                <SectionHeader icon={MessageSquare} title="Outreach Tone" />
                <p className="text-xs text-base-500 mb-4">
                    Controls how the message generator writes your WhatsApp
                    outreach.
                </p>
                <div className="flex flex-col gap-2">
                    {TONES.map(tone => (
                        <button
                            key={tone.value}
                            onClick={() => setOutreachTone(tone.value)}
                            className={clsx(
                                "flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left",
                                outreachTone === tone.value
                                    ? "border-brand-500/50 bg-brand-500/5"
                                    : "border-base-800 hover:border-base-700"
                            )}
                        >
                            <div>
                                <p
                                    className={clsx(
                                        "text-sm font-medium",
                                        outreachTone === tone.value
                                            ? "text-brand-400"
                                            : "text-base-200"
                                    )}
                                >
                                    {tone.label}
                                </p>
                                <p className="text-xs text-base-500 mt-0.5">
                                    {tone.description}
                                </p>
                            </div>
                            {outreachTone === tone.value && (
                                <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-base-900 border border-base-800 rounded-xl p-5">
                <SectionHeader icon={Database} title="Data Management" />
                <div className="space-y-4">
                    <div className="flex items-center gap-4 py-3 border-b border-base-800">
                        <div className="text-center">
                            <p className="font-display font-bold text-xl text-base-50">
                                {leads.length}
                            </p>
                            <p className="text-xs text-base-500">Leads</p>
                        </div>
                        <div className="w-px h-8 bg-base-800" />
                        <div className="text-center">
                            <p className="font-display font-bold text-xl text-base-50">
                                {activity.length}
                            </p>
                            <p className="text-xs text-base-500">Activities</p>
                        </div>
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-base-800 hover:bg-base-700 disabled:opacity-50 transition-colors"
                    >
                        {isExporting ? (
                            <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4 text-brand-400" />
                        )}
                        <div className="text-left">
                            <p className="text-sm font-medium text-base-100">
                                {isExporting ? "Exporting..." : "Export Backup"}
                            </p>
                            <p className="text-xs text-base-500">
                                Download all leads and activity as JSON
                            </p>
                        </div>
                    </button>

                    <label
                        className={clsx(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-base-800 hover:bg-base-700 transition-colors cursor-pointer",
                            isImporting && "opacity-50 pointer-events-none"
                        )}
                    >
                        {isImporting ? (
                            <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4 text-brand-400" />
                        )}
                        <div className="text-left">
                            <p className="text-sm font-medium text-base-100">
                                {isImporting ? "Importing..." : "Import Backup"}
                            </p>
                            <p className="text-xs text-base-500">
                                Restore leads from a JSON backup file
                            </p>
                        </div>
                        <input
                            type="file"
                            accept=".json,application/json"
                            onChange={handleImport}
                            className="hidden"
                        />
                    </label>
                    {importError && (
                        <p className="text-xs text-red-400">{importError}</p>
                    )}

                    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-base-800">
                        <div>
                            <p className="text-sm font-medium text-base-100">
                                Clear All Leads
                            </p>
                            <p className="text-xs text-base-500">
                                Permanently delete all saved leads
                            </p>
                        </div>
                        {clearConfirm === "leads" ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-red-400">Sure?</span>
                                <button
                                    onClick={handleClearLeads}
                                    disabled={isClearing}
                                    className="text-xs font-medium px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                                >
                                    {isClearing ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        "Yes"
                                    )}
                                </button>
                                <button
                                    onClick={() => setClearConfirm(null)}
                                    className="text-xs font-medium px-2 py-1 rounded-lg bg-base-800 text-base-400 hover:text-base-100 transition-colors"
                                >
                                    No
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setClearConfirm("leads")}
                                className="p-2 rounded-lg text-base-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-base-800">
                        <div>
                            <p className="text-sm font-medium text-base-100">
                                Clear Activity Log
                            </p>
                            <p className="text-xs text-base-500">
                                Remove all activity history
                            </p>
                        </div>
                        {clearConfirm === "activity" ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-red-400">Sure?</span>
                                <button
                                    onClick={handleClearActivity}
                                    disabled={isClearing}
                                    className="text-xs font-medium px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                                >
                                    {isClearing ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        "Yes"
                                    )}
                                </button>
                                <button
                                    onClick={() => setClearConfirm(null)}
                                    className="text-xs font-medium px-2 py-1 rounded-lg bg-base-800 text-base-400 hover:text-base-100 transition-colors"
                                >
                                    No
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setClearConfirm("activity")}
                                className="p-2 rounded-lg text-base-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-base-900 border border-base-800 rounded-xl p-5">
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-base-100">Sproute</p>
                    <p className="text-xs text-base-500">
                        v0.0.1. AI-powered WhatsApp outreach for local business
                        prospecting
                    </p>
                </div>
            </div>

            <AccountCard />
        </div>
    );
}