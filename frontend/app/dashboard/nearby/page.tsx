"use client";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, MapPin, Navigation, Search, Star } from "lucide-react";

type Facility = "hospital" | "clinic" | "pharmacy";
interface Place { placeId: string; name: string; address: string; rating: number | null; openNow: boolean | null; distance: string; latitude: number; longitude: number; }
export default function NearbyPage() {
  const [type, setType] = useState<Facility>("hospital");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Use your location or enter a town to start looking.");
  const [mapQuery, setMapQuery] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function searchPosition(position: { lat: number; lng: number }, category: Facility) {
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setLoading(true); setPlaces([]); setMessage("");
    setMapQuery(`${category} near ${position.lat},${position.lng}`);
    try {
      const res = await fetch(`/api/nearby?lat=${position.lat}&lng=${position.lng}&type=${category}`, { signal: request.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlaces(data.results || []);
      setMessage(data.message || (data.results.length ? "Distances are approximate. Confirm opening hours before travelling." : "No directory results in this area. Try Google Maps or another category."));
    } catch (error) {
      if (!request.signal.aborted) setMessage(error instanceof Error ? error.message : "We couldn't load nearby places. Try Google Maps.");
    } finally { if (!request.signal.aborted) setLoading(false); }
  }
  function detect() {
    if (!navigator.geolocation) { setMessage("Your browser cannot share a location. Enter a town instead."); return; }
    setLoading(true); setMessage("Waiting for your location...");
    navigator.geolocation.getCurrentPosition(position => {
      const next = { lat: position.coords.latitude, lng: position.coords.longitude };
      setCoords(next); searchPosition(next, type);
    }, () => { setLoading(false); setMessage("Location wasn't shared. Enter your town or area to search instead."); }, { timeout: 12000, maximumAge: 60000 });
  }
  function changeType(next: Facility) {
    setType(next);
    if (coords) searchPosition(coords, next);
    else if (location.trim() && mapQuery) setMapQuery(`${next} near ${location.trim()}`);
  }
  function searchTown(e: React.FormEvent) {
    e.preventDefault(); if (!location.trim()) return;
    controller.current?.abort(); setLoading(false); setCoords(null); setPlaces([]);
    setMapQuery(`${type} near ${location.trim()}`);
    setMessage("Explore the map, or open Google Maps for full listings and directions.");
  }
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  return <div className="space-y-6"><div><h1 className="font-serif text-3xl">Care close to you</h1><p className="mt-2 text-sm text-neutral-500">Find a hospital, clinic, or pharmacy. Check directly with the facility before travelling.</p></div>
    <form onSubmit={searchTown} className="flex flex-wrap gap-3"><label htmlFor="town" className="sr-only">Town or area</label><input id="town" value={location} onChange={e => setLocation(e.target.value)} maxLength={150} placeholder="Enter your town or area" className="min-w-0 flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" /><button type="submit" disabled={!location.trim()} className="flex items-center gap-2 rounded-xl bg-[#294e42] px-5 py-3 text-sm text-white disabled:opacity-50"><Search className="size-4" /> Search</button><button type="button" onClick={detect} disabled={loading} className="flex items-center gap-2 rounded-xl border border-neutral-300 px-4 py-3 text-sm disabled:opacity-50 dark:border-neutral-700"><Navigation className="size-4" /> Use my location</button></form>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="inline-flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-900">{(["hospital", "clinic", "pharmacy"] as const).map(category => <button key={category} aria-pressed={type === category} onClick={() => changeType(category)} className={`rounded-lg px-4 py-2 text-sm ${type === category ? "bg-white font-medium text-teal-800 shadow-sm dark:bg-neutral-800 dark:text-teal-300" : "text-neutral-500"}`}>{{ hospital: "Hospitals", clinic: "Clinics", pharmacy: "Pharmacies" }[category]}</button>)}</div>{mapQuery && <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-teal-800 underline underline-offset-4 dark:text-teal-300">Open Google Maps <ExternalLink className="size-4" /></a>}</div>
    {message && <p role="status" className="rounded-xl border border-neutral-200 bg-white p-4 text-sm leading-relaxed text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">{message}</p>}
    <div className={`grid gap-5 ${places.length ? "lg:grid-cols-2" : ""}`}>
      {loading ? <div role="status" className="flex items-center gap-3 py-8 text-sm text-neutral-500"><Loader2 className="size-5 animate-spin" /> Looking for nearby care...</div> : places.length > 0 && <div className="space-y-3">{places.map(place => <article key={place.placeId} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"><div className="flex justify-between gap-4"><h2 className="text-sm font-semibold">{place.name}</h2><span className="shrink-0 text-xs text-neutral-500">{place.distance}</span></div><p className="mt-2 text-sm text-neutral-500">{place.address}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-neutral-500">{place.rating !== null && <><Star className="size-3 text-amber-600" /> {place.rating}</>} {place.openNow === null ? "Hours unavailable" : place.openNow ? "Open now" : "Closed"}</span><a href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&destination_place_id=${encodeURIComponent(place.placeId)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-800 underline dark:text-teal-300">Directions <ExternalLink className="size-3" /></a></div></article>)}</div>}
      <div className="min-h-[420px] overflow-hidden rounded-2xl border border-neutral-200 bg-[#edf1e6] dark:border-neutral-800 dark:bg-neutral-900">{mapQuery ? <iframe title="Nearby healthcare facilities on Google Maps" src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-full min-h-[420px] w-full border-0" /> : <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 px-6 text-center text-neutral-500"><MapPin className="size-8 stroke-[1.5] text-[#71866a]" /><h2 className="font-serif text-2xl text-neutral-700 dark:text-neutral-300">A place to start nearby.</h2><p className="max-w-xs text-sm leading-relaxed">Your location is only used when you choose to share it. You can also search by town.</p></div>}</div>
    </div>
  </div>;
}
