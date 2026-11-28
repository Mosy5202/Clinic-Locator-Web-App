# Leaflet frontend

The starter is plain HTML/CSS/JavaScript; no Node build system is required for the MVP.

From the repository root, start a simple static server:

```bash
python -m http.server 5500 --directory frontend
```

Then open `http://127.0.0.1:5500` in a browser or `http://127.0.0.1:5500/index.html?mock=1` to use mock data. The starter map uses Leaflet and an OpenStreetMap tile layer. Clinic markers and search controls are to be implemented against the API contract in `docs/api-contract.md`.

OpenStreetMap tile usage must follow the tile usage policy and attribution requirements; do not treat the public tile server as an unlimited production tile service.
