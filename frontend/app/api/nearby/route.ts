import { auth } from "@/auth";
import { NextResponse } from "next/server";

interface GooglePlace {
  place_id: string; name: string; vicinity?: string; rating?: number;
  opening_hours?: { open_now?: boolean };
  geometry?: { location?: { lat: number; lng: number } };
}
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const query = new URL(req.url).searchParams;
  const latitude = query.get("lat"), longitude = query.get("lng");
  const lat = Number(latitude), lng = Number(longitude);
  const type = query.get("type") || "hospital";
  if (!latitude || !longitude || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || !["hospital", "clinic", "pharmacy"].includes(type)) {
    return NextResponse.json({ error: "Choose a facility type and a valid location." }, { status: 400 });
  }
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${type} near ${lat},${lng}`)}`;
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ results: [], configured: false, mapsUrl, message: "Open Google Maps to see live results for this area." });
  try {
    const params = new URLSearchParams({ location: `${lat},${lng}`, radius: "5000", type: type === "clinic" ? "doctor" : type, key });
    if (type === "clinic") params.set("keyword", "clinic");
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`, { signal: AbortSignal.timeout(12000), cache: "no-store" });
    const data = await res.json();
    if (!res.ok || !["OK", "ZERO_RESULTS"].includes(data.status)) throw new Error("Directory unavailable");
    const results = ((data.results || []) as GooglePlace[]).flatMap(place => {
      const position = place.geometry?.location;
      if (!position || !Number.isFinite(position.lat) || !Number.isFinite(position.lng)) return [];
      const radians = (n: number) => n * Math.PI / 180;
      const a = Math.sin(radians(position.lat - lat) / 2) ** 2 + Math.cos(radians(lat)) * Math.cos(radians(position.lat)) * Math.sin(radians(position.lng - lng) / 2) ** 2;
      const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
      return [{ placeId: place.place_id, name: place.name, address: place.vicinity || "Address unavailable", rating: place.rating ?? null,
        openNow: place.opening_hours?.open_now ?? null, distance: `${distance.toFixed(1)} km`, latitude: position.lat, longitude: position.lng }];
    });
    return NextResponse.json({ results, configured: true, mapsUrl });
  } catch {
    return NextResponse.json({ results: [], configured: false, mapsUrl, message: "The directory is unavailable. You can still search this area in Google Maps." });
  }
}
