import { el, icon, Loader, ErrorMessage, TypeBadge, PlaceSearch, formatKm, announce, TYPE_KEYS } from "../components.js";
import { getStats, getClinics, getNearest, getWithin } from "../api.js";
import { createMap, createClinicLayer, createLocationLayer } from "../map.js";
import { initPage, renderLegend, checkLatLon, checkRadiusKm, outsideZomba, OUTSIDE_MSG, errorInfo, errorAnnouncement } from "./common.js";
import { DEFAULTS } from "../config.js";

initPage("dashboard.html");
const $ = (id) => document.getElementById(id);
let tab = "nearest", all = [], results = [], ctl = null, busy = false;
renderLegend($("legend"));

/* ----- place search (villages and towns by name) ----- */
const place = PlaceSearch({ id: "place", label: "Search location", placeholder: "Enter village or click on map…",
  hint: "Type a village, town or landmark, or click the map.",
  onPick: (p) => { setLoc(p.lat, p.lon, `Place: ${p.name}`); map.setView([p.lat, p.lon], 13); $("analysis-form").requestSubmit(); } });
$("place-mount").append(place.el);
const setWhere = (t) => { $("where").className = t ? "where" : "where where--empty"; $("where").replaceChildren(icon("pin", 18), t || "No location chosen yet"); };
setWhere("");

/* ----- stat tiles ----- */
const TILES = [["total", "Total facilities", "building"], ["hospitals", "Hospitals", "building"], ["health_centers", "Health Centers", "heartpulse"], ["clinics", "Clinics", "stethoscope"]];
const tile = (l, ic, v) => el("div", { class: "tile" }, el("span", { class: "tile__icon" }, icon(ic, 26)), el("div", {}, el("p", { class: "tile__label", text: l }), el("p", { class: "tile__value", text: v })));
async function loadBase() {
  const c = new AbortController();
  $("tiles").replaceChildren(...TILES.map(([, l, ic]) => tile(l, ic, "…")));
  $("stats-error").replaceChildren();
  try {
    const [stats, clinics] = await Promise.all([getStats(c.signal), getClinics(TYPE_KEYS, c.signal)]);
    $("tiles").replaceChildren(...TILES.map(([k, l, ic]) => tile(l, ic, stats[k] != null ? String(stats[k]) : "–")));
    all = clinics; clinicLayer.set(all, results);
  } catch (e) {
    const i = errorInfo(e);
    $("tiles").replaceChildren();
    $("stats-error").replaceChildren(ErrorMessage({ message: i.message, offline: i.offline, onRetry: loadBase }));
    announce(errorAnnouncement(i));
  }
}

/* ----- map ----- */
const map = createMap($("map")), clinicLayer = createClinicLayer(map), locLayer = createLocationLayer(map);
map.on("click", (e) => { setLoc(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6), "Point you clicked on the map"); });
function setLoc(la, lo, label) { $("lat").value = la; $("lon").value = lo; clearErrors(); setWhere(label); syncLoc(); }
function syncLoc() {
  const ll = checkLatLon($("lat").value, $("lon").value);
  if (!ll.ok) { locLayer.clear(); $("loc-warn").textContent = ""; return; }
  locLayer.set(ll.lat, ll.lon, 0); $("loc-warn").textContent = outsideZomba(ll.lat, ll.lon) ? OUTSIDE_MSG : "";
}
[$("lat"), $("lon")].forEach((i) => i.addEventListener("input", () => { setWhere("Coordinates you entered"); syncLoc(); }));

