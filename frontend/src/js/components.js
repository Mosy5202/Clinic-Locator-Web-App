import { DEFAULTS, RADIUS_OPTIONS_KM } from "./config.js";
import { searchPlaces } from "./api.js";

/* ---------- helpers (all text goes through textContent / text nodes) ---------- */
export function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2).toLowerCase(), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return n;
}
export const formatKm = (m) => (typeof m === "number" && isFinite(m) ? `${(m / 1000).toFixed(1)} km` : null);

/* ---------- icons (static markup only) ---------- */
const ICONS = {
  pin: '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  crosshair: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="M8 12.5l3 3 5-6"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  bars: '<path d="M5 20V11M12 20V4M19 20v-6"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14.2c2.5.3 4.5 2.4 4.5 5.3"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  heartpulse: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
  stethoscope: '<path d="M11 2v2M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',
  building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/>',
};
export function icon(name, size = 20) {
  const n = el("span", { class: "icon", "aria-hidden": "true" });
  n.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" focusable="false">${ICONS[name] || ""}</svg>`;
  return n;
}


/* ---------- facility types: colour + shape + text ---------- */
export const FACILITY = {
  hospital:      { label: "Hospital",      color: "var(--type-hospital)",
    glyph: '<rect x="1" y="1" width="26" height="26" rx="5" fill="currentColor" stroke="#fff" stroke-width="2"/><path d="M11 6h6v5h5v6h-5v5h-6v-5H6v-6h5z" fill="#fff"/>' },
  health_center: { label: "Health Center", color: "var(--type-health-center)",
    glyph: '<circle cx="14" cy="14" r="13" fill="currentColor" stroke="#fff" stroke-width="2"/><path d="M9 8h3v4h4V8h3v12h-3v-4h-4v4H9z" fill="#fff"/>' },
  clinic:        { label: "Clinic",        color: "var(--type-clinic)",
    glyph: '<polygon points="14,1 27,14 14,27 1,14" fill="currentColor" stroke="#fff" stroke-width="2"/><path d="M12.5 8h3v4.5H20v3h-4.5V20h-3v-4.5H8v-3h4.5z" fill="#fff"/>' },
};
export const TYPE_KEYS = Object.keys(FACILITY);
// API sends "Hospital" | "Health Center" | "Clinic"; query params use snake_case keys.
export const typeKey = (t) => ({ "hospital": "hospital", "health center": "health_center", "clinic": "clinic" }[String(t || "").trim().toLowerCase()] || null);

const svg = (inner, size = 28) => `<svg viewBox="0 0 28 28" width="${size}" height="${size}" aria-hidden="true" focusable="false">${inner}</svg>`;
const FALLBACK = '<circle cx="14" cy="14" r="11" fill="currentColor" stroke="#fff" stroke-width="2"/>';

export function FacilityIcon(type) {
  const k = typeKey(type);
  const s = el("span", { class: "ficon", style: `color:${k ? FACILITY[k].color : "var(--ink-soft)"}` });
  s.innerHTML = svg(k ? FACILITY[k].glyph : FALLBACK); // static markup only, no API data
  return s;
}
export function TypeBadge(type) {
  const k = typeKey(type);
  return el("span", { class: `badge badge--${k || "unknown"}` }, FacilityIcon(type), type || "Facility");
}

/* ---------- Leaflet marker + popup ---------- */
export function makeMarker(type, { selected = false } = {}) {
  const k = typeKey(type);
  const html = `<span style="color:${k ? FACILITY[k].color : "var(--ink-soft)"}">${svg(k ? FACILITY[k].glyph : FALLBACK, 32)}</span>`;
  return L.divIcon({ html, className: `facility-marker${selected ? " facility-marker--selected" : ""}`, iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16] });
}
// Accessible name, e.g. "Zomba Central Hospital, Hospital, 1.2 km". Use as L.marker option `title` and `alt`.
export const markerLabel = (c) => [c.name, c.facility_type, formatKm(c.distance_m)].filter(Boolean).join(", ");

export function buildPopup(c) {
  const d = formatKm(c.distance_m);
  return el("div", { class: "popup" }, el("h3", { class: "popup__name", text: c.name }), TypeBadge(c.facility_type), d && el("p", { text: `Distance: ${d}` }));
}

