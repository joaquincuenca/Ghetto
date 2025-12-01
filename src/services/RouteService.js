import { Route } from '../models/Route';

export class RouteService {
    static async getRoute(start, end) {
        try {
            const ROUTING_API_URL = import.meta.env.VITE_ROUTING_API_URL;
            const res = await fetch(
                `${ROUTING_API_URL}/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=true&steps=true`
            );
            
            const data = await res.json();
            
            if (data.code === "Ok" && data.routes && data.routes.length > 0) {
                const primaryRoute = data.routes[0];
                const primaryCoords = primaryRoute.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                const distanceKm = primaryRoute.distance / 1000;
                const durationMin = primaryRoute.duration / 60;
                
                const alternatives = [];
                for (let i = 1; i < Math.min(data.routes.length, 3); i++) {
                    const altRoute = data.routes[i];
                    alternatives.push(new Route(
                        altRoute.geometry.coordinates.map(coord => [coord[1], coord[0]]),
                        altRoute.distance / 1000,
                        altRoute.duration / 60
                    ));
                }
                
                return {
                    primary: new Route(primaryCoords, distanceKm, durationMin),
                    alternatives
                };
            }
            
            throw new Error("No route found");
        } catch (error) {
            console.error("Route calculation failed:", error);
            return RouteService.calculateStraightLineDistance(start, end);
        }
    }

    static calculateStraightLineDistance(start, end) {
        const R = 6371;
        const dLat = (end.lat - start.lat) * Math.PI / 180;
        const dLng = (end.lng - start.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return {
            primary: new Route([], distance, null),
            alternatives: []
        };
    }
}