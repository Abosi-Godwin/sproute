import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    Lead,
    ActivityLog,
    LeadStatus,
    OutreachFlowTab,
    FollowUpSequence,
    ChatMessage,
    DeadReason,
    OutreachStep
} from "../../types";
import { supabase } from "../supabase";
import { posthog } from "../posthog";
import { useSettingsStore } from "./useSettingsStore";
import { derivePainPoints } from "../../utils/painPoints";
import toast from "react-hot-toast";

const reportError = (
    event: string,
    error: { message?: string; code?: string },
    extra: Record<string, unknown> = {}
) => {
    posthog.capture(event, {
        message: error.message ?? "",
        code: error.code ?? "",
        ...extra
    });
};

interface LeadsStore {
    leads: Lead[];
    activity: ActivityLog[];
    isLoading: boolean;
    hasLoaded: boolean;
    fetchLeads: () => Promise<void>;
    fetchActivity: () => Promise<void>;
    saveLead: (lead: Lead) => Promise<boolean>;
    updateStatus: (id: string, status: LeadStatus) => Promise<void>;
    updateNotes: (id: string, notes: string) => Promise<void>;
    saveGeneratedMessage: (id: string, message: string) => Promise<void>;
    setFollowUpDate: (id: string, date: string) => Promise<void>;
    setWhatsappNumber: (id: string, number: string) => Promise<void>;
    setSelectedMessageAngle: (id: string, angle: string) => Promise<void>;
    setOutreachFlowTab: (id: string, tab: OutreachFlowTab) => Promise<void>;
    saveFollowUpSequence: (
        id: string,
        sequence: FollowUpSequence
    ) => Promise<void>;
    saveChatHistory: (id: string, history: ChatMessage[]) => Promise<void>;
    setDeadReason: (id: string, reason: DeadReason) => Promise<void>;
    setLastOutreachStep: (id: string, step: OutreachStep) => Promise<void>;
    deleteLead: (id: string) => Promise<void>;
    bulkDelete: (ids: string[]) => Promise<void>;
    logActivity: (
        entry: Omit<ActivityLog, "id" | "timestamp">
    ) => Promise<void>;
    reset: () => void;
}

