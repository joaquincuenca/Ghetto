// src/pages/BookingPage.jsx
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { AiOutlineSwap } from "react-icons/ai";

import AddressSearch from "../components/AddressSearch";
import { LocationSelector, AutoCenterMap, FitBoundsMap, RouteLabels } from "../components/MapComponents";
import TermsModal from "../components/TermsModal";
import ErrorModal from "../components/ErrorModal";
import GuideModal from "../components/GuideModal";
import ReceiptModal from "../components/ReceiptModal";

import { useBooking } from "../../hooks/useBooking";
import { useGeolocation } from "../../hooks/useGeolocation";
import { markerIcon, mapTileLayer } from "../../utils/leafletConfig";
import { MAP_CONFIG, STORAGE_KEYS, ERROR_MESSAGES, FARE_CONFIG } from "../../utils/constants";

export default function BookingPage() {
    const {
        pickup,
        dropoff,
        pickupText,
        dropoffText,
        distance,
        duration,
        routeCoordinates,
        alternativeRoutes,
        loading,
        errorMessage,
        setPickupText,
        setDropoffText,
        setErrorMessage,
        handlePickupSelect,
        handleDropoffSelect,
        resetBooking,
        swapLocations,
        viewModel
    } = useBooking();

    const { userLocation, getCurrentLocation } = useGeolocation();

    const [showReceipt, setShowReceipt] = useState(false);
    const [currentBooking, setCurrentBooking] = useState(null);
    const [showGuide, setShowGuide] = useState(true);
    const [showTerms, setShowTerms] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Calculate fare using viewModel's calculateFare or local calculation
    const calculateFare = (dist) => {
        if (!dist || dist <= 0) return FARE_CONFIG.BASE_FARE;
        
        const { BASE_FARE, BASE_KM, EXTRA_RATE } = FARE_CONFIG;
        const extraDistance = Math.max(0, dist - BASE_KM);
        return BASE_FARE + (extraDistance * EXTRA_RATE);
    };

    const fare = distance ? (viewModel?.calculateFare?.(distance) || calculateFare(distance)) : 0;

    // Generate booking number
    const generateBookingNumber = () => {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `BK${timestamp}${random}`;
    };

    async function useCurrentLocation() {
        try {
            const loc = await getCurrentLocation();
            await handlePickupSelect(loc);
        } catch (error) {
            setErrorMessage(ERROR_MESSAGES.LOCATION_DENIED);
        }
    }

    function handleBookNow() {
        try {
            console.log('Creating booking with:', { pickup, dropoff, distance, duration, acceptedTerms });
            
            // Check if terms are accepted
            if (!acceptedTerms) {
                throw new Error("TERMS_NOT_ACCEPTED");
            }

            // Check if both locations are selected
            if (!pickup || !dropoff) {
                throw new Error("INCOMPLETE_BOOKING");
            }

            // Create booking object directly
            const booking = {
                bookingNumber: generateBookingNumber(),
                pickup: pickup,
                dropoff: dropoff,
                distance: distance || 0,
                duration: duration || 0,
                fare: fare,
                timestamp: new Date().toISOString(), // Always use ISO string
                status: 'pending'
            };
            
            console.log('Booking created:', booking);
            setCurrentBooking(booking);
            setShowReceipt(true);
        } catch (error) {
            console.error('Booking error:', error);
            if (error.message === "TERMS_NOT_ACCEPTED") {
                setErrorMessage(ERROR_MESSAGES.TERMS_NOT_ACCEPTED);
            } else if (error.message === "INCOMPLETE_BOOKING") {
                setErrorMessage(ERROR_MESSAGES.INCOMPLETE_BOOKING);
            } else {
                setErrorMessage("An error occurred while creating your booking. Please try again.");
            }
        }
    }

    async function handleMapClick(latlng) {
        if (!pickup || (pickup && dropoff)) {
            await handlePickupSelect(latlng);
        } else {
            await handleDropoffSelect(latlng);
        }
    }

    useEffect(() => {
        const termsAccepted = localStorage.getItem(STORAGE_KEYS.ACCEPTED_TERMS);
        if (!termsAccepted) {
            setShowTerms(true);
        } else {
            setAcceptedTerms(true);
        }
    }, []);

    return (
        <div className="flex flex-col md:flex-row h-screen">
            {/* Modals */}
            <TermsModal
                show={showTerms}
                accepted={acceptedTerms}
                onAcceptChange={setAcceptedTerms}
                onContinue={() => {
                    localStorage.setItem(STORAGE_KEYS.ACCEPTED_TERMS, "true");
                    setShowTerms(false);
                }}
            />

            <ErrorModal
                message={errorMessage}
                onClose={() => {
                    setErrorMessage(null);
                }}
            />

            <GuideModal
                show={showGuide}
                onClose={() => setShowGuide(false)}
            />

            <ReceiptModal
                show={showReceipt}
                booking={currentBooking}
                pickupText={pickupText}
                dropoffText={dropoffText}
                onClose={() => setShowReceipt(false)}
            />

            {/* Sidebar */}
            <div className="w-full md:w-[380px] bg-gray-900 text-gray-100 p-4 sm:p-6 shadow-xl overflow-y-auto max-h-[50vh] md:max-h-none">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">Book Your Ride</h2>

            <AddressSearch
                label="Pickup"
                value={pickupText}
                setValue={setPickupText}
                onSelect={handlePickupSelect}
                onClear={() => {
                    setPickupText("");
                    handlePickupSelect(null);
                }}
                showCurrentLocation={true}
                onCurrentLocation={useCurrentLocation}
            />

            <div className="flex justify-center mb-4">
                <button
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full shadow"
                    onClick={swapLocations}
                >
                    <AiOutlineSwap className="text-xl text-gray-200" />
                </button>
            </div>

            <AddressSearch
                label="Drop-off"
                value={dropoffText}
                setValue={setDropoffText}
                onSelect={handleDropoffSelect}
                onClear={() => {
                    setDropoffText("");
                    handleDropoffSelect(null);
                }}
            />

                {loading && (
                    <div className="text-center text-blue-400 text-sm mb-3">
                        Calculating route...
                    </div>
                )}

                <button
                    onClick={handleBookNow}
                    disabled={!pickup || !dropoff || !distance}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-xl text-lg font-semibold shadow-md transition-colors"
                >
                    Book Now
                </button>

                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                        onClick={resetBooking}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-3 rounded-xl font-semibold shadow-md transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={() => (window.location.href = "/")}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-xl font-semibold shadow-md transition-colors"
                    >
                        Back to Homepage
                    </button>
                </div>

                {pickup && dropoff && distance && (
                    <div className="mt-6 p-5 bg-gray-800 border border-gray-700 rounded-xl shadow">
                        <h3 className="text-lg font-bold mb-2 text-white">Ride Summary</h3>
                        <p className="text-sm text-gray-300">Distance: {distance.toFixed(2)} km</p>
                        {duration && (
                            <p className="text-sm text-gray-300">Duration: ~{Math.round(duration)} minutes</p>
                        )}
                        <p className="text-xl text-blue-400 font-bold mt-3">Fare: ₱{fare.toFixed(2)}</p>
                    </div>
                )}
            </div>

            {/* Map */}
            <div className="flex-1 relative min-h-[300px] md:min-h-0">
                <MapContainer
                    center={userLocation || MAP_CONFIG.DEFAULT_CENTER}
                    zoom={MAP_CONFIG.DEFAULT_ZOOM}
                    scrollWheelZoom={true}
                    className="w-full h-full"
                >
                    <TileLayer 
                        url={mapTileLayer.url}
                        attribution={mapTileLayer.attribution}
                    />

                    {pickup && <Marker position={pickup} icon={markerIcon} />}
                    {dropoff && <Marker position={dropoff} icon={markerIcon} />}
                    
                    {/* Alternative Routes */}
                    {alternativeRoutes.map((altRoute, index) => (
                        <Polyline
                            key={`alt-${index}`}
                            positions={altRoute.coordinates}
                            color="#6b7280"
                            weight={4}
                            opacity={0.6}
                            dashArray="5, 10"
                        />
                    ))}
                    
                    {/* Primary Route */}
                    {routeCoordinates.length > 0 && (
                        <Polyline
                            positions={routeCoordinates}
                            color="#3b82f6"
                            weight={6}
                            opacity={0.9}
                        />
                    )}

                    <RouteLabels 
                        routeCoordinates={routeCoordinates} 
                        alternativeRoutes={alternativeRoutes} 
                    />

                    <LocationSelector onSelect={handleMapClick} />
                    <AutoCenterMap position={!dropoff ? userLocation : null} />
                    <FitBoundsMap pickup={pickup} dropoff={dropoff} />
                </MapContainer>
            </div>
        </div>
    );
}