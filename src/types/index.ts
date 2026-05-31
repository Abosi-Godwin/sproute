// Global shared types

export interface ApiResponse<T> {
    data: T;
    message: string;
    success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    total: number;
    page: number;
    limit: number;
}

export type LeadStatus =
    | "new"
    | "messaged"
    | "replied"
    | "converted"
    | "dead"
    | "not_on_whatsapp";
    
export type MessageAngle = 'curiosity' | 'friendly' | 'direct';

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
    unclaimedListing?: boolean;
    coordinates?: { latitude: number; longitude: number };
}

export interface SearchHistory {
    query: string;
    location: string;
    timestamp: string;
}
