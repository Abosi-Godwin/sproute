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

export type LeadStatus = 'new' | 'messaged' | 'replied' | 'converted' | 'dead' | 'not_on_whatsapp';

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
    savedAt: string;
    updatedAt: string;
    notes?: string;
    location: string;
    generatedMessage?: string;
    followUpDate?: string;
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
    coordinates?: { latitude: number; longitude: number };
}

export interface SearchHistory {
    query: string;
    location: string;
    timestamp: string;
}