export const useLeadsStore = create<LeadsStore>()(
    persist(
        (set, get) => ({
            leads: [],
            activity: [],
            isLoading: false,
            hasLoaded: false,

            fetchLeads: async () => {
                const {
                    data: { session }
                } = await supabase.auth.getSession();

                if (!session) {
                    set({ hasLoaded: true });
                    return;
                }

                const { data, error } = await supabase
                    .from("leads")
                    .select("*")
                    .order("saved_at", { ascending: false });

                if (error || !data) {
                    if (error) reportError("leads_fetch_failed", error);
                    set({ hasLoaded: true });
                    return;
                }

                const leads: Lead[] = data.map(r => ({
                    id: r.id,
                    name: r.name,
                    category: r.category,
                    address: r.address,
                    phone: r.phone,
                    website: r.website,
                    rating: r.rating,
                    reviews: r.reviews,
                    placeId: r.place_id,
                    status: r.status,
                    notes: r.notes,
                    location: r.location,
                    followUpDate: r.follow_up_date,
                    generatedMessage: r.generated_message,
                    selectedMessageAngle: r.selected_message_angle,
                    followUpSequence: r.follow_up_sequence,
                    whatsappNumber: r.whatsapp_number,
                    painPoints: r.pain_points,
                    outreachFlowTab: r.outreach_flow_tab ?? "no_reply",
                    deadReason: r.dead_reason,
                    lastOutreachStep: r.last_outreach_step,
                    chatHistory: r.chat_history ?? [],
                    savedAt: r.saved_at,
                    updatedAt: r.updated_at,
                    searchQuery: r.search_query,
                    searchLocation: r.search_location,
                    unclaimedListing: r.unclaimed_listing
                }));

                set({ leads, hasLoaded: true });
            },

            fetchActivity: async () => {
                const {
                    data: { session }
                } = await supabase.auth.getSession();
                if (!session) return;

                const { data, error } = await supabase
                    .from("activity")
                    .select("*")
                    .order("timestamp", { ascending: false })
                    .limit(50);

                if (!error && data) {
                    const activity: ActivityLog[] = data.map(r => ({
                        id: r.id,
                        leadId: r.lead_id,
                        leadName: r.lead_name,
                        message: r.message,
                        timestamp: r.timestamp
                    }));
                    set({ activity });
                }
            },

            saveLead: async lead => {
                const {
                    data: { user }
                } = await supabase.auth.getUser();

                if (!user) {
                    posthog.capture("lead_save_failed", {
                        message: "no_user",
                        place_id: lead.placeId
                    });
                    toast.error("Session expired. Sign in again");
                    return false;
                }

                const painPoints = derivePainPoints(lead);
                const leadWithDefaults = {
                    ...lead,
                    followUpDate: null,
                    painPoints,
                    outreachFlowTab: "no_reply" as OutreachFlowTab
                };

                const { error } = await supabase.from("leads").insert({
                    id: lead.id,
                    user_id: user.id,
                    name: lead.name,
                    category: lead.category,
                    address: lead.address,
                    phone: lead.phone ?? null,
                    website: lead.website ?? null,
                    rating: lead.rating ?? null,
                    reviews: lead.reviews ?? null,
                    place_id: lead.placeId,
                    status: lead.status,
                    notes: lead.notes ?? null,
                    location: lead.location,
                    follow_up_date: null,
                    generated_message: lead.generatedMessage ?? null,
                    dead_reason: null,
                    last_outreach_step: null,
                    saved_at: lead.savedAt,
                    updated_at: lead.updatedAt,
                    search_query: lead.searchQuery ?? null,
                    search_location: lead.searchLocation ?? null,
                    unclaimed_listing: lead.unclaimedListing ?? false,
                    whatsapp_number: lead.whatsappNumber ?? null,
                    pain_points: painPoints,
                    outreach_flow_tab: "no_reply"
                });

                if (error) {
                    reportError("lead_save_failed", error, {
                        place_id: lead.placeId
                    });
                    toast.error("Could not save lead. Try again");
                    return false;
                }

                set(state => ({ leads: [leadWithDefaults, ...state.leads] }));
                toast.success(`${lead.name} saved`);
                await get().logActivity({
                    leadId: lead.id,
                    leadName: lead.name,
                    message: `Saved ${lead.name}`
                });
                return true;
            },

            updateStatus: async (id, status) => {
                const autoTab: OutreachFlowTab = ["replied", "converted"].includes(
                    status
                )
                    ? "replied"
                    : "no_reply";

                let followUpDateStr: string | null = null;
                if (status === "messaged") {
                    const { followUpDays } = useSettingsStore.getState();
                    const followUpDate = new Date();
                    followUpDate.setDate(followUpDate.getDate() + followUpDays);
                    followUpDateStr = followUpDate.toISOString().split("T")[0];
                }

                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id
                            ? {
                                  ...l,
                                  status,
                                  outreachFlowTab: autoTab,
                                  updatedAt: new Date().toISOString(),
                                  ...(followUpDateStr
                                      ? { followUpDate: followUpDateStr }
                                      : {})
                              }
                            : l
                    )
                }));

                const updatePayload: Record<string, any> = {
                    status,
                    outreach_flow_tab: autoTab,
                    updated_at: new Date().toISOString()
                };
                if (followUpDateStr) updatePayload.follow_up_date = followUpDateStr;

                const { error } = await supabase
                    .from("leads")
                    .update(updatePayload)
                    .eq("id", id);

                if (error) {
                    reportError("lead_update_failed", error, { field: "status" });
                    await get().fetchLeads();
                    toast.error("Could not update status");
                    return;
                }

                posthog.capture("lead_status_changed", { lead_id: id, status });

                if (status === "messaged") {
                    useSettingsStore.getState().recordOutreachActivity();
                }

                const lead = get().leads.find(l => l.id === id);
                if (lead) {
                    await get().logActivity({
                        leadId: id,
                        leadName: lead.name,
                        message: `Marked ${lead.name} as ${status.replace(
                            /_/g,
                            " "
                        )}`
                    });
                }
            },

            updateNotes: async (id, notes) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id
                            ? { ...l, notes, updatedAt: new Date().toISOString() }
                            : l
                    )
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({ notes, updated_at: new Date().toISOString() })
                    .eq("id", id);

                if (error) {
                    reportError("lead_update_failed", error, { field: "notes" });
                    await get().fetchLeads();
                    toast.error("Could not save notes");
                }
            },

            saveGeneratedMessage: async (id, message) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id ? { ...l, generatedMessage: message } : l
                    )
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({ generated_message: message })
                    .eq("id", id);

                if (error) {
                    reportError("lead_update_failed", error, {
                        field: "generated_message"
                    });
                    await get().fetchLeads();
                }
            },

            saveFollowUpSequence: async (id, sequence) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id ? { ...l, followUpSequence: sequence } : l
                    )
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({ follow_up_sequence: sequence })
                    .eq("id", id);

                if (error) {
                    reportError("lead_update_failed", error, {
                        field: "follow_up_sequence"
                    });
                }
            },

            setFollowUpDate: async (id, date) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id ? { ...l, followUpDate: date } : l
                    )
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({ follow_up_date: date })
                    .eq("id", id);

                if (!error) {
                    toast.success("Follow-up date set");
                } else {
                    reportError("lead_update_failed", error, {
                        field: "follow_up_date"
                    });
                    await get().fetchLeads();
                    toast.error("Could not set follow-up date");
                }
            },

            setWhatsappNumber: async (id, number) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id ? { ...l, whatsappNumber: number } : l
                    )
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({ whatsapp_number: number })
                    .eq("id", id);

                if (!error) {
                    toast.success("WhatsApp number saved");
                } else {
                    reportError("lead_update_failed", error, {
                        field: "whatsapp_number"
                    });
                    await get().fetchLeads();
                    toast.error("Could not save number");
                }
            },

            setSelectedMessageAngle: async (id, angle) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id
                            ? { ...l, selectedMessageAngle: angle as any }
                            : l
                    )
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({ selected_message_angle: angle })
                    .eq("id", id);

                if (error) {
                    reportError("lead_update_failed", error, {
                        field: "selected_message_angle"
                    });
                }
            },

            setOutreachFlowTab: async (id, tab) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id ? { ...l, outreachFlowTab: tab } : l
                    )
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({ outreach_flow_tab: tab })
                    .eq("id", id);

                if (error) {
                    reportError("lead_update_failed", error, {
                        field: "outreach_flow_tab"
                    });
                }
            },

            saveChatHistory: async (id, history) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id ? { ...l, chatHistory: history } : l
                    )
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({ chat_history: history })
                    .eq("id", id);

                if (error) {
                    reportError("lead_update_failed", error, {
                        field: "chat_history"
                    });
                }
            },

            setDeadReason: async (id, reason) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id ? { ...l, deadReason: reason } : l
                    )
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({ dead_reason: reason })
                    .eq("id", id);

                if (error) {
                    reportError("lead_update_failed", error, {
                        field: "dead_reason"
                    });
                }
            },

            setLastOutreachStep: async (id, step) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id ? { ...l, lastOutreachStep: step } : l
                    )
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({ last_outreach_step: step })
                    .eq("id", id);

                if (error) {
                    reportError("lead_update_failed", error, {
                        field: "last_outreach_step"
                    });
                }
            },

            deleteLead: async id => {
                set(state => ({
                    leads: state.leads.filter(l => l.id !== id)
                }));

                const { error } = await supabase
                    .from("leads")
                    .delete()
                    .eq("id", id);

                if (!error) {
                    toast.success("Lead deleted");
                } else {
                    reportError("lead_delete_failed", error);
                    await get().fetchLeads();
                    toast.error("Could not delete lead");
                }
            },

            bulkDelete: async ids => {
                set(state => ({
                    leads: state.leads.filter(l => !ids.includes(l.id))
                }));

                const { error } = await supabase
                    .from("leads")
                    .delete()
                    .in("id", ids);

                if (!error) {
                    toast.success(
                        `${ids.length} lead${ids.length > 1 ? "s" : ""} deleted`
                    );
                } else {
                    reportError("lead_delete_failed", error, {
                        count: ids.length
                    });
                    await get().fetchLeads();
                    toast.error("Could not delete leads");
                }
            },

            logActivity: async entry => {
                const {
                    data: { user }
                } = await supabase.auth.getUser();
                if (!user) return;

                const log: ActivityLog = {
                    ...entry,
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString()
                };

                set(state => ({ activity: [log, ...state.activity] }));

                const { error } = await supabase.from("activity").insert({
                    id: log.id,
                    user_id: user.id,
                    lead_id: log.leadId,
                    lead_name: log.leadName,
                    message: log.message,
                    timestamp: log.timestamp
                });

                if (error) {
                    reportError("activity_log_failed", error);
                    set(state => ({
                        activity: state.activity.filter(a => a.id !== log.id)
                    }));
                }
            },

            reset: () => set({ leads: [], activity: [], hasLoaded: false })
        }),
        {
            name: "sproute-leads-cache",
            partialize: state => ({
                leads: state.leads,
                activity: state.activity
            })
        }
    )
);