/* ----- tabs ----- */
const tabs = [...document.querySelectorAll("[role=tab]")];
function selectTab(t, focus) {
  tab = t;
  tabs.forEach((b) => { const on = b.dataset.tab === t; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
  $("analysis-form").setAttribute("aria-labelledby", `tab-${t}`); $("radius-field").hidden = t !== "within";
  clearResults();
}
tabs.forEach((b, i) => {
  b.addEventListener("click", () => selectTab(b.dataset.tab));
  b.addEventListener("keydown", (e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") selectTab(tabs[(i + 1) % tabs.length].dataset.tab, true); });
});

/* ----- analysis ----- */
function clearErrors() { place.clearMessage(); ["lat", "lon", "radius"].forEach((k) => { $(k + "-error").textContent = ""; $(k).removeAttribute("aria-invalid"); }); }
function setError(k, m) { if (k === "lat" || k === "lon") $("advanced").open = true; $(k + "-error").textContent = m; $(k).setAttribute("aria-invalid", "true"); $(k).focus(); }
function clearResults() {
  ctl && ctl.abort(); results = []; busy = false; $("run").disabled = false; $("run").textContent = "Run analysis";
  clinicLayer.set(all, []); syncLoc();
  $("summary").replaceChildren(); $("table-wrap").replaceChildren(el("p", { class: "state", text: "Analysis not run yet" }));
}
$("analysis-form").addEventListener("submit", async (e) => {
  e.preventDefault(); if (busy) return;
  const ll = checkLatLon($("lat").value, $("lon").value), r = tab === "within" ? checkRadiusKm($("radius").value) : null;
  clearErrors();
  if (!$("lat").value.trim() && !$("lon").value.trim()) { place.setError("Choose a place first: search for your village, or click the map."); announce("Choose a place first."); return; }
  if (r) setError("radius", r); if (ll.errors.lon) setError("lon", ll.errors.lon); if (ll.errors.lat) setError("lat", ll.errors.lat);
  if (!ll.ok || r) { announce("Please fix the highlighted fields."); return; }
  ctl && ctl.abort(); const c = (ctl = new AbortController()); busy = true; $("run").disabled = true; $("run").textContent = "Running...";
  $("summary").replaceChildren(); $("table-wrap").replaceChildren(Loader("Searching for clinics...", 2)); announce("Searching for clinics...");
  const a = { lat: $("lat").value.trim(), lon: $("lon").value.trim(), types: TYPE_KEYS }, rk = Number($("radius").value);
  try {
    results = tab === "nearest" ? await getNearest({ ...a, count: DEFAULTS.count }, c.signal) : await getWithin({ ...a, radiusKm: rk }, c.signal);
    if (c !== ctl) return;
    clinicLayer.set(all, results); locLayer.set(ll.lat, ll.lon, tab === "within" ? rk : 0); show(rk);
  } catch (err) {
    if (err.name === "AbortError") return;
    const i = errorInfo(err);
    $("table-wrap").replaceChildren(ErrorMessage({ message: i.message, offline: i.offline, onRetry: () => $("analysis-form").requestSubmit() }));
    announce(errorAnnouncement(i));
  } finally { if (c === ctl) { busy = false; $("run").disabled = false; $("run").textContent = "Run analysis"; } }
});
function show(rk) {
  const n = results.length, w = tab === "within";
  if (!n) {
    const t = w ? `No clinics found within ${rk} km. Try a larger radius.` : "No clinics found. Try another location.";
    $("summary").replaceChildren(); $("table-wrap").replaceChildren(el("p", { class: "state state--empty", text: t })); announce(t); return;
  }
  let msg = `${n} clinic${n === 1 ? "" : "s"} found${w ? ` within ${rk} km` : ""}.`;
  const d = formatKm(results[0].distance_m);
  if (!w && d) msg += ` Closest: ${results[0].name}, ${d}.`;
  $("summary").replaceChildren(el("p", { class: "state state--success", role: "status", text: msg }));
  $("table-wrap").replaceChildren(el("div", { class: "scroll-x" }, el("table", { class: "table" },
    el("caption", { class: "sr-only", text: "Clinics ranked by distance" }),
    el("thead", {}, el("tr", {}, ["#", "Name", "Type", "Distance"].map((h) => el("th", { scope: "col", text: h })))),
    el("tbody", {}, results.map((c, i) => el("tr", {}, el("td", { text: i + 1 }), el("td", { text: c.name }), el("td", {}, TypeBadge(c.facility_type)), el("td", { text: formatKm(c.distance_m) || "–" })))))));
  announce(msg);
}
$("reset").addEventListener("click", () => { $("lat").value = ""; $("lon").value = ""; $("radius").value = "5"; place.reset(); setWhere(""); $("advanced").open = false; clearErrors(); selectTab("nearest"); locLayer.clear(); announce("Analysis reset."); });

selectTab("nearest"); loadBase();
