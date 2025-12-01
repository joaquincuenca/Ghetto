import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
  useMap,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FiMapPin, FiFlag } from "react-icons/fi";
import { AiOutlineSwap } from "react-icons/ai";

// Custom Marker Icon
const markerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [38, 38],
});

/* ---------------------------------------------------------
   Enhanced Address Search with Places API
--------------------------------------------------------- */
function AddressSearch({ label, value, setValue, onSelect, showCurrentLocation, onCurrentLocation }) {
  const [inputValue, setInputValue] = useState(value);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  async function searchAddress(q) {
    setInputValue(q);
    setValue(q); // sync with parent
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=10&lat=14.1218&lon=122.9566`
    );
    const data = await res.json();

    const formatted = data.features.map(f => ({
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      display_name: f.properties.name + (f.properties.city ? `, ${f.properties.city}` : '') + (f.properties.state ? `, ${f.properties.state}` : ''),
      type: f.properties.type || 'place'
    }));

    setResults(formatted);
    setOpen(true);
  }

  function choose(place) {
    const latlng = { lat: parseFloat(place.lat), lng: parseFloat(place.lon) };
    onSelect(latlng, place.display_name);
    setValue(place.display_name);
    setInputValue(place.display_name);
    setOpen(false);
  }

  function clearInput() {
    setInputValue("");
    setValue("");
    setResults([]);
  }

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <div className="relative mb-3 sm:mb-4">
      <label className="text-xs sm:text-sm font-medium text-gray-300">{label}</label>

      <div className="relative flex gap-2">
        <div className="relative flex-1 flex items-center">
          <span className="absolute left-2.5 sm:left-3 text-gray-400 text-lg sm:text-xl flex items-center justify-center h-full">
            {label === "Pickup" ? <FiMapPin /> : <FiFlag />}
          </span>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => searchAddress(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder={`Enter ${label.toLowerCase()}...`}
            className="w-full p-2.5 sm:p-3 pl-10 sm:pl-12 rounded-xl border border-gray-700 text-sm sm:text-base bg-gray-800 text-gray-100 placeholder-gray-400"
          />

          {/* Clear Button */}
          {inputValue && (
            <button
              onClick={clearInput}
              className="absolute right-2.5 sm:right-3 text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 w-6 h-6 flex items-center justify-center rounded-full transition"
            >
              ×
            </button>
          )}
        </div>

        {showCurrentLocation && (
          <button
            onClick={onCurrentLocation}
            className="flex items-center justify-center mt-1 p-2.5 sm:p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
          >
            <FiMapPin className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 bg-gray-800 border border-gray-700 rounded-xl max-h-60 sm:max-h-72 overflow-auto z-50 shadow-lg mt-1">
          {results.map((place, i) => (
            <div
              key={i}
              className="p-3 cursor-pointer hover:bg-gray-700 text-xs sm:text-sm text-gray-200 border-b border-gray-700 last:border-0"
              onClick={() => choose(place)}
            >
              <div className="font-medium">{place.display_name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{place.type}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* ---------------------------------------------------------
   Map Components
--------------------------------------------------------- */
function LocationSelector({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
}

function AutoCenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 15);
  }, [position, map]);
  return null;
}

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

// Component to add route labels
function RouteLabels({ routeCoordinates, alternativeRoutes }) {
  const map = useMap();
  
  if (!routeCoordinates.length && !alternativeRoutes.length) return null;

  // Function to calculate midpoint of a route
  const getRouteMidpoint = (coordinates) => {
    if (coordinates.length === 0) return null;
    const middleIndex = Math.floor(coordinates.length / 2);
    return coordinates[middleIndex];
  };

  return (
    <>
      {/* Primary Route Label */}
      {routeCoordinates.length > 0 && (
        <Popup
          position={getRouteMidpoint(routeCoordinates)}
          permanent
          className="route-label-popup"
        >
          <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
            🚀 Fastest Route
          </div>
        </Popup>
      )}

      {/* Alternative Routes Labels */}
      {alternativeRoutes.map((altRoute, index) => {
        const midpoint = getRouteMidpoint(altRoute.coordinates);
        if (!midpoint) return null;
        
        return (
          <Popup
            key={`alt-label-${index}`}
            position={midpoint}
            permanent
            className="route-label-popup"
          >
            <div className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
              ⏱️ Slower Route {index + 1}
            </div>
          </Popup>
        );
      })}
    </>
  );
}

/* ---------------------------------------------------------
   Main Booking Page
--------------------------------------------------------- */
function BookingPage() {
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [distance, setDistance] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [alternativeRoutes, setAlternativeRoutes] = useState([]);
  const [duration, setDuration] = useState(null);

  const [pickupText, setPickupText] = useState("");
  const [dropoffText, setDropoffText] = useState("");

  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [bookingNumber, setBookingNumber] = useState("");
  const [showGuide, setShowGuide] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const baseFare = 50;
  const baseKm = 3;
  const extraRate = 15;

  // Get route with directions using OSRM - now with multiple route alternatives
  async function getRouteWithDirections(start, end) {
    try {
      setLoading(true);
      setRouteCoordinates([]); // Clear old route
      setAlternativeRoutes([]); // Clear old alternatives
      
      // OSRM API with alternatives=true to get multiple routes
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=true&steps=true`
      );
      
      const data = await res.json();
      
      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        // Primary route (fastest)
        const primaryRoute = data.routes[0];
        const primaryCoords = primaryRoute.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        const distanceKm = primaryRoute.distance / 1000;
        const durationMin = primaryRoute.duration / 60;
        
        setRouteCoordinates(primaryCoords);
        setDistance(distanceKm);
        setDuration(durationMin);
        
        // Alternative routes (if available)
        const alternatives = [];
        for (let i = 1; i < Math.min(data.routes.length, 3); i++) {
          const altRoute = data.routes[i];
          alternatives.push({
            coordinates: altRoute.geometry.coordinates.map(coord => [coord[1], coord[0]]),
            distance: altRoute.distance / 1000,
            duration: altRoute.duration / 60
          });
        }
        setAlternativeRoutes(alternatives);
      } else {
        throw new Error("No route found");
      }
    } catch (error) {
      console.error("Route calculation failed:", error);
      
      // Fallback: calculate straight-line distance
      const R = 6371;
      const dLat = (end.lat - start.lat) * Math.PI / 180;
      const dLng = (end.lng - start.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      setDistance(distance);
      setDuration(null);
      setRouteCoordinates([]);
      setAlternativeRoutes([]);
    } finally {
      setLoading(false);
    }
  }

  // Check if location is within Camarines Norte bounds
  function isWithinCamarinesNorte(latlng) {
    // Approximate bounds for Camarines Norte
    const bounds = {
      north: 14.7,
      south: 13.9,
      east: 123.1,
      west: 122.5
    };
    
    return (
      latlng.lat >= bounds.south &&
      latlng.lat <= bounds.north &&
      latlng.lng >= bounds.west &&
      latlng.lng <= bounds.east
    );
  }

  async function handlePickupSelect(latlng, name = null) {
    if (!isWithinCamarinesNorte(latlng)) {
      setErrorMessage("🚫 Out of Range! Service is only available within Camarines Norte, Bicol.");
      setPickup(null);           // Clear the pickup marker
      setPickupText("");         // Clear the input
      if (routeCoordinates.length > 0) setRouteCoordinates([]); // Clear route if any
      return;
    }
    
    setPickup(latlng);
    if (dropoff) getRouteWithDirections(latlng, dropoff);
    
    if (name) setPickupText(name);
    else await reverseGeocode(latlng, setPickupText);
  }

  async function handleDropoffSelect(latlng, name = null) {
    if (!isWithinCamarinesNorte(latlng)) {
      setErrorMessage("🚫 Out of Range! Service is only available within Camarines Norte, Bicol.");
      setDropoff(null);         // Clear the dropoff marker
      setDropoffText("");       // Clear the dropoff input field
      if (routeCoordinates.length > 0) setRouteCoordinates([]); // Clear route if any
      return;
    }
    
    setDropoff(latlng);
    if (pickup) getRouteWithDirections(pickup, latlng);
    
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
    setDuration(null);
    setRouteCoordinates([]);
    setAlternativeRoutes([]);
    setPickupText("");
    setDropoffText("");
  };

  const fare = distance != null
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
    if (!acceptedTerms) {
      setErrorMessage("❌ Please accept the Terms of Use!");
      return;
    }
    if (!pickup || !dropoff || !distance) {
      setErrorMessage("❌ Select pickup & drop-off first!");
      return;
    }
    setBookingNumber(generateBookingNumber());
    setShowReceipt(true);
  }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  useEffect(() => {
    const termsAccepted = localStorage.getItem("acceptedTerms");
    if (!termsAccepted) setShowTerms(true);
    else setAcceptedTerms(true);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Terms Popup */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-gray-100 border border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-4">Terms of Use</h2>
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
                localStorage.setItem("acceptedTerms", "true");
                setShowTerms(false);
              }}
              disabled={!acceptedTerms}
              className={`w-full py-3 mt-6 rounded-xl font-semibold ${acceptedTerms ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 cursor-not-allowed"}`}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Error Popup */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-900 text-gray-100 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center border border-red-600">
            <div className="text-6xl sm:text-7xl mb-4">🚫</div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-red-500">Out of Range!</h2>
            <p className="text-sm sm:text-base text-gray-300 mb-4">{errorMessage}</p>
            <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs sm:text-sm text-gray-400 mb-2">📍 Service Area:</p>
              <p className="text-sm font-semibold text-blue-400">Camarines Norte, Bicol Region</p>
              <p className="text-xs text-gray-400 mt-2">Covered municipalities: Daet, Basud, Mercedes, Vinzons, Talisay, San Lorenzo Ruiz, Paracale, Jose Panganiban, and more.</p>
            </div>
            <button
              onClick={() => {
                setErrorMessage(null);
                setPickupText("");
                setDropoffText("");
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold"
            >
              Got it
            </button>

          </div>
        </div>
      )}

      {/* Instruction Popup */}
      {showGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-gray-100 border border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-4">
              How to Book a Ride
            </h2>
            <div className="space-y-3 text-sm sm:text-base">
              <p>✔ Search for places using the <span className="text-blue-400 font-semibold">enhanced search</span> with autocomplete.</p>
              <p>✔ <span className="text-yellow-400 font-semibold">Tap on the map</span> to manually pin locations.</p>
              <p>✔ View the <span className="text-green-400 font-semibold">route visualization</span> with distance & duration.</p>
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

      {/* Receipt Popup */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto text-gray-100">
            <div className="p-6 sm:p-8">
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
                  <p className="text-xs sm:text-sm font-medium break-words">{pickupText}</p>
                </div>

                <div className="bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">🚩 Drop-off Location</p>
                  <p className="text-xs sm:text-sm font-medium break-words">{dropoffText}</p>
                </div>

                <div className="flex justify-between items-center py-2 border-t border-gray-700">
                  <span className="text-xs text-gray-400">Distance</span>
                  <span className="text-sm sm:text-base font-semibold">{distance?.toFixed(2)} km</span>
                </div>

                {duration && (
                  <div className="flex justify-between items-center py-2 border-t border-gray-700">
                    <span className="text-xs text-gray-400">Est. Duration</span>
                    <span className="text-sm sm:text-base font-semibold">{Math.round(duration)} min</span>
                  </div>
                )}

                <div className="bg-gray-800 p-3 rounded-lg space-y-2">
                  <p className="text-xs text-gray-400 mb-1">💰 Fare Breakdown</p>
                  <div className="flex justify-between text-sm">
                    <span>Base Fare (First {baseKm} km)</span>
                    <span>₱{baseFare.toFixed(2)}</span>
                  </div>
                  {distance > baseKm && (
                    <div className="flex justify-between text-sm">
                      <span>Extra Distance ({(distance - baseKm).toFixed(2)} km × ₱{extraRate})</span>
                      <span>₱{((distance - baseKm) * extraRate).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-700 my-2"></div>
                  <div className="flex justify-between items-center py-2 text-white font-bold text-lg">
                    <span>Total Fare</span>
                    <span>₱{fare.toFixed(2)}</span>
                  </div>
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
                onClick={() => window.open("https://www.facebook.com/profile.php?id=61582462506784", "_blank")}
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
              const tLoc = pickup;
              const tText = pickupText;
              setPickup(dropoff);
              setPickupText(dropoffText);
              setDropoff(tLoc);
              setDropoffText(tText);
              if (tLoc && dropoff) getRouteWithDirections(dropoff, tLoc);
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

        {loading && (
          <div className="text-center text-blue-400 text-sm mb-3">
            🔄 Calculating route...
          </div>
        )}

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
            onClick={() => (window.location.href = "/")}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-xl font-semibold shadow-md transition-colors"
          >
            Back to Homepage
          </button>
        </div>

        {pickup && dropoff && distance && (
          <div className="mt-6 p-5 bg-gray-800 border border-gray-700 rounded-xl shadow">
            <h3 className="text-lg font-bold mb-2 text-white">Ride Summary</h3>
            <p className="text-sm text-gray-300">Distance: {distance.toFixed(2)} km</p>
            {duration && (
              <p className="text-sm text-gray-300">Duration: ~{Math.round(duration)} minutes</p>
            )}
            <p className="text-xl text-blue-400 font-bold mt-3">Fare: ₱{fare.toFixed(2)}</p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-[300px] md:min-h-0">
        <MapContainer
          center={userLocation || { lat: 14.1218, lng: 122.9566 }}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {pickup && <Marker position={pickup} icon={markerIcon} />}
          {dropoff && <Marker position={dropoff} icon={markerIcon} />}
          
          {/* Alternative Routes (slower options) - Gray lines */}
          {alternativeRoutes.map((altRoute, index) => (
            <Polyline
              key={`alt-${index}`}
              positions={altRoute.coordinates}
              color="#6b7280" // Gray color for alternative routes
              weight={4}
              opacity={0.6}
              dashArray="5, 10" // Optional: make it dashed to distinguish more
            />
          ))}
          
          {/* Primary Route (fastest) - Blue line on top */}
          {routeCoordinates.length > 0 && (
            <Polyline
              positions={routeCoordinates}
              color="#3b82f6" // Blue color for primary route
              weight={6}
              opacity={0.9}
            />
          )}

          {/* Route Labels */}
          <RouteLabels 
            routeCoordinates={routeCoordinates} 
            alternativeRoutes={alternativeRoutes} 
          />

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