/* ---------- live region ---------- */
export function announce(msg) {
  let r = document.getElementById("live-region");
  if (!r) { r = el("div", { id: "live-region", class: "sr-only", "aria-live": "polite", "aria-atomic": "true" }); document.body.append(r); }
  r.textContent = ""; setTimeout(() => (r.textContent = msg), 50);
}

/* ---------- nav ---------- */
const LINKS = [["index.html", "Locator", "map"], ["dashboard.html", "Dashboard", "bars"], ["finder.html", "Community Finder", "users"]];
export function renderNav(current, mount = document.getElementById("site-nav")) {
  const logo = el("span", { style: "color:#6EE7B7" }, icon("heartpulse", 36));
  const header = el("header", { class: "site-header" }, el("div", { class: "site-header__inner" },
    el("a", { class: "brand", href: "index.html" }, logo, el("span", {}, el("span", { class: "brand__name", text: "Clinic Locator" }), el("span", { class: "brand__sub", text: "Zomba District, Malawi" }))),
    el("nav", { "aria-label": "Main", class: "site-nav" }, el("ul", { class: "nav-list" },
      LINKS.map(([href, text, ic]) => el("li", {}, el("a", { class: "nav-link", href, "aria-current": href === current ? "page" : null }, icon(ic, 20), text)))))));
  const skip = el("a", { class: "skip-link", href: "#main", text: "Skip to main content" });
  if (mount) mount.replaceWith(skip, header); else document.body.prepend(skip, header);
  announce(""); return header;
}

/* ---------- state components ---------- */
export const Loader = (label = "Searching for clinics...", skeletons = 0) =>
  el("div", { class: "state state--loading", role: "status" }, el("span", { class: "spinner", "aria-hidden": "true" }), label,
    ...Array.from({ length: skeletons }, () => el("div", { class: "skeleton", style: "flex-basis:100%", "aria-hidden": "true" })));

export function ErrorMessage({ message = "Something went wrong.", offline = false, onRetry } = {}) {
  const n = el("div", { class: `state ${offline ? "state--offline" : "state--error"}`, role: "alert" },
    el("span", { text: offline ? "Can't reach the server. Check your connection and try again." : message }));
  if (onRetry) n.append(el("button", { type: "button", class: "btn btn--secondary", onClick: onRetry, text: "Retry" }));
  return n;
}
export const EmptyState = ({ title = "No clinics found.", hint = "" } = {}) =>
  el("div", { class: "state state--empty" }, el("p", { class: "state__title", text: title }), hint && el("p", { text: hint }));
export const SuccessMessage = (text) => el("div", { class: "state state--success", role: "status" }, icon("check", 26), el("span", { text }));
export const SampleLabel = (text = "Sample data") => el("span", { class: "sample-label", text });

/* ---------- ClinicCard ---------- */
export function ClinicCard(c, { rank, onView, viewLabel = "View on Map", viewIcon = null } = {}) {
  const d = formatKm(c.distance_m);
  return el("li", { class: "clinic-card", "data-id": c.id },
    rank != null && el("span", { class: "clinic-card__rank", "aria-hidden": "true", text: rank }),
    el("div", {}, el("h3", { class: "clinic-card__name", text: c.name }), TypeBadge(c.facility_type), d && el("p", { class: "clinic-card__dist" }, icon("pin", 18), d)),
    onView && el("button", { type: "button", class: "btn btn--nav btn--view", "aria-label": `${viewLabel} – ${c.name}`, onClick: () => onView(c) }, viewIcon ? [icon(viewIcon, 22), viewLabel] : viewLabel.split(" ").reduce((a, w, i, all) => (i === 0 ? [w] : i === 1 && all.length > 2 ? [...a, el("br"), w] : [...a, " ", w]), [])));
}

/* ---------- FilterChips ---------- */
export function FilterChips({ selected = DEFAULTS.types, onChange } = {}) {
  const boxes = TYPE_KEYS.map((k) => el("input", { type: "checkbox", value: k, checked: selected.includes(k), onChange: () => onChange && onChange(get()) }));
  const get = () => boxes.filter((b) => b.checked).map((b) => b.value);
  const node = el("fieldset", { class: "chips" }, el("legend", { text: "Filter by facility type" }),
    TYPE_KEYS.map((k, i) => el("label", { class: "choice" }, boxes[i], FacilityIcon(FACILITY[k].label), FACILITY[k].label)));
  return { el: node, getSelected: get, setSelected: (arr) => boxes.forEach((b) => (b.checked = arr.includes(b.value))) };
}

