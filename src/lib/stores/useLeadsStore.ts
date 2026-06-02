import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Lead, ActivityLog, LeadStatus, OutreachFlowTab } from "../../types";
import { supabase } from "../supabase";
import { useSettingsStore } from "./useSettingsStore";
import { derivePainPoints } from "../../utils/painPoints";
import toast from "react-hot-toast";

interface LeadsStore {
    leads: Lead[];
    activity: ActivityLog[];
    isLoading: boolean;
    fetchLeads: () => Promise<void>;
    fetchActivity: () => Promise<void>;
    saveLead: (lead: Lead) => Promise<void>;
    updateStatus: (id: string, status: LeadStatus) => Promise<void>;
    updateNotes: (id: string, notes: string) => Promise<void>;
    saveGeneratedMessage: (id: string, message: string) => Promise<void>;
    setFollowUpDate: (id: string, date: string) => Promise<void>;
    setWhatsappNumber: (id: string, number: string) => Promise<void>;
    setSelectedMessageAngle: (id: string, angle: string) => Promise<void>;
    setOutreachFlowTab: (id: string, tab: OutreachFlowTab) => Promise<void>;
    deleteLead: (id: string) => Promise<void>;
    bulkDelete: (ids: string[]) => Promise<void>;
    logActivity: (entry: Omit<ActivityLog, "id" | "timestamp">) => Promise<void>;
}

