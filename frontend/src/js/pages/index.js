import { ClinicCard, Loader, ErrorMessage, EmptyState, SuccessMessage, SearchForm, announce } from "../components.js";
import { DEFAULTS, MAP_DEFAULT } from "../config.js";
import { getClinics, getNearest, getWithin } from "../api.js";
import { createMap, createClinicLayer, createLocationLayer } from "../map.js";
import { initPage, isNarrow, renderLegend, checkLatLon, checkRadiusKm, outsideZomba, OUTSIDE_MSG, errorInfo, errorAnnouncement } from "./common.js";

initPage("index.html");
const $ = (id) => document.getElementById(id);
const resultsEl = $("results"), titleEl = $("results-title"), sheet = $("panel-results");
const state = { all: [], results: [], last: null, ctl: null, loadCtl: null };
renderLegend($("legend"));
if (isNarrow()) sheet.open = false; // phones: results sheet starts closed so it does not cover the search panel; it opens when a search runs

const form = SearchForm({ onSubmit: (v) => search(v), onReset: reset, onChange,
  onPlace: (p) => { syncLocation(); map.setView([p.lat, p.lon], 13); search(form.get()); } }); // picking a place searches straight away
$("search-mount").append(form.el);

const map = createMap($("map"));
const clinicLayer = createClinicLayer(map);
const locLayer = createLocationLayer(map);
map.on("click", (e) => { form.clearErrors(); form.setLocation(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6), "", "Point you tapped on the map"); syncLocation(); });
form.el.addEventListener("input", syncLocation);

function syncLocation() {
  const v = form.get(), ll = checkLatLon(v.lat, v.lon);
  if (!ll.ok) { locLayer.clear(); form.setWarning(""); return; }
  locLayer.set(ll.lat, ll.lon, 0);
  form.setWarning(outsideZomba(ll.lat, ll.lon) ? OUTSIDE_MSG : "");
}
function showInitial() {
  titleEl.textContent = "Results";
  resultsEl.replaceChildren(EmptyState({ title: "Ready to search", hint: "Search for your village, or tap the map, then press Find Clinics." }));
}
function showError(e, retry) {
  const i = errorInfo(e);
  resultsEl.replaceChildren(ErrorMessage({ message: i.message, offline: i.offline, onRetry: retry }));
  announce(errorAnnouncement(i));
}
async function loadClinics() {
  state.loadCtl && state.loadCtl.abort();
  const c = (state.loadCtl = new AbortController()), types = form.get().types;
  if (!types.length) { state.all = []; clinicLayer.set([], []); return; }
  try { state.all = await getClinics(types, c.signal); clinicLayer.set(state.all, state.results); }
  catch (e) { if (e.name !== "AbortError") showError(e, loadClinics); }
}
function validate(v) {
  const none = !v.lat && !v.lon; // nothing chosen yet: ask in plain words, not "latitude"
  const e = none ? { place: "Choose a place first: search for your village, or tap the map." } : { ...checkLatLon(v.lat, v.lon).errors };
  if (v.mode === "within") { const r = checkRadiusKm(v.radiusKm); if (r) e.radius = r; }
  if (!v.types.length) e.types = "Select at least one facility type.";
  return e;
}
function showErrors(e) {
  form.clearErrors();
  ["types", "radius", "lon", "lat", "place"].forEach((k) => e[k] && form.setFieldError(k, e[k])); // last call focuses the first invalid field
}
async function search(v) {
  const errs = validate(v);
  if (Object.keys(errs).length) { showErrors(errs); announce("Please fix the highlighted fields."); return; }
  form.clearErrors();
  const ll = checkLatLon(v.lat, v.lon);
  state.last = v; state.ctl && state.ctl.abort();
  const c = (state.ctl = new AbortController());
  form.setBusy(true); locLayer.set(ll.lat, ll.lon, 0); state.results = []; clinicLayer.set(state.all, []);
  if (outsideZomba(ll.lat, ll.lon)) form.setWarning(OUTSIDE_MSG);
  resultsEl.replaceChildren(Loader("Searching for clinics...", 3)); announce("Searching for clinics...");
  if (isNarrow()) { sheet.open = true; $("map").scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); } // phones: show the map above the results sheet
  try {
    const a = { lat: v.lat, lon: v.lon, types: v.types };
    const data = v.mode === "nearest" ? await getNearest({ ...a, count: DEFAULTS.count }, c.signal) : await getWithin({ ...a, radiusKm: Number(v.radiusKm) }, c.signal);
    if (c !== state.ctl) return;
    state.results = data; render(v, data, ll);
  } catch (e) {
    if (e.name === "AbortError") return;
    state.results = []; showError(e, () => search(state.last));
  } finally { if (c === state.ctl) form.setBusy(false); }
}
function render(v, data, ll) {
  const n = data.length, within = v.mode === "within";
  titleEl.textContent = within ? `Clinics within ${v.radiusKm} km` : "Nearest Clinics (Top 3)";
  clinicLayer.set(state.all, data);
  if (within) locLayer.set(ll.lat, ll.lon, Number(v.radiusKm));
  if (!n) {
    const t = within ? `No clinics found within ${v.radiusKm} km.` : "No clinics found.";
    resultsEl.replaceChildren(EmptyState({ title: t, hint: within ? "Try a larger radius." : "Try another location or more facility types." }));
    announce(t + (within ? " Try a larger radius." : "")); return;
  }
  const near = v.place ? v.place : "your location";
  const msg = `Found ${n} clinic${n === 1 ? "" : "s"} near ${near}${within ? ` within ${v.radiusKm} km` : ""}.`;
  resultsEl.replaceChildren(
    Object.assign(document.createElement("ol"), { className: "card-list" }),
    SuccessMessage(msg));
  resultsEl.firstChild.append(...data.map((c, i) => ClinicCard(c, { rank: i + 1, onView: (x) => clinicLayer.open(x) })));
  announce(msg);
  map.fitBounds(L.latLngBounds([[ll.lat, ll.lon], ...data.map((d) => [d.lat, d.lon])]), { padding: [40, 40], maxZoom: 15 });
}
function onChange(kind) { // changing radius, mode or filters re-runs the last search
  if (kind === "location") { syncLocation(); return; }
  if (kind === "types") loadClinics();
  if (state.last) search({ ...form.get() });
}
function reset() {
  state.ctl && state.ctl.abort(); state.last = null; state.results = [];
  locLayer.clear(); form.setBusy(false); showInitial(); map.setView(MAP_DEFAULT.center, MAP_DEFAULT.zoom);
  loadClinics(); announce("Search reset.");
}
showInitial(); loadClinics();
