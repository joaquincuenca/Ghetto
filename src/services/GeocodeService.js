export class GeocodeService {
    static async searchAddress(query, lat = 14.1218, lon = 122.9566) {
        console.log("=== GEOCODE SEARCH START ===");
        console.log("Query:", query);
        console.log("Center coords:", { lat, lon });
        
        try {
            const GEOCODE_API_URL = import.meta.env.VITE_GEOCODE_API_URL;
            console.log("Base API URL:", GEOCODE_API_URL);
            
            // Build URL
            const url = `${GEOCODE_API_URL}${encodeURIComponent(query)}&limit=10&viewbox=${lon-0.5},${lat-0.5},${lon+0.5},${lat+0.5}&bounded=1`;
            console.log("Full URL:", url);
            
            // Make request with User-Agent header (required by Nominatim)
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'TrikeBookingApp/1.0'
                }
            });
            
            console.log("Response status:", res.status);
            console.log("Response OK:", res.ok);
            
            if (!res.ok) {
                console.error("HTTP Error:", res.status, res.statusText);
                return [];
            }
            
            const data = await res.json();
            console.log("Raw response data:", data);
            console.log("Data type:", Array.isArray(data) ? "Array" : typeof data);
            console.log("Data length:", data?.length);

            // Nominatim returns an array directly
            if (!Array.isArray(data)) {
                console.error("Response is not an array!");
                return [];
            }
            
            if (data.length === 0) {
                console.warn("No results found for query:", query);
                return [];
            }

            const results = data.map(place => {
                console.log("Processing place:", place);
                return {
                    lat: parseFloat(place.lat),
                    lon: parseFloat(place.lon),
                    display_name: place.display_name,
                    type: place.type || place.class || 'place'
                };
            });
            
            console.log("Processed results:", results);
            console.log("=== GEOCODE SEARCH END ===");
            return results;
            
        } catch (error) {
            console.error("=== GEOCODE ERROR ===");
            console.error("Error type:", error.name);
            console.error("Error message:", error.message);
            console.error("Full error:", error);
            console.error("=== ERROR END ===");
            return [];
        }
    }

    static async reverseGeocode(latlng) {
        console.log("=== REVERSE GEOCODE START ===");
        console.log("Input latlng:", latlng);
        
        try {
            const REVERSE_GEOCODE_API_URL = import.meta.env.VITE_REVERSE_GEOCODE_API_URL;
            console.log("Base reverse API URL:", REVERSE_GEOCODE_API_URL);
            
            const url = `${REVERSE_GEOCODE_API_URL}${latlng.lat}&lon=${latlng.lng}`;
            console.log("Full reverse URL:", url);
            
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'TrikeBookingApp/1.0'
                }
            });
            
            console.log("Reverse response status:", res.status);
            
            if (!res.ok) {
                console.error("Reverse HTTP Error:", res.status, res.statusText);
                return "";
            }
            
            const data = await res.json();
            console.log("Reverse response data:", data);
            console.log("Display name:", data.display_name);
            console.log("=== REVERSE GEOCODE END ===");
            
            return data.display_name || "";
        } catch (error) {
            console.error("=== REVERSE GEOCODE ERROR ===");
            console.error("Error:", error);
            console.error("=== ERROR END ===");
            return "";
        }
    }
}

// Test function you can call from browser console
window.testGeocode = async (query = "Daet") => {
    console.log("Testing geocode with query:", query);
    const results = await GeocodeService.searchAddress(query);
    console.log("Test results:", results);
    return results;
};

console.log("GeocodeService loaded. Test with: testGeocode('Daet')");