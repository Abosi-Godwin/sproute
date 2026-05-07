import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Lead, ActivityLog, LeadStatus } from "../../types";


interface LeadsStore {
    leads: Lead[];
    activity: ActivityLog[];
    saveLead: (lead: Lead) => void;
    updateStatus: (id: string, status: LeadStatus) => void;
    updateNotes: (id: string, notes: string) => void;
    saveGeneratedMessage: (id: string, message: string) => void;
    deleteLead: (id: string) => void;
    logActivity: (entry: Omit<ActivityLog, "id" | "timestamp">) => void;
    setFollowUpDate: (id: string, date: string) => void;
}

export const useLeadsStore = create<LeadsStore>()(
    persist(
        (set, get) => ({
            leads: [],
            activity: [],

            saveLead: lead => {
                set(state => ({ leads: [lead, ...state.leads] }));
                get().logActivity({
                    leadId: lead.id,
                    leadName: lead.name,
                    message: `Saved ${lead.name}`
                });
            },

            updateStatus: (id, status) => {
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
                const lead = get().leads.find(l => l.id === id);
                if (lead) {
                    get().logActivity({
                        leadId: id,
                        leadName: lead.name,
                        message: `Marked ${lead.name} as ${status.replace(/_/g, " ")}`
                    });
                }
            },

            updateNotes: (id, notes) => {
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
            },

            saveGeneratedMessage: (id, message) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id ? { ...l, generatedMessage: message } : l
                    )
                }));
            },

            deleteLead: id => {
                set(state => ({ leads: state.leads.filter(l => l.id !== id) }));
            },

            logActivity: entry => {
                const log: ActivityLog = {
                    ...entry,
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString()
                };
                set(state => ({ activity: [log, ...state.activity] }));
            },

            setFollowUpDate: (id, date) => {
                set(state => ({
                    leads: state.leads.map(l =>
                        l.id === id ? { ...l, followUpDate: date } : l
                    )
                }));
            }
        }),
        {
            name: "sproute-leads"
        }
    )
);