export const useLeadsStore = create<LeadsStore>()(
    persist(
        (set, get) => ({
            leads: [],
            activity: [],
            isLoading: false,

            fetchLeads: async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const { data, error } = await supabase
                    .from("leads")
                    .select("*")
                    .order("saved_at", { ascending: false });

                if (!error && data) {
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
                        whatsappNumber: r.whatsapp_number,
                        painPoints: r.pain_points,
                        outreachFlowTab: r.outreach_flow_tab ?? 'no_reply',
                        savedAt: r.saved_at,
                        updatedAt: r.updated_at,
                        searchQuery: r.search_query,
                        searchLocation: r.search_location,
                        unclaimedListing: r.unclaimed_listing,
                    }));
                    set({ leads });
                }
            },

            fetchActivity: async () => {
                const { data: { session } } = await supabase.auth.getSession();
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
                        timestamp: r.timestamp,
                    }));
                    set({ activity });
                }
            },

            saveLead: async (lead) => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { followUpDays } = useSettingsStore.getState();
                const followUpDate = new Date();
                followUpDate.setDate(followUpDate.getDate() + followUpDays);
                const followUpDateStr = followUpDate.toISOString().split("T")[0];

                // Auto-derive pain points
                const painPoints = derivePainPoints(lead);
                const leadWithFollowUp = {
                    ...lead,
                    followUpDate: followUpDateStr,
                    painPoints,
                    outreachFlowTab: 'no_reply' as OutreachFlowTab,
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
                    follow_up_date: followUpDateStr,
                    generated_message: lead.generatedMessage ?? null,
                    saved_at: lead.savedAt,
                    updated_at: lead.updatedAt,
                    search_query: lead.searchQuery ?? null,
                    search_location: lead.searchLocation ?? null,
                    unclaimed_listing: lead.unclaimedListing ?? false,
                    whatsapp_number: lead.whatsappNumber ?? null,
                    pain_points: painPoints,
                    outreach_flow_tab: 'no_reply',
                });

                if (!error) {
                    set(state => ({ leads: [leadWithFollowUp, ...state.leads] }));
                    toast.success(`${lead.name} saved`);
                    await get().logActivity({
                        leadId: lead.id,
                        leadName: lead.name,
                        message: `Saved ${lead.name}`,
                    });
                } else {
                    toast.error("Could not save lead — try again");
                }
            },

            updateStatus: async (id, status) => {
                // Auto-switch outreach flow tab based on status
                const autoTab: OutreachFlowTab =
                    ['replied', 'converted'].includes(status)
                        ? 'replied'
                        : 'no_reply';

                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id
                            ? {
                                ...l,
                                status,
                                outreachFlowTab: autoTab,
                                updatedAt: new Date().toISOString(),
                            }
                            : l
                    ),
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({
                        status,
                        outreach_flow_tab: autoTab,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", id);

                if (error) {
                    await get().fetchLeads();
                    toast.error("Could not update status");
                    return;
                }

                if (status === "messaged") {
                    useSettingsStore.getState().recordOutreachActivity();
                }

                const lead = get().leads.find(l => l.id === id);
                if (lead) {
                    await get().logActivity({
                        leadId: id,
                        leadName: lead.name,
                        message: `Marked ${lead.name} as ${status.replace(/_/g, " ")}`,
                    });
                }
            },

            updateNotes: async (id, notes) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id
                            ? { ...l, notes, updatedAt: new Date().toISOString() }
                            : l
                    ),
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({ notes, updated_at: new Date().toISOString() })
                    .eq("id", id);

                if (error) {
                    await get().fetchLeads();
                    toast.error("Could not save notes");
                }
            },

            saveGeneratedMessage: async (id, message) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id ? { ...l, generatedMessage: message } : l
                    ),
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({ generated_message: message })
                    .eq("id", id);

                if (error) await get().fetchLeads();
            },

            setFollowUpDate: async (id, date) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id ? { ...l, followUpDate: date } : l
                    ),
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({ follow_up_date: date })
                    .eq("id", id);

                if (!error) {
                    toast.success("Follow-up date set");
                } else {
                    await get().fetchLeads();
                    toast.error("Could not set follow-up date");
                }
            },

            setWhatsappNumber: async (id, number) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id ? { ...l, whatsappNumber: number } : l
                    ),
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({ whatsapp_number: number })
                    .eq("id", id);

                if (!error) {
                    toast.success("WhatsApp number saved");
                } else {
                    await get().fetchLeads();
                    toast.error("Could not save number");
                }
            },

            setSelectedMessageAngle: async (id, angle) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id ? { ...l, selectedMessageAngle: angle as any } : l
                    ),
                }));

                await supabase
                    .from("leads")
                    .update({ selected_message_angle: angle })
                    .eq("id", id);
            },

            setOutreachFlowTab: async (id, tab) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id ? { ...l, outreachFlowTab: tab } : l
                    ),
                }));

                await supabase
                    .from("leads")
                    .update({ outreach_flow_tab: tab })
                    .eq("id", id);
            },

            deleteLead: async (id) => {
                set(state => ({
                    leads: state.leads.filter(l => l.id !== id),
                }));

                const { error } = await supabase
                    .from("leads")
                    .delete()
                    .eq("id", id);

                if (!error) {
                    toast.success("Lead deleted");
                } else {
                    await get().fetchLeads();
                    toast.error("Could not delete lead");
                }
            },

            bulkDelete: async (ids) => {
                set(state => ({
                    leads: state.leads.filter(l => !ids.includes(l.id)),
                }));

                const { error } = await supabase
                    .from("leads")
                    .delete()
                    .in("id", ids);

                if (!error) {
                    toast.success(`${ids.length} lead${ids.length > 1 ? 's' : ''} deleted`);
                } else {
                    await get().fetchLeads();
                    toast.error("Could not delete leads");
                }
            },

            logActivity: async (entry) => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const log: ActivityLog = {
                    ...entry,
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                };

                set(state => ({ activity: [log, ...state.activity] }));

                const { error } = await supabase.from("activity").insert({
                    id: log.id,
                    user_id: user.id,
                    lead_id: log.leadId,
                    lead_name: log.leadName,
                    message: log.message,
                    timestamp: log.timestamp,
                });

                if (error) {
                    set(state => ({
                        activity: state.activity.filter(a => a.id !== log.id),
                    }));
                }
            },
        }),
        {
            name: "sproute-leads-cache",
            partialize: state => ({
                leads: state.leads,
                activity: state.activity,
            }),
        }
    )
);