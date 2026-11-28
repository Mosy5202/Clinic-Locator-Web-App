// Single place for runtime configuration.
export const API_BASE = "http://localhost:5000"; // Flask backend base URL
export const MOCK_API = new URLSearchParams(location.search).get("mock") === "1"; // add ?mock=1 to the page address for labelled sample data. Never use in the final demo.

export const MAP_DEFAULT = { center: [-15.38, 35.33], zoom: 11 };
// Approximate Zomba District bounding box [[south, west], [north, east]]. Used only to warn, never to block.
export const ZOMBA_BOUNDS = [[-15.65, 35.15], [-15.15, 35.65]];

export const DEFAULTS = { mode: "nearest", count: 3, radiusKm: 5, types: ["hospital", "health_center", "clinic"] };
export const RADIUS_OPTIONS_KM = [1, 2, 5, 10, 20];
export const MAX_RADIUS_KM = 100;
export const FINDER_COUNT = 5; // nearest clinics requested by the community finder

// Place-name search (villages, towns, landmarks) so people never need coordinates.
// "api"       = only the Flask /places endpoint (your PostGIS places table; see docs/backend-places.md)
// "nominatim" = only OpenStreetMap's free geocoder, limited to the Zomba box below
// "auto"      = try /places first; if the backend doesn't have it yet (404), fall back to Nominatim
export const PLACES_SOURCE = "auto";
export const GEOCODER_VIEWBOX = { west: 35.15, north: -15.15, east: 35.65, south: -15.65 }; // same box as ZOMBA_BOUNDS
