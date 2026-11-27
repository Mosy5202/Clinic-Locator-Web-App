import { MAP_DEFAULT } from "./config.js";
import { makeMarker, markerLabel, buildPopup } from "./components.js";

export function createMap(node, { layers = true } = {}) {
  const map = L.map(node).setView(MAP_DEFAULT.center, MAP_DEFAULT.zoom);
  const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
  if (layers) {
    const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Imagery &copy; Esri" });
    L.control.layers({ "Street map": osm, "Satellite": sat }).addTo(map);
    L.control.scale({ metric: true, imperial: false, position: "bottomright" }).addTo(map);
  }
  return map;
}

/* Clinic markers. Clinics that are in `results` are drawn larger and carry their distance. */
export function createClinicLayer(map, { onSelect } = {}) {
  const group = L.layerGroup().addTo(map), byId = new Map();
  return {
    set(all, results = []) {
      group.clearLayers(); byId.clear();
      const hit = new Map(results.map((r) => [r.id, r]));
      all.forEach((c) => {
        const full = hit.has(c.id) ? { ...c, ...hit.get(c.id) } : c, name = markerLabel(full);
        const m = L.marker([c.lat, c.lon], { icon: makeMarker(c.facility_type, { selected: hit.has(c.id) }), title: name, alt: name, keyboard: true });
        if (onSelect) m.on("click", () => onSelect(full)); else m.bindPopup(buildPopup(full));
        m.addTo(group); byId.set(c.id, m);
      });
    },
    open(c) { map.setView([c.lat, c.lon], Math.max(map.getZoom(), 14)); const m = byId.get(c.id); if (m && m.openPopup) m.openPopup(); },
  };
}

/* Selected-location pin and (optional) radius circle. Drawing only: no spatial results are computed here. */
export function createLocationLayer(map) {
  const g = L.layerGroup().addTo(map);
  const pin = L.divIcon({ className: "fm", iconSize: [28, 36], iconAnchor: [14, 34], html: '<svg viewBox="0 0 24 24" width="30" height="38" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" fill="#0A4A9A" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="10" r="2.8" fill="#fff"/></svg>' });
  return {
    set(lat, lon, radiusKm = 0) {
      g.clearLayers();
      L.marker([lat, lon], { icon: pin, title: "Selected location", alt: "Selected location", keyboard: false }).addTo(g);
      if (radiusKm > 0) L.circle([lat, lon], { radius: radiusKm * 1000, color: "#0A4A9A", weight: 2, fillOpacity: 0.12 }).addTo(g);
    },
    clear() { g.clearLayers(); },
  };
}
