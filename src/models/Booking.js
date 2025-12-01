export class Booking {
    constructor(pickup, dropoff, distance, duration, fare, bookingNumber) {
        this.pickup = pickup;
        this.dropoff = dropoff;
        this.distance = distance;
        this.duration = duration;
        this.fare = fare || 0;
        this.bookingNumber = bookingNumber;
        this.timestamp = new Date();
    }

    get formattedTimestamp() {
        return this.timestamp.toLocaleString();
    }

    get formattedDistance() {
        return this.distance ? this.distance.toFixed(2) : '0.00';
    }

    get formattedFare() {
        return this.fare ? this.fare.toFixed(2) : '0.00';
    }

    get durationInMinutes() {
        return this.duration ? Math.round(this.duration) : null;
    }
}