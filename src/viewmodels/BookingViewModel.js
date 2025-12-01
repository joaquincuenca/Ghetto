import { Location } from '../models/Location';
import { Booking } from '../models/Booking';
import { GeocodeService } from '../services/GeocodeService';
import { RouteService } from '../services/RouteService';
import { FareCalculator } from '../services/FareCalculator';
import { ValidationService } from '../services/ValidationService';

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

    createBooking(pickup, dropoff, distance, duration, acceptedTerms) {
        ValidationService.validateBookingData(pickup, dropoff, distance, acceptedTerms);
        
        const fare = this.fareCalculator.calculate(distance);
        const bookingNumber = ValidationService.generateBookingNumber();
        return new Booking(pickup, dropoff, distance, duration, fare, bookingNumber);
    }

    calculateFare(distance) {
        return this.fareCalculator.calculate(distance);
    }

    getFareBreakdown(distance) {
        return this.fareCalculator.getBreakdown(distance);
    }
}