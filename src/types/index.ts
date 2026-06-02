export type LeadStatus =
    | "new"
    | "messaged"
    | "replied"
    | "converted"
    | "dead"
    | "not_on_whatsapp";

export type MessageAngle = "curiosity" | "friendly" | "direct";
export type OutreachFlowTab = "no_reply" | "replied";

export interface LeadPainPoints {
    noWebsite: boolean;
    unclaimedListing: boolean;
    establishedBusiness: boolean;
    activeCustomers: boolean;
    excellentReputation: boolean;
    strongReputation: boolean;
    lowVisibility: boolean;
}

export interface Lead {
    id: string;
    name: string;
    category: string;
    address: string;
    phone?: string;
    website?: string;
    rating?: number;
    reviews?: number;
    placeId: string;
    status: LeadStatus;
    notes?: string;
    location: string;
    followUpDate?: string;
    generatedMessage?: string;
    selectedMessageAngle?: MessageAngle;
    whatsappNumber?: string;
    painPoints?: LeadPainPoints;
    outreachFlowTab?: OutreachFlowTab;
    savedAt: string;
    updatedAt: string;
    searchQuery?: string;
    searchLocation?: string;
    unclaimedListing?: boolean;
}

export interface ActivityLog {
    id: string;
    leadId: string;
    leadName: string;
    message: string;
    timestamp: string;
}

export interface SearchResult {
    placeId: string;
    name: string;
    category: string;
    address: string;
    phone?: string;
    website?: string;
    rating?: number;
    reviews?: number;
    coordinates?: { lat: number; lng: number };
    unclaimedListing?: boolean;
}

export interface SearchHistory {
    query: string;
    location: string;
    timestamp: string;
}