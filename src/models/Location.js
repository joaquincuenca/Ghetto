export class Location {
    constructor(lat, lng, displayName = "") {
        this.lat = lat;
        this.lng = lng;
        this.displayName = displayName;
    }

    toLatLng() {
        return { lat: this.lat, lng: this.lng };
    }

    static fromLatLng(latlng, displayName = "") {
        return new Location(latlng.lat, latlng.lng, displayName);
    }
}