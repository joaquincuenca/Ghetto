// src/viewmodels/BookingViewModel.js
import { Location } from '../models/Location';
import { Booking } from '../models/Booking';
import { GeocodeService } from '../services/GeocodeService';
import { RouteService } from '../services/RouteService';
import { FareCalculator } from '../services/FareCalculator';
import { ValidationService } from '../services/ValidationService';
import { BookingService } from '../services/BookingService';

export class BookingViewModel {
    constructor() {
        this.fareCalculator = new FareCalculator();
    }

    async handleLocationSelect(latlng, name, isPickup, currentPickup, currentDropoff) {
        if (!ValidationService.isWithinCamarinesNorte(latlng)) {
            throw new Error("OUT_OF_RANGE");
        }

        const displayName = name || await GeocodeService.reverseGeocode(latlng);
        const location = new Location(latlng.lat, latlng.lng, displayName);

        let routeData = null;
        if (isPickup && currentDropoff) {
            routeData = await RouteService.getRoute(latlng, currentDropoff);
        } else if (!isPickup && currentPickup) {
            routeData = await RouteService.getRoute(currentPickup, latlng);
        }

        return { location, routeData };
    }

    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => reject(new Error("LOCATION_DENIED"))
            );
        });
    }

    /**
     * Create booking (does NOT save to database yet)
     */
    createBooking(pickup, dropoff, distance, duration, acceptedTerms) {
        ValidationService.validateBookingData(pickup, dropoff, distance, acceptedTerms);
        
        const fare = this.fareCalculator.calculate(distance);
        const bookingNumber = ValidationService.generateBookingNumber();
        const booking = new Booking(pickup, dropoff, distance, duration, fare, bookingNumber);

        return booking;
    }

    /**
     * Fetch booking by booking number
     */
    async fetchBooking(bookingNumber) {
        try {
            const bookingData = await BookingService.getBookingByNumber(bookingNumber);
            
            // Convert database data back to Booking model
            const pickup = new Location(
                bookingData.pickup_lat,
                bookingData.pickup_lng,
                bookingData.pickup_location
            );
            
            const dropoff = new Location(
                bookingData.dropoff_lat,
                bookingData.dropoff_lng,
                bookingData.dropoff_location
            );

            const booking = new Booking(
                pickup,
                dropoff,
                bookingData.distance,
                bookingData.duration,
                bookingData.fare,
                bookingData.booking_number
            );
            
            booking.timestamp = new Date(bookingData.timestamp);
            booking.status = bookingData.status;

            return booking;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all bookings
     */
    async getAllBookings(limit = 50, offset = 0) {
        try {
            return await BookingService.getAllBookings(limit, offset);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update booking status
     */
    async updateBookingStatus(bookingNumber, status) {
        try {
            return await BookingService.updateBookingStatus(bookingNumber, status);
        } catch (error) {
            throw error;
        }
    }

    calculateFare(distance) {
        return this.fareCalculator.calculate(distance);
    }

    getFareBreakdown(distance) {
        return this.fareCalculator.getBreakdown(distance);
    }
}