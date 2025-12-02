import { useState, useEffect, useRef } from "react";
import { FiMapPin, FiFlag } from "react-icons/fi";
import { GeocodeService } from '../../services/GeocodeService';

export default function AddressSearch({ 
    label, 
    value, 
    setValue, 
    onSelect,
    onClear, // Add onClear prop
    showCurrentLocation, 
    onCurrentLocation 
}) {
    const [inputValue, setInputValue] = useState(value);
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSelected, setIsSelected] = useState(false); // Track if address was selected
    const wrapperRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search with proper async handling
    useEffect(() => {
        const searchAddress = async () => {
            // Don't search if address was just selected or input is too short
            if (isSelected || !inputValue || inputValue.length < 2) {
                setResults([]);
                setOpen(false);
                return;
            }

            setLoading(true);
            console.log("🔍 Searching for:", inputValue);

            try {
                const formatted = await GeocodeService.searchAddress(inputValue);
                console.log("✅ Search results:", formatted);
                
                setResults(formatted || []);
                setOpen(formatted && formatted.length > 0);
            } catch (error) {
                console.error("❌ Search error:", error);
                setResults([]);
                setOpen(false);
            } finally {
                setLoading(false);
            }
        };

        // Debounce: wait 500ms after user stops typing
        const timeoutId = setTimeout(searchAddress, 500);
        return () => clearTimeout(timeoutId);
    }, [inputValue, isSelected]);

    // Sync with external value changes
    useEffect(() => {
        // Only update if the value is different and not empty
        if (value !== inputValue) {
            setInputValue(value);
            // If value is being set externally (e.g., from map click or reverse geocode),
            // mark it as selected to prevent dropdown
            if (value && value.length > 0) {
                setIsSelected(true);
            }
        }
    }, [value]);

    function handleInputChange(newValue) {
        setInputValue(newValue);
        setValue(newValue);
        setIsSelected(false); // User is typing again, allow searches
    }

    function choose(place) {
        console.log("📍 Selected place:", place);
        
        const latlng = { 
            lat: parseFloat(place.lat), 
            lng: parseFloat(place.lon) 
        };
        
        // Update input and value
        setValue(place.display_name);
        setInputValue(place.display_name);
        setIsSelected(true); // Mark as selected
        setOpen(false);
        setResults([]);
        
        // Call onSelect with coordinates
        if (onSelect) {
            onSelect(latlng);
        }
    }

    function clearInput() {
        setInputValue("");
        setValue("");
        setResults([]);
        setOpen(false);
        setIsSelected(false); // Reset selection state
        
        // Notify parent to clear the location
        if (onClear) {
            onClear();
        }
    }

    return (
        <div ref={wrapperRef} className="relative mb-3 sm:mb-4">
            <label className="text-xs sm:text-sm font-medium text-gray-300 block mb-2">
                {label}
            </label>

            <div className="relative flex gap-2">
                <div className="relative flex-1 flex items-center">
                    <span className="absolute left-2.5 sm:left-3 text-gray-400 text-lg sm:text-xl flex items-center justify-center h-full">
                        {label === "Pickup" ? <FiMapPin /> : <FiFlag />}
                    </span>

                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onFocus={() => {
                            // Only show dropdown if user hasn't selected an address yet
                            if (results.length > 0 && !isSelected) {
                                setOpen(true);
                            }
                        }}
                        placeholder={`Enter ${label.toLowerCase()}...`}
                        className="w-full p-2.5 sm:p-3 pl-10 sm:pl-12 pr-10 rounded-xl border border-gray-700 text-sm sm:text-base bg-gray-800 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {loading && (
                        <span className="absolute right-2.5 sm:right-3 text-gray-400 animate-spin">
                            ⏳
                        </span>
                    )}

                    {inputValue && !loading && (
                        <button
                            onClick={clearInput}
                            className="absolute right-2.5 sm:right-3 text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 w-6 h-6 flex items-center justify-center rounded-full transition"
                            type="button"
                        >
                            ×
                        </button>
                    )}
                </div>

                {showCurrentLocation && (
                    <button
                        onClick={onCurrentLocation}
                        className="flex items-center justify-center p-2.5 sm:p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                        type="button"
                        title="Use current location"
                    >
                        <FiMapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                )}
            </div>

            {/* Loading indicator */}
            {loading && (
                <div className="absolute left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl p-2 text-center text-xs text-gray-400 z-50">
                    Searching...
                </div>
            )}

            {/* Suggestions dropdown */}
            {open && !loading && results.length > 0 && (
                <div className="absolute left-0 right-0 bg-gray-800 border border-gray-700 rounded-xl max-h-60 sm:max-h-72 overflow-auto z-50 shadow-lg mt-1">
                    {results.map((place, i) => (
                        <div
                            key={`${place.lat}-${place.lon}-${i}`}
                            className="p-3 cursor-pointer hover:bg-gray-700 text-xs sm:text-sm text-gray-200 border-b border-gray-700 last:border-0 transition-colors"
                            onClick={() => choose(place)}
                        >
                            <div className="font-medium">{place.display_name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{place.type}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* No results message */}
            {open && !loading && inputValue.length >= 2 && results.length === 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl p-3 text-center text-xs text-gray-400 z-50">
                    No places found. Try a different search term.
                </div>
            )}
        </div>
    );
}