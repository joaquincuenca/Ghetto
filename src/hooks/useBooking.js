import { useState, useCallback } from 'react';
import { BookingViewModel } from '../viewmodels/BookingViewModel';

export const useBooking = () => {
    const [pickup, setPickup] = useState(null);
    const [dropoff, setDropoff] = useState(null);
    const [pickupText, setPickupText] = useState("");
    const [dropoffText, setDropoffText] = useState("");
    const [distance, setDistance] = useState(null);
    const [duration, setDuration] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [alternativeRoutes, setAlternativeRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const viewModel = new BookingViewModel();

    const handlePickupSelect = useCallback(async (latlng, name = null) => {
        try {
        setLoading(true);
        const { location, routeData } = await viewModel.handleLocationSelect(
            latlng, 
            name, 
            true, 
            pickup, 
            dropoff
        );

        setPickup(location.toLatLng());
        setPickupText(location.displayName);

        if (routeData) {
            setRouteCoordinates(routeData.primary.coordinates);
            setDistance(routeData.primary.distance);
            setDuration(routeData.primary.duration);
            setAlternativeRoutes(routeData.alternatives);
        }
        } catch (error) {
        if (error.message === "OUT_OF_RANGE") {
            setErrorMessage("🚫 Out of Range! Service is only available within Camarines Norte, Bicol.");
            setPickup(null);
            setPickupText("");
            setRouteCoordinates([]);
        }
        } finally {
        setLoading(false);
        }
    }, [pickup, dropoff]);

    const handleDropoffSelect = useCallback(async (latlng, name = null) => {
        try {
        setLoading(true);
        const { location, routeData } = await viewModel.handleLocationSelect(
            latlng, 
            name, 
            false, 
            pickup, 
            dropoff
        );

        setDropoff(location.toLatLng());
        setDropoffText(location.displayName);

        if (routeData) {
            setRouteCoordinates(routeData.primary.coordinates);
            setDistance(routeData.primary.distance);
            setDuration(routeData.primary.duration);
            setAlternativeRoutes(routeData.alternatives);
        }
        } catch (error) {
        if (error.message === "OUT_OF_RANGE") {
            setErrorMessage("🚫 Out of Range! Service is only available within Camarines Norte, Bicol.");
            setDropoff(null);
            setDropoffText("");
            setRouteCoordinates([]);
        }
        } finally {
        setLoading(false);
        }
    }, [pickup, dropoff]);

    const resetBooking = useCallback(() => {
        setPickup(null);
        setDropoff(null);
        setPickupText("");
        setDropoffText("");
        setDistance(null);
        setDuration(null);
        setRouteCoordinates([]);
        setAlternativeRoutes([]);
    }, []);

    const swapLocations = useCallback(() => {
        const tempLoc = pickup;
        const tempText = pickupText;
        setPickup(dropoff);
        setPickupText(dropoffText);
        setDropoff(tempLoc);
        setDropoffText(tempText);
    }, [pickup, dropoff, pickupText, dropoffText]);

    return {
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
    };
};