/* ---------- PlaceSearch: find a village / town / landmark by name ---------- */
export function PlaceSearch({ id = "place", label = "Search location", placeholder = "Enter village or town name", hint = "", hideLabel = false, onPick } = {}) {
  let ctl = null, busy = false;
  const input = el("input", { class: "input", id, type: "text", autocomplete: "off", enterkeyhint: "search", placeholder, "aria-describedby": `${id}-msg${hint ? ` ${id}-hint` : ""}` });
  const btn = el("button", { type: "button", class: "btn btn--primary", "aria-label": "Search for this place" }, icon("search", 22));
  const msg = el("p", { id: `${id}-msg`, role: "status" });
  const list = el("ul", { class: "place-list", "aria-label": "Places found", hidden: true });
  const node = el("div", { class: "field" }, el("label", { for: id, class: hideLabel ? "sr-only" : null, text: label }), el("div", { class: "input-group" }, input, btn),
    hint && el("p", { class: "field__hint", id: `${id}-hint`, text: hint }), msg, list);

  const show = (text, kind = "note") => { msg.className = `field__${kind}`; msg.textContent = text; if (kind === "error") input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid"); };
  const hideList = () => { list.hidden = true; list.replaceChildren(); };
  function setBusy(b) { busy = b; btn.disabled = b; }
  function pick(p) { hideList(); input.value = p.name; show(""); announce(`${p.name} selected.`); onPick && onPick(p); }

  async function go() {
    if (busy) return;
    const q = input.value.trim();
    hideList();
    if (q.length < 2) { show("Type the name of your village or town, then press Search.", "error"); input.focus(); announce(msg.textContent); return; }
    ctl && ctl.abort(); const c = (ctl = new AbortController());
    setBusy(true); show("Searching for places..."); announce("Searching for places...");
    try {
      const found = await searchPlaces(q, c.signal);
      if (c !== ctl) return;
      if (!found.length) { show(`We couldn't find “${q}”. Check the spelling, try a nearby village, or tap the map.`, "error"); announce(msg.textContent); return; }
      if (found.length === 1) { pick(found[0]); return; }
      show(`${found.length} places found. Choose yours:`); announce(msg.textContent);
      list.replaceChildren(...found.map((p) => el("li", {}, el("button", { type: "button", class: "place-option", onClick: () => pick(p) },
        icon("pin", 22), el("span", {}, el("strong", { text: p.name }), p.area && el("small", { text: p.area }))))));
      list.hidden = false;
    } catch (e) {
      if (e.name === "AbortError") return;
      show(e.offline ? "Can't reach the server. Check your connection and try again." : (e.message || "Place search failed. Try again."), "error"); announce(msg.textContent);
    } finally { if (c === ctl) setBusy(false); }
  }
  btn.addEventListener("click", go);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });
  node.addEventListener("keydown", (e) => { if (e.key === "Escape" && !list.hidden) { hideList(); input.focus(); } });
  input.addEventListener("input", () => { if (msg.className === "field__error") show(""); });

  return {
    el: node, focus: () => input.focus(),
    setError(text) { hideList(); show(text, "error"); input.focus(); },
    reset() { ctl && ctl.abort(); setBusy(false); input.value = ""; hideList(); show(""); },
    clearMessage() { show(""); },
  };
}

