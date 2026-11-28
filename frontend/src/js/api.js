import { API_BASE, MOCK_API, PLACES_SOURCE, GEOCODER_VIEWBOX } from "./config.js";

export class ApiError extends Error {
  constructor(message, offline = false, status = 0) { super(message); this.name = "ApiError"; this.offline = offline; this.status = status; }
}

export async function request(path, params = {}, signal) {
  if (MOCK_API) return mockRequest(path, params, signal);
  const qs = new URLSearchParams(params).toString();
  let res;
  try { res = await fetch(`${API_BASE}${path}${qs ? "?" + qs : ""}`, { signal }); }
  catch (e) { if (e.name === "AbortError") throw e; throw new ApiError("Can't reach the server.", true); }
  let body = null;
  try { body = await res.json(); } catch { /* not JSON */ }
  if (!res.ok) throw new ApiError((body && body.error) || `Server error (${res.status})`, false, res.status);
  if (body == null) throw new ApiError("The server sent an unexpected response.");
  return body;
}

const t = (types) => types.join(",");
export const getClinics = (types, signal) => request("/clinics", { type: t(types) }, signal);
export const getNearest = ({ lat, lon, count = 3, types }, signal) => request("/clinics/nearest", { lat, lon, limit: count, type: t(types) }, signal);
export const getWithin = ({ lat, lon, radiusKm, types }, signal) => request("/clinics/within", { lat, lon, radius: Math.round(radiusKm * 1000), type: t(types) }, signal);
export const getStats = (signal) => request("/stats", {}, signal);

/* Place search: village / town / landmark name - coordinates */
const clean = (r) => ({ name: String(r.name || "").trim(), area: r.area ? String(r.area).trim() : "", lat: Number(r.lat), lon: Number(r.lon) });
const valid = (p) => p.name && isFinite(p.lat) && isFinite(p.lon);

export async function searchPlaces(q, signal) {
  if (MOCK_API) return mockPlaces(q, signal);
  if (PLACES_SOURCE !== "nominatim") {
    try { return (await request("/places", { q }, signal)).map(clean).filter(valid); }
    catch (e) {
      // Only fall back when the backend simply doesn't have /places yet.
      if (PLACES_SOURCE === "api" || e.name === "AbortError" || e.offline || e.status !== 404) throw e;
    }
  }
  return nominatim(q, signal);
}

async function nominatim(q, signal) {
  const v = GEOCODER_VIEWBOX;
  const qs = new URLSearchParams({ q, format: "jsonv2", limit: "8", countrycodes: "mw", bounded: "1", "accept-language": "en",
    viewbox: `${v.west},${v.north},${v.east},${v.south}` });
  let res;
  try { res = await fetch(`https://nominatim.openstreetmap.org/search?${qs}`, { signal }); }
  catch (e) { if (e.name === "AbortError") throw e; throw new ApiError("Can't reach the place search.", true); }
  if (!res.ok) throw new ApiError("Place search is not available right now. Try again, or tap the map.");
  const rows = await res.json(), seen = new Set();
  return rows.map((r) => {
    const parts = String(r.display_name || "").split(",").map((s) => s.trim()).filter(Boolean);
    return clean({ name: r.name || parts[0], area: parts.slice(1).filter((s) => s !== "Malawi").slice(0, 2).join(", "), lat: r.lat, lon: r.lon });
  }).filter(valid).filter((p) => { const k = `${p.name}|${p.lat.toFixed(3)}|${p.lon.toFixed(3)}`; return seen.has(k) ? false : seen.add(k); });
}

/* MOCK (sample data only; MOCK_API=false by default; never use in the final demo) */
const ROWS = [
  [1, "Sample Hospital A", "Hospital", -15.385, 35.318], [2, "Sample Health Center B", "Health Center", -15.402, 35.345],
  [3, "Sample Clinic C", "Clinic", -15.37, 35.296], [4, "Sample Hospital D", "Hospital", -15.44, 35.28],
  [5, "Sample Health Center E", "Health Center", -15.33, 35.38], [6, "Sample Clinic F", "Clinic", -15.5, 35.4],
  [7, "Sample Clinic G", "Clinic", -15.29, 35.25], [8, "Sample Health Center H", "Health Center", -15.46, 35.5],
].map(([id, name, facility_type, lat, lon]) => ({ id, name, facility_type, lat, lon }));
const KEY = { "Hospital": "hospital", "Health Center": "health_center", "Clinic": "clinic" };
const hav = (a, b, c, d) => { const r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r, q = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2; return 12742000 * Math.asin(Math.sqrt(q)); };

async function mockRequest(path, p, signal) { // MOCK ONLY: stands in for PostGIS
  await new Promise((ok, no) => { const id = setTimeout(ok, 400); signal && signal.addEventListener("abort", () => { clearTimeout(id); no(new DOMException("Aborted", "AbortError")); }); });
  if (path === "/stats") { const n = (k) => ROWS.filter((r) => KEY[r.facility_type] === k).length; return { total: ROWS.length, hospitals: n("hospital"), health_centers: n("health_center"), clinics: n("clinic") }; }
  const ts = p.type ? p.type.split(",") : Object.values(KEY);
  let rows = ROWS.filter((c) => ts.includes(KEY[c.facility_type]));
  if (path === "/clinics") return rows;
  rows = rows.map((c) => ({ ...c, distance_m: hav(+p.lat, +p.lon, c.lat, c.lon) })).sort((a, b) => a.distance_m - b.distance_m);
  if (path === "/clinics/nearest") return rows.slice(0, +p.count || 3);
  if (path === "/clinics/within") return rows.filter((c) => c.distance_m <= +p.radius);
  throw new ApiError("Not found");
}

const MOCK_PLACES = [["Sample Village Alpha", "Zomba", -15.385, 35.318], ["Sample Village Beta", "Zomba", -15.43, 35.29], ["Sample Market Gamma", "Zomba", -15.33, 35.38]]
  .map(([name, area, lat, lon]) => ({ name, area, lat, lon }));
async function mockPlaces(q, signal) { // MOCK ONLY
  await new Promise((ok, no) => { const id = setTimeout(ok, 300); signal && signal.addEventListener("abort", () => { clearTimeout(id); no(new DOMException("Aborted", "AbortError")); }); });
  return MOCK_PLACES.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
}
