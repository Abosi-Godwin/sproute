 import { SearchResult } from '../types';

const API_KEY = import.meta.env.VITE_SERPAPI_KEY;

const CITY_COORDS: Record<string, string> = {
  'Asaba': '@6.2058,6.7058,14z',
  'Lagos': '@6.5244,3.3792,14z',
  'Port Harcourt': '@4.8156,7.0498,14z',
  'Abuja': '@9.0765,7.3986,14z',
  'Enugu': '@6.4584,7.5464,14z',
};

export interface FetchPlacesResult {
  results: SearchResult[];
  hasNextPage: boolean;
}

export async function fetchPlaces(
  query: string,
  ll: string,
  start = 0
): Promise<FetchPlacesResult> {
  const params = new URLSearchParams({
    engine: 'google_maps',
    type: 'search',
    q: query,
    ll,
    hl: 'en',
    start: String(start),
    api_key: API_KEY,
  });

  const res = await fetch(`/api/serpapi/search?${params}`);
  const data = await res.json();

  if (!res.ok) throw new Error(`SerpAPI error: ${res.status}`);

  const results: SearchResult[] = (data.local_results ?? []).map((r: any) => ({
    placeId: r.place_id ?? crypto.randomUUID(),
    name: r.title ?? '',
    category: r.type ?? '',
    address: r.address ?? '',
    phone: r.phone ?? undefined,
    website: r.website ?? undefined,
    rating: r.rating ?? undefined,
    reviews: r.reviews ?? undefined,
    coordinates: r.gps_coordinates
      ? { latitude: r.gps_coordinates.latitude, longitude: r.gps_coordinates.longitude }
      : undefined,
  }));

  return {
    results,
    hasNextPage: !!data.serpapi_pagination?.next,
  };
}

export function getCityLL(city: string): string {
  return CITY_COORDS[city] ?? CITY_COORDS['Lagos'];
}