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

/* ---------------------------------------------------------
   Address Search Component
--------------------------------------------------------- */
function AddressSearch({ label, value, setValue, onSelect, showCurrentLocation, onCurrentLocation }) {
  const [inputValue, setInputValue] = useState(value);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  async function searchAddress(q) {
    setInputValue(q);
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
    onSelect(latlng, place.display_name);
    setValue(place.display_name);
    setInputValue(place.display_name);
    setOpen(false);
  }

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <div className="relative mb-3 sm:mb-4">
      <label className="text-xs sm:text-sm font-medium text-gray-300">{label}</label>

      <div className="relative flex gap-2">
        {/* Input with icon */}
        <div className="relative flex-1 flex items-center">
          <span className="absolute left-2.5 sm:left-3 text-gray-400 text-lg sm:text-xl flex items-center justify-center h-full">
            {label === "Pickup" ? <FiMapPin /> : <FiFlag />}
          </span>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => searchAddress(e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}...`}
            className="w-full p-2.5 sm:p-3 pl-10 sm:pl-12 rounded-xl border border-gray-700 text-sm sm:text-base bg-gray-800 text-gray-100 placeholder-gray-400"
          />
        </div>

        {/* GPS button */}
        {showCurrentLocation && (
          <button
            onClick={onCurrentLocation}
            className="flex items-center justify-center mt-1 p-2.5 sm:p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
          >
            <img
              src="/gps.png"
              alt="current location"
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
            />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 bg-gray-800 border border-gray-700 rounded-xl max-h-40 sm:max-h-48 overflow-auto z-50 shadow-lg mt-1">
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

/* ---------------------------------------------------------
   Map Click Selector
--------------------------------------------------------- */
function LocationSelector({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
}

/* Auto center */
function AutoCenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 15);
  }, [position]);
  return null;
}

/* Fit bounds */
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

/* ---------------------------------------------------------
   Booking Page (Main)
--------------------------------------------------------- */
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
  const [showGuide, setShowGuide] = useState(true);

  // Terms of Use
  const [showTerms, setShowTerms] = useState(() => {
    return localStorage.getItem("acceptedTerms") !== "true";
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // NEW: Error message state
  const [errorMessage, setErrorMessage] = useState(null);

  const baseFare = 50;
  const baseKm = 3;
  const extraRate = 15;

  async function getAccurateDistance(start, end) {
    const apiKey =
      "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImZhMGNmMzAyYWZkNDRhMTNhMjlhOWVjZGM5NDAwNDFiIiwiaCI6Im11cm11cjY0In0=";
    const body = { coordinates: [[start.lng, start.lat], [end.lng, end.lat]] };

    try {
      setLoading(true);
      const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
        method: "POST",
        headers: { Authorization: apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setDistance(data.routes[0].summary.distance / 1000);
    } catch {
      setErrorMessage("Failed to get distance. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePickupSelect(latlng, name = null) {
    setPickup(latlng);
    if (dropoff) getAccurateDistance(latlng, dropoff);

    if (name) setPickupText(name);
    else await reverseGeocode(latlng, setPickupText);
  }

  async function handleDropoffSelect(latlng, name = null) {
    setDropoff(latlng);
    if (pickup) getAccurateDistance(pickup, latlng);

    if (name) setDropoffText(name);
    else await reverseGeocode(latlng, setDropoffText);
  }

  async function reverseGeocode(latlng, setter) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
      );
      const data = await res.json();
      if (data.display_name) setter(data.display_name);
    } catch {}
  }

  async function useCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        await handlePickupSelect(loc);
      },
      () => setErrorMessage("❌ Enable location services.")
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
    if (!pickup || !dropoff || !distance) return setErrorMessage("❌ Select pickup & drop-off first!");
    setBookingNumber(generateBookingNumber());
    setShowReceipt(true);
  }

  /* get location once */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {}
    );
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen">

      {/* ---------------------------------------------------------
        TERMS OF USE MODAL
      --------------------------------------------------------- */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-gray-100 border border-gray-700">

            <h2 className="text-xl sm:text-2xl font-bold text-center mb-4">
              Terms of Use
            </h2>

            <div className="space-y-3 text-sm sm:text-base max-h-64 overflow-y-auto">
              <p>By booking a ride, you agree to our terms and conditions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>All bookings are subject to availability.</li>
                <li>Fare estimates are calculated based on distance and rates.</li>
                <li>Ensure your pickup and drop-off locations are accurate.</li>
                <li>The service is provided as-is; the company is not liable for delays or incidents.</li>
                <li>Users must follow local traffic rules during rides.</li>
              </ul>

              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  id="termsCheckbox"
                  className="w-4 h-4 accent-blue-500"
                />
                <label htmlFor="termsCheckbox" className="text-sm sm:text-base">
                  I have read and agree to the Terms of Use
                </label>
              </div>
            </div>

            <button
              onClick={() => {
                if (acceptedTerms) {
                  localStorage.setItem("acceptedTerms", "true"); // ✅ save acceptance
                  setShowTerms(false);
                }
              }}
              disabled={!acceptedTerms}
              className={`w-full py-3 mt-6 rounded-xl font-semibold ${
                acceptedTerms ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 cursor-not-allowed"
              }`}
            >
              Continue
            </button>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------------
        GUIDE POPUP
      --------------------------------------------------------- */}
      {showGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-gray-100 border border-gray-700">

            <h2 className="text-xl sm:text-2xl font-bold text-center mb-4">
              How to Book a Ride
            </h2>

            <div className="space-y-3 text-sm sm:text-base">
              <p>✔ You can <span className="text-blue-400 font-semibold">search for Pickup</span> or <span className="text-blue-400 font-semibold">Drop-off</span> using the search bar.</p>
              <p>✔ You can also <span className="text-yellow-400 font-semibold">manually pin</span> a location by tapping on the map.</p>
              <p>✔ After choosing both locations, the system automatically calculates your fare.</p>
              <p>✔ Press <span className="text-green-400 font-semibold">Book Now</span> to confirm your ride.</p>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 mt-6 rounded-xl font-semibold"
            >
              Got it!
            </button>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------------
        RECEIPT POPUP
      --------------------------------------------------------- */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto text-gray-100">
            {/* Receipt content unchanged */}
            {/* ... keep your existing receipt JSX here ... */}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------
        SIDEBAR
      --------------------------------------------------------- */}
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
              const tLoc = pickup;
              const tText = pickupText;
              setPickup(dropoff);
              setPickupText(dropoffText);
              setDropoff(tLoc);
              setDropoffText(tText);
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
        />

        <button
          onClick={handleBookNow}
          disabled={!pickup || !dropoff || !distance || !acceptedTerms}
          className={`w-full ${
            acceptedTerms ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 cursor-not-allowed"
          } text-white py-3 rounded-xl text-lg font-semibold shadow-md transition-colors`}
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
            onClick={() => (window.location.href = "/")}
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

      {/* ---------------------------------------------------------
      MAP
      --------------------------------------------------------- */}
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
