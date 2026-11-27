import { renderNav, el, icon, SampleLabel, FacilityIcon, FACILITY, TYPE_KEYS } from "../components.js";
import { MOCK_API, ZOMBA_BOUNDS, MAX_RADIUS_KM } from "../config.js";

export function initPage(current) {
  renderNav(current);
  document.querySelectorAll("[data-icon]").forEach((n) => n.replaceWith(icon(n.dataset.icon, Number(n.dataset.size) || 24)));
  if (MOCK_API) document.getElementById("main").prepend(el("p", { class: "mock-banner" }, SampleLabel(), " Mock API is on. Every clinic shown is sample data."));
  const mq = matchMedia("(max-width: 900px)");
  const sync = () => document.querySelectorAll(".panel").forEach((p) => { if (!mq.matches) p.open = true; p.querySelector("summary").tabIndex = mq.matches ? 0 : -1; });
  mq.addEventListener("change", sync); sync();
}
export const isNarrow = () => matchMedia("(max-width: 900px)").matches;

export function renderLegend(node) {
  node.replaceChildren(el("p", { class: "sr-only", text: "Legend" }),
    ...TYPE_KEYS.map((k) => el("div", { class: "legend__row" }, FacilityIcon(FACILITY[k].label), FACILITY[k].label)),
    el("div", { class: "legend__row" }, el("span", { style: "color:#0A4A9A;display:inline-flex" }, icon("pin", 20)), "Selected location"));
}

export function checkLatLon(latS, lonS) {
  const errors = {}, lat = Number(latS), lon = Number(lonS);
  if (!String(latS).trim() || !isFinite(lat) || lat < -90 || lat > 90) errors.lat = "Enter a latitude between -90 and 90.";
  if (!String(lonS).trim() || !isFinite(lon) || lon < -180 || lon > 180) errors.lon = "Enter a longitude between -180 and 180.";
  return { errors, lat, lon, ok: !errors.lat && !errors.lon };
}
export function outsideZomba(lat, lon) { const [[s, w], [n, e]] = ZOMBA_BOUNDS; return lat < s || lat > n || lon < w || lon > e; }
export const OUTSIDE_MSG = "This location is outside Zomba District. Results may be far away.";
export function checkRadiusKm(s) {
  const r = Number(s);
  return String(s).trim() && isFinite(r) && r > 0 && r <= MAX_RADIUS_KM ? null : `Enter a radius above 0 and up to ${MAX_RADIUS_KM} km.`;
}
export const errorInfo = (e) => (e.offline ? { offline: true, message: "" } : { offline: false, message: e.message || "Something went wrong." });
export const errorAnnouncement = (i) => (i.offline ? "Can't reach the server. Check your connection and try again." : i.message);
