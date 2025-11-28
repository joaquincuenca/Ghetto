import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FiMapPin, FiFlag, FiNavigation } from "react-icons/fi";
import { AiOutlineSwap } from "react-icons/ai";

// Custom Marker Icon
const markerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [38, 38],
});

function AddressSearch({ label, value, setValue, onSelect, showCurrentLocation, onCurrentLocation }) {
  const [inputValue, setInputValue] = useState(value); // local typing state
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  async function searchAddress(q) {
    setInputValue(q); // allow typing
    if (q.length < 3) {
      setResults([]);
      return;
    }
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q + ", Camarines Norte, Bicol"
      )}&countrycodes=ph&limit=10`
    );
    const data = await res.json();
    setResults(data);
    setOpen(true);
  }

  function choose(place) {
    const latlng = { lat: parseFloat(place.lat), lng: parseFloat(place.lon) };
    onSelect(latlng, place.display_name); // update parent
    setValue(place.display_name);         // update parent input
    setInputValue(place.display_name);    // update local input
    setOpen(false);
  }

  // Sync local input if parent value changes (e.g., reverse geocode)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <div className="relative mb-3 sm:mb-4">
      <label className="text-xs sm:text-sm font-medium text-gray-300">{label}</label>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => searchAddress(e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}...`}
            className="w-full p-2.5 sm:p-3 pl-9 sm:pl-10 rounded-xl border border-gray-700 mt-1 text-sm sm:text-base bg-gray-800 text-gray-100 placeholder-gray-400"
          />
          <span className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 text-gray-400 text-lg sm:text-xl">
            {label === "Pickup" ? <FiMapPin /> : <FiFlag />}
          </span>
        </div>
        {showCurrentLocation && (
          <button
            onClick={onCurrentLocation}
            className="mt-1 p-2.5 sm:p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
            title="Use current location"
          >
            <FiNavigation className="text-lg sm:text-xl" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 bg-gray-800 border border-gray-700 rounded-xl max-h-40 sm:max-h-48 overflow-auto z-50 shadow-lg">
          {results.map((place, i) => (
            <div
              key={i}
              className="p-2 cursor-pointer hover:bg-gray-700 text-xs sm:text-sm text-gray-200"
              onClick={() => choose(place)}
            >
              {place.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* Click Map to Select */
function LocationSelector({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
}

/* Auto Center on User or Pickup */
function AutoCenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 15);
  }, [position]);
  return null;
}

/* Fit Bounds for Both Markers */
function FitBoundsMap({ pickup, dropoff }) {
  const map = useMap();
  useEffect(() => {
    if (pickup && dropoff) {
      const bounds = L.latLngBounds([pickup, dropoff]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pickup, dropoff, map]);
  return null;
}

/* Booking Page */
function BookingPage() {
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [distance, setDistance] = useState(null);

  const [pickupText, setPickupText] = useState("");
  const [dropoffText, setDropoffText] = useState("");

  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [bookingNumber, setBookingNumber] = useState("");

  const baseFare = 50;
  const baseKm = 3;
  const extraRate = 15;

  async function getAccurateDistance(start, end) {
    const apiKey =
      "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImZhMGNmMzAyYWZkNDRhMTNhMjlhOWVjZGM5NDAwNDFiIiwiaCI6Im11cm11cjY0In0=";
    const url = "https://api.openrouteservice.org/v2/directions/driving-car";
    const body = { coordinates: [[start.lng, start.lat], [end.lng, end.lat]] };

    try {
      setLoading(true);
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setDistance(data.routes[0].summary.distance / 1000);
    } catch (e) {
      alert("Failed to get distance. Try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePickupSelect(latlng, placeName = null) {
    setPickup(latlng);
    if (dropoff) getAccurateDistance(latlng, dropoff);

    if (placeName) setPickupText(placeName); // immediately set clicked address
    else await reverseGeocode(latlng, setPickupText);
  }

  async function handleDropoffSelect(latlng, placeName = null) {
    setDropoff(latlng);
    if (pickup) getAccurateDistance(pickup, latlng);

    if (placeName) setDropoffText(placeName); // immediately set clicked address
    else await reverseGeocode(latlng, setDropoffText);
  }

  async function reverseGeocode(latlng, setTextFunc) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
      );
      const data = await res.json();
      if (data.display_name) setTextFunc(data.display_name);
    } catch (e) {
      console.error("Failed to get address:", e);
    }
  }

  async function useCurrentLocation() {
    if (userLocation) await handlePickupSelect(userLocation);
    else
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          await handlePickupSelect(loc);
        },
        () => alert("Enable location services.")
      );
  }

  const resetMap = () => {
    setPickup(null);
    setDropoff(null);
    setDistance(null);
    setPickupText("");
    setDropoffText("");
  };

  const fare =
    distance != null
      ? distance <= baseKm
        ? baseFare
        : baseFare + (distance - baseKm) * extraRate
      : 0;

  function generateBookingNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `BK${dateStr}${randomNum}`;
  }

  function handleBookNow() {
    if (!pickup || !dropoff || !distance) {
      alert("Select both pickup and drop-off first!");
      return;
    }
    setBookingNumber(generateBookingNumber());
    setShowReceipt(true);
  }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc); // store location for button
      },
      () => alert("Enable location services.")
    );
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto text-gray-100">
            <div id="receipt" className="p-6 sm:p-8">
              <div className="text-center border-b-2 border-dashed border-gray-700 pb-4 mb-4">
                <h2 className="text-xl sm:text-2xl font-bold">Ride Receipt</h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">Camarines Norte Booking</p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-400">Booking Number</p>
                  <p className="text-base sm:text-lg font-bold text-blue-400">{bookingNumber}</p>
                </div>

                <div className="bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">📍 Pickup Location</p>
                  <p className="text-xs sm:text-sm font-medium break-words">{pickupText || "Selected on map"}</p>
                </div>

                <div className="bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">🚩 Drop-off Location</p>
                  <p className="text-xs sm:text-sm font-medium break-words">{dropoffText || "Selected on map"}</p>
                </div>

                <div className="flex justify-between items-center py-2 border-t border-gray-700">
                  <span className="text-xs text-gray-400">Distance</span>
                  <span className="text-sm sm:text-base font-semibold">{distance?.toFixed(2) || "0.00"} km</span>
                </div>

                <div className="flex justify-between items-center py-3 bg-blue-600 text-white rounded-lg px-4 mt-2">
                  <span className="text-base sm:text-lg font-bold">Total Fare</span>
                  <span className="text-xl sm:text-2xl font-bold">₱{fare.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-xs text-gray-400 border-t border-gray-700 pt-3">
                <p>📅 {new Date().toLocaleString()}</p>
                <p className="mt-2">📸 Screenshot this receipt for your booking</p>
              </div>
            </div>

            <div className="p-4 bg-gray-800 rounded-b-2xl flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-semibold"
              >
                Close
              </button>
              <button
                onClick={() =>
                  window.open("https://www.facebook.com/profile.php?id=61582462506784", "_blank")
                }
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold"
              >
                Book on FB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-full md:w-[380px] bg-gray-900 text-gray-100 p-4 sm:p-6 shadow-xl overflow-y-auto max-h-[50vh] md:max-h-none">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">Book Your Ride</h2>

        <AddressSearch
          label="Pickup"
          value={pickupText}
          setValue={setPickupText}
          onSelect={handlePickupSelect}
          showCurrentLocation={true}
          onCurrentLocation={useCurrentLocation}
        />

        <div className="flex justify-center mb-4">
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full shadow"
            onClick={() => {
              const tempLoc = pickup;
              const tempText = pickupText;
              setPickup(dropoff);
              setPickupText(dropoffText);
              setDropoff(tempLoc);
              setDropoffText(tempText);
            }}
          >
            <AiOutlineSwap className="text-xl text-gray-200" />
          </button>
        </div>

        <AddressSearch
          label="Drop-off"
          value={dropoffText}
          setValue={setDropoffText}
          onSelect={handleDropoffSelect}
          showCurrentLocation={false}
        />

        <button
          onClick={handleBookNow}
          disabled={!pickup || !dropoff || !distance}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-xl text-lg font-semibold shadow-md transition-colors"
        >
          Book Now
        </button>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            onClick={resetMap}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-3 rounded-xl font-semibold shadow-md transition-colors"
          >
            Reset
          </button>
          
          <button
            onClick={() => window.location.href = "/"} // redirect to homepage
            className="flex-1 bg-blue-600 hover:bg-yellow-700 text-white py-3 rounded-xl font-semibold shadow-md transition-colors"
          >
            Back to Homepage
          </button>
        </div>

        {pickup && dropoff && distance && (
          <div className="mt-6 p-5 bg-gray-800 border border-gray-700 rounded-xl shadow">
            <h3 className="text-lg font-bold mb-2 text-white">Ride Summary</h3>
            <p className="text-sm text-gray-300">Distance: {distance.toFixed(2)} km</p>
            <p className="text-xl text-blue-400 font-bold mt-3">Fare: ₱{fare.toFixed(2)}</p>
          </div>
        )}
      </div>

        {/* Map */}
        <div className="flex-1 relative min-h-[300px] md:min-h-0">
          <MapContainer
            center={userLocation || { lat: 14.5995, lng: 120.9842 }}
            zoom={15}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {pickup && <Marker position={pickup} icon={markerIcon} />}
            {dropoff && <Marker position={dropoff} icon={markerIcon} />}
            <LocationSelector
              onSelect={async (latlng) => {
                if (!pickup || (pickup && dropoff)) await handlePickupSelect(latlng);
                else await handleDropoffSelect(latlng);
              }}
            />
            <AutoCenterMap position={!dropoff ? userLocation : null} />
            <FitBoundsMap pickup={pickup} dropoff={dropoff} />
          </MapContainer>
        </div>
      </div>
  );
}

export default BookingPage;
