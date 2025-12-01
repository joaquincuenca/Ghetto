import { useState, useEffect } from "react";
import { FiMapPin, FiFlag } from "react-icons/fi";
import { GeocodeService } from '../../services/GeocodeService';

export default function AddressSearch({ 
    label, 
    value, 
    setValue, 
    onSelect, 
    showCurrentLocation, 
    onCurrentLocation 
    }) {
    const [inputValue, setInputValue] = useState(value);
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);

    async function searchAddress(q) {
        setInputValue(q);
        setValue(q);
        if (q.length < 2) {
        setResults([]);
        return;
        }

        const formatted = await GeocodeService.searchAddress(q);
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