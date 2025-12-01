import { useState, useEffect } from 'react';

export const useGeolocation = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude 
        }),
        (err) => setError(err.message)
        );
    }, []);

    const getCurrentLocation = async () => {
        return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(loc);
            resolve(loc);
            },
            (err) => {
            setError(err.message);
            reject(err);
            }
        );
        });
    };

    return { userLocation, error, getCurrentLocation };
};