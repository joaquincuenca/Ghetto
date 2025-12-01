import { useEffect } from 'react';
import { useMapEvents, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';

export function LocationSelector({ onSelect }) {
    useMapEvents({
        click(e) {
        onSelect(e.latlng);
        },
    });
    return null;
    }

    export function AutoCenterMap({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) map.setView(position, 15);
    }, [position, map]);
    return null;
    }

    export function FitBoundsMap({ pickup, dropoff }) {
    const map = useMap();
    useEffect(() => {
        if (pickup && dropoff) {
        const bounds = L.latLngBounds([pickup, dropoff]);
        map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [pickup, dropoff, map]);
    return null;
    }

    export function RouteLabels({ routeCoordinates, alternativeRoutes }) {
    const getRouteMidpoint = (coordinates) => {
        if (coordinates.length === 0) return null;
        const middleIndex = Math.floor(coordinates.length / 2);
        return coordinates[middleIndex];
    };

    if (!routeCoordinates.length && !alternativeRoutes.length) return null;

    return (
        <>
        {routeCoordinates.length > 0 && (
            <Popup position={getRouteMidpoint(routeCoordinates)} permanent className="route-label-popup">
            <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                Fastest Route
            </div>
            </Popup>
        )}

        {alternativeRoutes.map((altRoute, index) => {
            const midpoint = getRouteMidpoint(altRoute.coordinates);
            if (!midpoint) return null;
            
            return (
            <Popup key={`alt-label-${index}`} position={midpoint} permanent className="route-label-popup">
                <div className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                Slower Route {index + 1}
                </div>
            </Popup>
            );
        })}
        </>
    );
}