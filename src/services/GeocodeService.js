export class GeocodeService {
    static async searchAddress(query, lat = 14.1218, lon = 122.9566) {
        try {
            const GEOCODE_API_URL = import.meta.env.VITE_GEOCODE_API_URL;
            const res = await fetch(
                `${GEOCODE_API_URL}/?q=${encodeURIComponent(query)}&limit=10&lat=${lat}&lon=${lon}`
            );
            const data = await res.json();

            return data.features.map(f => ({
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
                display_name: f.properties.name + 
                (f.properties.city ? `, ${f.properties.city}` : '') + 
                (f.properties.state ? `, ${f.properties.state}` : ''),
                type: f.properties.type || 'place'
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
                `${REVERSE_GEOCODE_API_URL}/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
            );
            const data = await res.json();
            return data.display_name || "";
        } catch (error) {
            console.error("Reverse geocode failed:", error);
            return "";
        }
    }
}