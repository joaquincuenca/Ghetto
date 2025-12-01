export class Route {
    constructor(coordinates, distance, duration) {
        this.coordinates = coordinates;
        this.distance = distance;
        this.duration = duration;
    }

    get isEmpty() {
        return this.coordinates.length === 0;
    }

    get durationInMinutes() {
        return this.duration ? Math.round(this.duration) : null;
    }
}