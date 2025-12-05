import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const createCustomIcon = (emoji, size = 40) => {
    return L.divIcon({
        html: `<div style="font-size:${size}px; text-align:center; line-height:1; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${emoji}</div>`,
        className: 'custom-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size]
    });
};

const riderIcon = createCustomIcon('🏍️', 45);
const pickupIcon = createCustomIcon('📍', 38);
const dropoffIcon = createCustomIcon('🎯', 38);

function MapController({ positions, autoCenter }) {
    const map = useMap();

    useEffect(() => {
        if (autoCenter && positions?.length > 0) {
            const valid = positions.filter(pos => pos?.lat && pos?.lng);
            if (valid.length > 0) {
                const bounds = L.latLngBounds(valid.map(pos => [pos.lat, pos.lng]));
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
        }
    }, [positions, autoCenter, map]);

    return null;
}

export default function RiderTrackingMap({ booking, userLocation, riderLocation }) {
    const [estimatedTime, setEstimatedTime] = useState(null);
    const [distance, setDistance] = useState(null);
    const [autoCenter, setAutoCenter] = useState(true);
    const [route, setRoute] = useState([]);
    const mapRef = useRef(null);

    const calculateDistance = useCallback((p1, p2) => {
        if (!p1 || !p2) return null;

        const R = 6371;
        const toRad = deg => deg * (Math.PI / 180);

        const dLat = toRad(p2.lat - p1.lat);
        const dLon = toRad(p2.lng - p1.lng);

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(p1.lat)) *
                Math.cos(toRad(p2.lat)) *
                Math.sin(dLon / 2) ** 2;

        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }, []);

    const pickupLocation = useMemo(() => {
        return booking?.pickup_lat && booking?.pickup_lng
            ? { lat: +booking.pickup_lat, lng: +booking.pickup_lng }
            : null;
    }, [booking?.pickup_lat, booking?.pickup_lng]);

    const dropoffLocation = useMemo(() => {
        return booking?.dropoff_lat && booking?.dropoff_lng
            ? { lat: +booking.dropoff_lat, lng: +booking.dropoff_lng }
            : null;
    }, [booking?.dropoff_lat, booking?.dropoff_lng]);

    useEffect(() => {
        if (!riderLocation) {
            setEstimatedTime(null);
            setDistance(null);
            return;
        }

        const newRoute = [riderLocation];

        if (booking?.status === 'in_transit' && dropoffLocation)
            newRoute.push(dropoffLocation);
        else if (pickupLocation)
            newRoute.push(pickupLocation);

        if (JSON.stringify(newRoute) !== JSON.stringify(route)) {
            setRoute(newRoute);
        }
    }, [riderLocation, pickupLocation, dropoffLocation, booking?.status, route]);

    useEffect(() => {
        if (!riderLocation) {
            setEstimatedTime(null);
            setDistance(null);
            return;
        }

        const target =
            booking?.status === 'in_transit'
                ? dropoffLocation
                : pickupLocation;

        if (!target) return;

        const dist = calculateDistance(riderLocation, target);
        if (dist !== null) {
            const meters = (dist * 1000).toFixed(0);
            const minutes = Math.ceil((dist / 30) * 60);

            if (+meters !== +(distance || 0)) setDistance(meters);
            if (minutes !== estimatedTime) setEstimatedTime(minutes);
        }
    }, [
        riderLocation,
        pickupLocation,
        dropoffLocation,
        booking?.status,
        distance,
        estimatedTime,
        calculateDistance
    ]);

    const showRider = useMemo(() => {
        return (
            riderLocation &&
            ['confirmed', 'assigned', 'on_the_way', 'picked_up', 'in_transit'].includes(
                booking?.status
            )
        );
    }, [riderLocation, booking?.status]);

    const showPickup = useMemo(() => {
        return (
            ['pending', 'confirmed', 'assigned', 'on_the_way', 'picked_up'].includes(
                booking?.status
            )
        );
    }, [booking?.status]);

    const showDropoff = useMemo(() => {
        return (
            ['in_transit', 'completed'].includes(booking?.status)
        );
    }, [booking?.status]);

    const defaultCenter = useMemo(() => {
        return pickupLocation || { lat: 14.5995, lng: 120.9842 };
    }, [pickupLocation]);

    const allPositions = useMemo(
        () =>
            [
                showRider ? riderLocation : null,
                showPickup ? pickupLocation : null,
                showDropoff ? dropoffLocation : null
            ].filter(Boolean),
        [showRider, showPickup, showDropoff, riderLocation, pickupLocation, dropoffLocation]
    );

    if (!pickupLocation && !dropoffLocation && !riderLocation) {
        return (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <p className="text-gray-400">Location data not available yet</p>
            </div>
        );
    }

    const toggleAutoCenter = useCallback(() => {
        setAutoCenter(prev => !prev);
    }, []);

    return (
        <div className="space-y-4">
            <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-gray-700 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
                        <span className="text-xl md:text-2xl">🗺️</span>
                        Live Tracking
                    </h3>
                </div>

                {showRider && estimatedTime && distance && (
                    <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3">
                        <div className="bg-gray-800 rounded-lg p-2 md:p-2.5">
                            <div className="text-gray-400 text-xs mb-1">ETA</div>
                            <div className="font-bold text-lg md:text-xl text-green-400">
                                {estimatedTime} min
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-2 md:p-2.5">
                            <div className="text-gray-400 text-xs mb-1">Distance</div>
                            <div className="font-bold text-lg md:text-xl text-blue-400">
                                {distance} m
                            </div>
                        </div>
                    </div>
                )}

                {showRider && (
                    <div className="flex items-center gap-2 bg-green-900/30 px-3 py-2 rounded-lg border border-green-700">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs md:text-sm font-semibold text-green-400">
                            Rider on the way!
                        </span>
                    </div>
                )}
            </div>

            {showRider && estimatedTime < 5 && (
                <div className="animate-bounce-subtle">
                    <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-3 md:p-4 shadow-2xl border-2 border-green-400">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl md:text-4xl">⚡</div>

                            <div className="flex-1">
                                <div className="font-bold text-white text-base md:text-lg">
                                    Rider Approaching!
                                </div>

                                <div className="text-xs md:text-sm text-green-50">
                                    Arriving in {estimatedTime} minute
                                    {estimatedTime > 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div
                className="rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl relative"
                style={{ height: '400px', minHeight: '300px' }}
            >
                <div className="absolute top-2 right-2 z-[9999]">
                    <button
                        onClick={toggleAutoCenter}
                        className="px-2 md:px-3 py-1 md:py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                        {autoCenter ? '🔒 Auto' : '🔓 Manual'}
                    </button>
                </div>

                <MapContainer
                    center={[defaultCenter.lat, defaultCenter.lng]}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                    ref={mapRef}
                >
                    <TileLayer
                        attribution='OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapController positions={allPositions} autoCenter={autoCenter} />

                    {showRider && riderLocation && (
                        <Marker
                            position={[riderLocation.lat, riderLocation.lng]}
                            icon={riderIcon}
                        >
                            <Popup>
                                <div className="text-center p-2">
                                    <div className="font-bold text-lg mb-1">🏍️ Your Rider</div>
                                    <div className="text-sm text-gray-700">
                                        {booking?.assigned_rider_id
                                            ? `Rider #${booking.assigned_rider_id}`
                                            : 'On the way'}
                                    </div>

                                    {estimatedTime && (
                                        <div className="text-xs text-gray-600 mt-2 font-semibold">
                                            ETA: {estimatedTime} minutes
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {showPickup && pickupLocation && (
                        <Marker
                            position={[pickupLocation.lat, pickupLocation.lng]}
                            icon={pickupIcon}
                        >
                            <Popup>
                                <div className="text-center p-2">
                                    <div className="font-bold text-lg mb-1">📍 Pickup Point</div>
                                    <div className="text-sm text-gray-700">
                                        {booking?.pickup_location || 'Your location'}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {showDropoff && dropoffLocation && (
                        <Marker
                            position={[dropoffLocation.lat, dropoffLocation.lng]}
                            icon={dropoffIcon}
                        >
                            <Popup>
                                <div className="text-center p-2">
                                    <div className="font-bold text-lg mb-1">🎯 Drop-off Point</div>
                                    <div className="text-sm text-gray-700">
                                        {booking?.dropoff_location || 'Destination'}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {route.length > 1 && (
                        <Polyline
                            positions={route.map(p => [p.lat, p.lng])}
                            pathOptions={{
                                color: '#3b82f6',
                                weight: 4,
                                opacity: 0.8,
                                dashArray: '10, 10'
                            }}
                        />
                    )}
                </MapContainer>
            </div>

            <style>{`
                .custom-marker { background: transparent; border: none; }
                .leaflet-container { background: #1f2937; font-family: inherit; }
                .leaflet-popup-content-wrapper {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                .leaflet-popup-tip { background: white; }

                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                .animate-bounce-subtle { animation: bounce-subtle 2s infinite; }

                @media (min-width: 768px) {
                    .rounded-xl.overflow-hidden.border-2 {
                        height: 500px !important;
                    }
                }
            `}</style>
        </div>
    );
}
