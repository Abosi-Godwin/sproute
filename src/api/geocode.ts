export interface GeocodeResult {
    ll: string;
    displayName: string;
}

export async function geocodeLocation(
    location: string
): Promise<GeocodeResult> {
    const query = `${location}, Nigeria`;
    const params = new URLSearchParams({
        q: query,
        format: "json",
        limit: "1"
    });

    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
            headers: {
                "Accept-Language": "en",
                "User-Agent": "Sproute/1.0"
            }
        }
    );

    if (!res.ok) throw new Error("Geocoding service unavailable.");

    const data = await res.json();

    if (!data.length) {
        throw new Error(
            "Location not found. Try being more specific e.g. Warri, Delta State."
        );
    }

    const { lat, lon, display_name } = data[0];

    return {
        ll: `@${lat},${lon},14z`,
        displayName: display_name
    };
}
