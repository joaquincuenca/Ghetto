export class ValidationService {
    static CAMARINES_NORTE_BOUNDS = {
        north: 14.7,
        south: 13.9,
        east: 123.1,
        west: 122.5
    };

    static isWithinCamarinesNorte(latlng) {
        const bounds = this.CAMARINES_NORTE_BOUNDS;
        
        return (
        latlng.lat >= bounds.south &&
        latlng.lat <= bounds.north &&
        latlng.lng >= bounds.west &&
        latlng.lng <= bounds.east
        );
    }

    static generateBookingNumber() {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `BK${dateStr}${randomNum}`;
    }

    static validateBookingData(pickup, dropoff, distance, acceptedTerms) {
        if (!acceptedTerms) {
        throw new Error("TERMS_NOT_ACCEPTED");
        }
        if (!pickup || !dropoff || !distance) {
        throw new Error("INCOMPLETE_BOOKING");
        }
        return true;
    }
}