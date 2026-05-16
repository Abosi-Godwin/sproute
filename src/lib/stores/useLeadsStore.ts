import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Lead, ActivityLog, LeadStatus } from "../../types";
import { supabase } from "../supabase";
import { useSettingsStore } from "./useSettingsStore";

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
    deleteLead: (id: string) => Promise<void>;
    bulkDelete: (ids: string[]) => Promise<void>;
    logActivity: (
        entry: Omit<ActivityLog, "id" | "timestamp">
    ) => Promise<void>;
}

export const useLeadsStore = create<LeadsStore>()(
    persist(
        (set, get) => ({
            leads: [],
            activity: [],
            isLoading: false,

            fetchLeads: async () => {
                const {
                    data: { session }
                } = await supabase.auth.getSession();
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
                        savedAt: r.saved_at,
                        updatedAt: r.updated_at,
                        searchQuery: r.search_query,
                        searchLocation: r.search_location
                    }));
                    set({ leads });
                }
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
                if (!user) return;

                const { followUpDays } = useSettingsStore.getState();
                const followUpDate = new Date();
                followUpDate.setDate(followUpDate.getDate() + followUpDays);
                const followUpDateStr = followUpDate
                    .toISOString()
                    .split("T")[0];
                const leadWithFollowUp = {
                    ...lead,
                    followUpDate: followUpDateStr
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
                    search_location: lead.searchLocation ?? null
                });

                if (!error) {
                    set(state => ({
                        leads: [leadWithFollowUp, ...state.leads]
                    }));
                    await get().logActivity({
                        leadId: lead.id,
                        leadName: lead.name,
                        message: `Saved ${lead.name}`
                    });
                }
            },

            updateStatus: async (id, status) => {
                // Optimistic update first
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id
                            ? {
                                  ...l,
                                  status,
                                  updatedAt: new Date().toISOString()
                              }
                            : l
                    )
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({ status, updated_at: new Date().toISOString() })
                    .eq("id", id);

                if (error) {
                    // Revert on failure
                    await get().fetchLeads();
                    return;
                }

                const lead = get().leads.find(l => l.id === id);
                if (lead) {
                    await get().logActivity({
                        leadId: id,
                        leadName: lead.name,
                        message: `Marked ${lead.name} as ${status.replace(/_/g, " ")}`
                    });
                }
            },

            updateNotes: async (id, notes) => {
                // Optimistic update first
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id
                            ? {
                                  ...l,
                                  notes,
                                  updatedAt: new Date().toISOString()
                              }
                            : l
                    )
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({ notes, updated_at: new Date().toISOString() })
                    .eq("id", id);

                if (error) {
                    await get().fetchLeads();
                }
            },

            saveGeneratedMessage: async (id, message) => {
                // Optimistic update first
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
                    await get().fetchLeads();
                }
            },

            setFollowUpDate: async (id, date) => {
                // Optimistic update first
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id ? { ...l, followUpDate: date } : l
                    )
                }));

                const { error } = await supabase
                    .from("leads")
                    .update({ follow_up_date: date })
                    .eq("id", id);

                if (error) {
                    await get().fetchLeads();
                }
            },

            deleteLead: async id => {
                // Optimistic update first
                set(state => ({
                    leads: state.leads.filter(l => l.id !== id)
                }));

                const { error } = await supabase
                    .from("leads")
                    .delete()
                    .eq("id", id);

                if (error) {
                    await get().fetchLeads();
                }
            },

            bulkDelete: async ids => {
                // Optimistic update first
                set(state => ({
                    leads: state.leads.filter(l => !ids.includes(l.id))
                }));

                const { error } = await supabase
                    .from("leads")
                    .delete()
                    .in("id", ids);

                if (error) {
                    await get().fetchLeads();
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

                // Optimistic update first
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
                  
                    set(state => ({
                        activity: state.activity.filter(a => a.id !== log.id)
                    }));
                }
            }
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
