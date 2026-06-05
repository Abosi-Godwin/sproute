export async function geocodeLocation(location: string): Promise<{ ll: string; label: string }> {
    const encoded = encodeURIComponent(location);
    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
    );

    if (!res.ok) throw new Error('Could not reach location service');

    const data = await res.json();
    if (!data || data.length === 0) {
        throw new Error(`Could not find "${location}" — try a different spelling or add the country name`);
    }

    const { lat, lon } = data[0];
    return {
        ll: `@${lat},${lon},14z`,
        label: location,
    };
}