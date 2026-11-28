// Frontend entry point. Search interactions will be implemented against the agreed API contract.
map.on("click", (event) => {
  selectionLayer.clearLayers();
  L.circleMarker(event.latlng, { radius: 7, color: "#123b4a", fillOpacity: 0.8 })
    .bindPopup(`Selected location<br>Lat: ${event.latlng.lat.toFixed(5)}<br>Lon: ${event.latlng.lng.toFixed(5)}`)
    .addTo(selectionLayer)
    .openPopup();
});
