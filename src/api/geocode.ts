export async function geocodeLocation(
    location: string
): Promise<{ ll: string; label: string }> {
    const query = location.trim();
    if (!query) throw new Error("Enter a location");

    let data: any;
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
            { headers: { "Accept-Language": "en" } }
        );
        if (!res.ok) throw new Error("status");
        data = await res.json();
    } catch {
        throw new Error(
            "Could not reach the location service. Check your connection and try again"
        );
    }

    if (!data || data.length === 0) {
        throw new Error(
            `Could not find "${query}". Try a different spelling or add the country name`
        );
    }

    const { lat, lon } = data[0];
    return {
        ll: `@${lat},${lon},14z`,
        label: query
    };
}