/* ---------- SearchForm ---------- */
export function SearchForm({ defaults = DEFAULTS, onSubmit, onReset, onChange, onPlace } = {}) {
  let busy = false, placeName = "";
  const errs = {};
  const field = (id, label, input, hint) => {
    errs[id] = el("p", { class: "field__error", id: `${id}-error` });
    input.setAttribute("aria-describedby", `${id}-error`);
    return el("div", { class: "field" }, el("label", { for: id, text: label }), input, hint && el("p", { class: "field__hint", text: hint }), errs[id]);
  };
  const place = PlaceSearch({ id: "place", label: "Search by village or town name", hideLabel: true, placeholder: "Enter village or click on map",
    hint: "Type your village, town or landmark. You can also tap the map.",
    onPick: (p) => { api.setLocation(p.lat, p.lon, p.name); onPlace && onPlace(p); } });
  const where = el("p", { class: "where where--empty", role: "status" });
  const setWhere = (text) => { where.className = text ? "where" : "where where--empty"; where.replaceChildren(icon("pin", 18), text || "No location chosen yet"); };
  setWhere("");

  const lat = el("input", { class: "input", id: "lat", type: "text", inputmode: "decimal", autocomplete: "off" });
  const lon = el("input", { class: "input", id: "lon", type: "text", inputmode: "decimal", autocomplete: "off" });
  const advanced = el("details", { class: "advanced" }, el("summary", { text: "Advanced: enter coordinates" }),
    el("div", { class: "grid-2" }, field("lat", "Latitude", lat), field("lon", "Longitude", lon)));
  const radius = el("select", { class: "input", id: "radius" }, RADIUS_OPTIONS_KM.map((r) => el("option", { value: r, selected: r === defaults.radiusKm, text: `${r} km` })));
  const radiusField = el("div", { class: "field" }, el("label", { for: "radius", text: "Select Radius" }), el("div", { class: "select-wrap" }, icon("crosshair", 20), radius));
  const mode = (v, t) => el("label", { class: "choice" }, el("input", { type: "radio", name: "mode", value: v, checked: v === defaults.mode, onChange: sync }), t);
  const modes = el("fieldset", {}, el("legend", { class: "sr-only", text: "Search type" }), el("div", { class: "radio-row" }, mode("nearest", "Nearest 3 Clinics"), mode("within", "Within Radius")));
  const chips = FilterChips({ selected: defaults.types, onChange: () => onChange && onChange("types") });
  const submit = el("button", { type: "submit", class: "btn btn--primary btn--block btn--lg-ish" }, icon("send", 20), el("span", { text: "Find Clinics" }));
  const reset = el("button", { type: "button", class: "btn btn--secondary btn--block", text: "Reset" });
  const warn = el("p", { class: "field__warn", id: "loc-warn", role: "status" });
  errs.types = el("p", { class: "field__error", id: "types-error" });
  const getMode = () => form.elements.mode.value;
  function sync() { radius.disabled = getMode() !== "within"; onChange && onChange("mode"); }
  radius.addEventListener("change", () => onChange && onChange("radius"));
  [lat, lon].forEach((i) => i.addEventListener("input", () => { placeName = ""; place.clearMessage(); setWhere("Coordinates you entered"); }));

  const form = el("form", { class: "form", novalidate: true, "aria-label": "Find clinics",
      onSubmit: (e) => { e.preventDefault(); if (!busy) onSubmit && onSubmit(api.get()); } },
    place.el, where, warn, advanced, modes, radiusField, submit, el("hr", { class: "divider" }), chips.el, errs.types, reset);
  reset.addEventListener("click", () => { form.reset(); chips.setSelected(defaults.types); place.reset(); placeName = ""; setWhere(""); advanced.open = false; api.clearErrors(); sync(); onReset && onReset(); });
  sync();

  const api = {
    el: form,
    get: () => ({ lat: lat.value.trim(), lon: lon.value.trim(), mode: getMode(), radiusKm: radius.value, types: chips.getSelected(), place: placeName }),
    // placeName is set only for a searched place; a map tap or typed coordinates pass a label for display only.
    setLocation(la, lo, name = "", label = "") { lat.value = String(la); lon.value = String(lo); placeName = name; setWhere(name || label); },
    setBusy(b) { busy = b; submit.disabled = b; submit.lastChild.textContent = b ? "Searching..." : "Find Clinics"; },
    setFieldError(id, msg) {
      if (id === "place") { msg ? place.setError(msg) : place.clearMessage(); return; }
      if (!errs[id]) return; errs[id].textContent = msg;
      const i = form.querySelector("#" + id); i && i.setAttribute("aria-invalid", msg ? "true" : "false");
      if (msg && (id === "lat" || id === "lon")) advanced.open = true;
      i && msg && i.focus();
    },
    setWarning(msg) { warn.textContent = msg; },
    clearErrors() { warn.textContent = ""; place.clearMessage(); Object.keys(errs).forEach((id) => { errs[id].textContent = ""; form.querySelector("#" + id)?.removeAttribute("aria-invalid"); }); },
  };
  return api;
}
