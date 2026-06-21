export type LeadStatus =
    | "new" | "messaged" | "replied"
    | "converted" | "dead" | "not_on_whatsapp";

export type MessageAngle = "curiosity" | "friendly" | "direct";
export type OutreachFlowTab = "no_reply" | "replied" | "chatHelper";
export type OutreachStep =
    | "initial_curiosity"
    | "initial_friendly"
    | "initial_direct"
    | "day3"
    | "day7"
    | "day14";

export type DeadReason =
    | "has_website"
    | "not_interested"
    | "wrong_number"
    | "no_response"
    | "too_expensive"
    | "other";

export interface LeadPainPoints {
    noWebsite: boolean;
    unclaimedListing: boolean;
    establishedBusiness: boolean;
    activeCustomers: boolean;
    excellentReputation: boolean;
    strongReputation: boolean;
    lowVisibility: boolean;
}

export interface FollowUpSequence {
    day3: string;
    day7: string;
}

export interface ChatMessage {
    role: "prospect" | "suggested";
    text: string;
    timestamp: string;
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
    followUpSequence?: FollowUpSequence;
    chatHistory?: ChatMessage[];
    deadReason?: DeadReason;
    lastOutreachStep?: OutreachStep;
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