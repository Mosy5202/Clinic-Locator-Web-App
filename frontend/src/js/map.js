// Base map only. Clinic layers and search markers will be added in the map UI feature.
const map = L.map("map").setView([-15.39, 35.31], 11); // Approximate Zomba centre; update if study area changes.

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const clinicLayer = L.layerGroup().addTo(map);
const selectionLayer = L.layerGroup().addTo(map);
