export class GeocodeService {
    static async searchAddress(query, lat = 14.1218, lon = 122.9566) {
        try {
            const GEOCODE_API_URL = import.meta.env.VITE_GEOCODE_API_URL;
            
            // Build the URL correctly - don't add extra query params since the base URL already has them
            const url = `${GEOCODE_API_URL}${encodeURIComponent(query)}&limit=10&viewbox=${lon-0.5},${lat-0.5},${lon+0.5},${lat+0.5}&bounded=1`;
            
            const res = await fetch(url);
            const data = await res.json();

            // Nominatim returns an array directly, not a GeoJSON with features
            if (!Array.isArray(data) || data.length === 0) {
                return [];
            }

            return data.map(place => ({
                lat: place.lat,
                lon: place.lon,
                display_name: place.display_name,
                type: place.type || place.class || 'place'
            }));
        } catch (error) {
            console.error("Address search failed:", error);
            return [];
        }
    }

    static async reverseGeocode(latlng) {
        try {
            const REVERSE_GEOCODE_API_URL = import.meta.env.VITE_REVERSE_GEOCODE_API_URL;
            const res = await fetch(
                `${REVERSE_GEOCODE_API_URL}${latlng.lat}&lon=${latlng.lng}`
            );
            const data = await res.json();
            return data.display_name || "";
        } catch (error) {
            console.error("Reverse geocode failed:", error);
            return "";
        }
    }
}