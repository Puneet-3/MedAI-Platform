"use client";

import { useState, useEffect } from "react";
import { 
  MapPin, 
  Map, 
  Clock, 
  Star, 
  Navigation, 
  Search, 
  Loader2, 
  AlertCircle,
  Building,
  HeartPulse
} from "lucide-react";

interface Place {
  placeId: string;
  name: string;
  address: string;
  rating: number;
  openNow: boolean;
  distance: string;
  latitude: number;
  longitude: number;
}

export default function NearbyFinderPage() {
  const [type, setType] = useState<"hospital" | "clinic" | "pharmacy">("hospital");
  const [places, setPlaces] = useState<Place[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapSource, setMapSource] = useState<string>("");

  const detectLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
      },
      (err) => {
        console.error("Location error:", err);
        // Fallback to Chennai default coordinate (VIT Chennai)
        setLat(12.8406);
        setLng(80.1534);
        setError("Location permission denied. Defaulted search to VIT Chennai coordinates.");
      }
    );
  };

  const fetchNearby = async () => {
    if (lat === null || lng === null) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&type=${type}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load facilities.");

      setPlaces(data.results || []);
      // Set the Google Maps iframe source centered on coords
      setMapSource(`https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Run detectLocation on initial load
  useEffect(() => {
    detectLocation();
  }, []);

  // Fetch nearby places when coordinates or facility type changes
  useEffect(() => {
    if (lat !== null && lng !== null) {
      fetchNearby();
    }
  }, [lat, lng, type]);

  const selectPlace = (place: Place) => {
    setMapSource(`https://maps.google.com/maps?q=${place.latitude},${place.longitude}&z=16&output=embed`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Facility Finder</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Locate nearby registered hospitals, clinics, and pharmaceutical outlets based on your geographical coordinates.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/10 border border-amber-250/20 text-amber-850 dark:text-amber-450 text-xs flex gap-2 items-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Toggle buttons */}
        <div className="inline-flex rounded-xl bg-neutral-100 dark:bg-neutral-900 p-1 border border-neutral-200/50 dark:border-neutral-800 text-xs font-bold text-neutral-550">
          <button
            onClick={() => setType("hospital")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              type === "hospital" 
                ? "bg-white dark:bg-neutral-800 text-indigo-650 dark:text-indigo-400 shadow-sm" 
                : "hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            Hospitals
          </button>
          <button
            onClick={() => setType("clinic")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              type === "clinic" 
                ? "bg-white dark:bg-neutral-800 text-indigo-650 dark:text-indigo-400 shadow-sm" 
                : "hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            Clinics
          </button>
          <button
            onClick={() => setType("pharmacy")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              type === "pharmacy" 
                ? "bg-white dark:bg-neutral-800 text-indigo-650 dark:text-indigo-400 shadow-sm" 
                : "hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            Pharmacies
          </button>
        </div>

        {/* Location detect button */}
        <button
          onClick={detectLocation}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-200 dark:border-neutral-850 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-950 text-xs font-bold transition-all text-neutral-700 dark:text-neutral-300"
        >
          <MapPin className="w-4 h-4 text-emerald-600 animate-bounce" /> Detect Location
        </button>
      </div>

      {/* Finder Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Places List */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex-1 flex flex-col min-h-[450px]">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-neutral-555" />
              Search Results
            </h3>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                <span className="text-xs text-neutral-500 font-semibold">Scanning local sector...</span>
              </div>
            ) : places.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {places.map((place) => (
                  <div
                    key={place.placeId}
                    onClick={() => selectPlace(place)}
                    className="p-4 border border-neutral-100 dark:border-neutral-850 hover:border-indigo-500/40 bg-neutral-50/10 dark:bg-neutral-950/10 hover:bg-indigo-55/5 dark:hover:bg-indigo-950/5 rounded-2xl cursor-pointer transition-all space-y-3 group"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-xs font-black text-neutral-800 dark:text-neutral-200 group-hover:text-indigo-650 dark:group-hover:text-indigo-455 transition-colors">
                          {place.name}
                        </h4>
                        <p className="text-[10px] text-neutral-500 mt-1">
                          {place.address}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                          {place.distance}
                        </span>
                        
                        <div className="flex items-center gap-0.5 text-xs text-amber-500 font-extrabold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{place.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-neutral-150/40 dark:border-neutral-800/45">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${
                        place.openNow ? "text-emerald-650" : "text-neutral-450"
                      }`}>
                        <Clock className="w-3 h-3" /> {place.openNow ? "Open Now" : "Closed"}
                      </span>
                      
                      <span className="text-[9px] font-bold text-neutral-400 group-hover:text-indigo-600 flex items-center gap-0.5 transition-all">
                        <Navigation className="w-3 h-3" /> Navigate
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <HeartPulse className="w-8 h-8 text-neutral-400" />
                <h4 className="text-xs font-bold text-neutral-700">No facilities found</h4>
                <p className="text-[10px] text-neutral-450 max-w-xs mx-auto">
                  Try reloading or selecting a different facility filter type.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Embedded Map */}
        <div className="lg:col-span-6 min-h-[450px]">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm h-full flex flex-col p-4">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-1.5">
              <Map className="w-4 h-4 text-neutral-555" />
              Live Sector Map
            </h3>

            <div className="flex-1 rounded-2xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 min-h-[350px]">
              {mapSource ? (
                <iframe
                  title="Sector Map"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={mapSource}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500">
                  <Map className="w-8 h-8 animate-pulse text-neutral-400" />
                  <span className="text-[10px] mt-2">Connecting map feed...</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
