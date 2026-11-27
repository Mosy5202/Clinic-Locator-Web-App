import { el, icon, ClinicCard, Loader, ErrorMessage, EmptyState, TypeBadge, PlaceSearch, makeMarker, markerLabel, formatKm, announce, TYPE_KEYS } from "../components.js";
import { FINDER_COUNT } from "../config.js";
import { getNearest } from "../api.js";
import { createMap, createClinicLayer, createLocationLayer } from "../map.js";
import { initPage, errorInfo, errorAnnouncement } from "./common.js";

initPage("finder.html");
const $ = (id) => document.getElementById(id);
const S = { origin: null, results: [], ctl: null, busy: false, view: "list", map: null, layer: null, loc: null };

/* ----- locate: "near me" or by village / town name ----- */
const place = PlaceSearch({ id: "place", label: "Village, town or landmark", placeholder: "Enter village or town name",
  onPick: (p) => run(p.lat, p.lon, p.name) });
$("place-mount").append(place.el);

$("locate").addEventListener("click", () => {
  if (S.busy) return;
  if (!("geolocation" in navigator)) return fallback("This phone can't share its location.");
  setBusy(true, "Finding your location...");
  navigator.geolocation.getCurrentPosition(
    (p) => run(p.coords.latitude.toFixed(6), p.coords.longitude.toFixed(6), ""),
    (err) => { setBusy(false); fallback(err.code === 1 ? "Location is turned off for this page." : "We couldn't find your location."); },
    { timeout: 10000, maximumAge: 60000 });
});
function fallback(msg) {
  $("geo-msg").textContent = `${msg} Type your village or town below instead.`; announce($("geo-msg").textContent);
  place.focus();
}
function setBusy(b, label) {
  S.busy = b; $("locate").disabled = b;
  $("locate-label").textContent = b && label ? label : "Find Clinics Near Me";
}

/* ----- search ----- */
async function run(lat, lon, name = "") {
  S.ctl && S.ctl.abort(); const c = (S.ctl = new AbortController());
  S.origin = { lat: Number(lat), lon: Number(lon), name }; S.results = [];
  setBusy(true); $("geo-msg").textContent = ""; $("toolbar").hidden = true;
  $("results").hidden = S.view === "map"; $("results").replaceChildren(Loader("Searching for clinics...", 3)); announce("Searching for clinics...");
  try {
    const data = await getNearest({ lat, lon, count: FINDER_COUNT, types: TYPE_KEYS }, c.signal);
    if (c !== S.ctl) return;
    S.results = data; render();
  } catch (e) {
    if (e.name === "AbortError") return;
    const i = errorInfo(e);
    $("results").hidden = false; $("results").replaceChildren(ErrorMessage({ message: i.message, offline: i.offline, onRetry: () => run(lat, lon, name) })); announce(errorAnnouncement(i));
  } finally { if (c === S.ctl) setBusy(false); }
}
function render() {
  const n = S.results.length;
  if (!n) { $("results").hidden = false; $("results").replaceChildren(EmptyState({ title: "No clinics found.", hint: "Try another location." })); announce("No clinics found."); return; }
  const msg = `${n} clinic${n === 1 ? "" : "s"} found near ${S.origin.name || "you"}`;
  $("toolbar").hidden = false; $("count").textContent = msg; announce(msg);
  const ol = el("ol", { class: "card-list" }, S.results.map((c, i) => ClinicCard(c, { rank: i + 1, viewLabel: "Details", viewIcon: "chevron", onView: openDetail })));
  $("results").replaceChildren(ol); showView(S.view);
}

/* ----- list / map ----- */
function showView(v) {
  S.view = v;
  $("view-list").setAttribute("aria-pressed", v === "list"); $("view-map").setAttribute("aria-pressed", v === "map");
  $("results").hidden = v !== "list" || !S.results.length; $("map-wrap").hidden = v !== "map";
  if (v === "map") {
    if (!S.map) { S.map = createMap($("map")); S.layer = createClinicLayer(S.map, { onSelect: openDetail }); S.loc = createLocationLayer(S.map); }
    S.map.invalidateSize(); S.layer.set(S.results, S.results);
    S.loc.set(S.origin.lat, S.origin.lon, 0);
    S.map.fitBounds(L.latLngBounds([[S.origin.lat, S.origin.lon], ...S.results.map((r) => [r.lat, r.lon])]), { padding: [30, 30], maxZoom: 15 });
  }
}
$("view-list").addEventListener("click", () => showView("list"));
$("view-map").addEventListener("click", () => showView("map"));

/* ----- details ----- */
let opener = null, dMap = null;
function openDetail(c) {
  opener = document.activeElement;
  const back = el("button", { type: "button", class: "btn btn--secondary", text: "Back to results", onClick: closeDetail });
  const d = formatKm(c.distance_m), mapDiv = el("div", { class: "detail__map", role: "region", "aria-label": "Map showing the clinic location" });
  const dlg = el("div", { class: "detail", role: "dialog", "aria-modal": "true", "aria-labelledby": "d-title" }, back,
    el("div", { class: "detail__body" }, el("div", {},
      el("h2", { id: "d-title", style: "margin-top:1rem", text: c.name }), TypeBadge(c.facility_type),
      el("dl", {}, el("div", {}, el("dt", { text: "Location" }), el("dd", { text: `${Number(c.lat).toFixed(5)}, ${Number(c.lon).toFixed(5)}` })),
        d && el("div", {}, el("dt", { text: `Distance from ${S.origin && S.origin.name ? S.origin.name : "you"}` }), el("dd", { text: d })))), mapDiv));
  $("detail-mount").replaceChildren(dlg); $("main").inert = true; document.body.style.overflow = "hidden";
  dMap = createMap(mapDiv, { layers: false }); dMap.setView([c.lat, c.lon], 15);
  L.marker([c.lat, c.lon], { icon: makeMarker(c.facility_type, { selected: true }), title: markerLabel(c), alt: markerLabel(c) }).addTo(dMap);
  document.addEventListener("keydown", onKey); back.focus();
}
function onKey(e) { if (e.key === "Escape") closeDetail(); }
function closeDetail() {
  document.removeEventListener("keydown", onKey); dMap && dMap.remove(); dMap = null;
  $("detail-mount").replaceChildren(); $("main").inert = false; document.body.style.overflow = "";
  opener && opener.focus && opener.focus();
}
