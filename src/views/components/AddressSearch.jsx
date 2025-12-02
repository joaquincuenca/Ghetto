import { useState, useEffect, useRef } from "react";
import { FiMapPin, FiFlag } from "react-icons/fi";
import { GeocodeService } from '../../services/GeocodeService';

export default function AddressSearch({ 
    label, 
    value, 
    setValue, 
    onSelect,
    onClear,
    showCurrentLocation, 
    onCurrentLocation 
}) {
    const [inputValue, setInputValue] = useState(value);
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSelected, setIsSelected] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const searchAddress = async () => {
            if (isSelected || !inputValue || inputValue.length < 2) {
                setResults([]);
                setOpen(false);
                return;
            }

            setLoading(true);

            try {
                const formatted = await GeocodeService.searchAddress(inputValue);
                setResults(formatted || []);
                setOpen(formatted && formatted.length > 0);
            } catch {
                setResults([]);
                setOpen(false);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(searchAddress, 500);
        return () => clearTimeout(timeoutId);
    }, [inputValue, isSelected]);

    useEffect(() => {
        if (value !== inputValue) {
            setInputValue(value);
            if (value && value.length > 0) {
                setIsSelected(true);
            }
        }
    }, [value]);

    function handleInputChange(newValue) {
        setInputValue(newValue);
        setValue(newValue);
        setIsSelected(false);
    }

    function choose(place) {
        const latlng = { 
            lat: parseFloat(place.lat), 
            lng: parseFloat(place.lon) 
        };

        setValue(place.display_name);
        setInputValue(place.display_name);
        setIsSelected(true);
        setOpen(false);
        setResults([]);

        if (onSelect) {
            onSelect(latlng);
        }
    }

    function clearInput() {
        setInputValue("");
        setValue("");
        setResults([]);
        setOpen(false);
        setIsSelected(false);

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

            {loading && (
                <div className="absolute left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl p-2 text-center text-xs text-gray-400 z-50">
                    Searching...
                </div>
            )}

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

            {open && !loading && inputValue.length >= 2 && results.length === 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl p-3 text-center text-xs text-gray-400 z-50">
                    No places found. Try a different search term.
                </div>
            )}
        </div>
    );
}
