# Application architecture

```text
Browser
  └── Leaflet + HTML/CSS/JavaScript (frontend)
          │ HTTP requests / JSON
          ▼
      Flask REST API (backend)
          │ parameterised SQL
          ▼
  PostgreSQL + PostGIS (spatial database)
```

QGIS is used by the group to inspect, clean, filter, and validate the spatial source data. It is not a replacement for the database: the running application must retrieve facility records and perform proximity calculations through PostGIS.

## Request flow

1. A user clicks a location on the map or supplies coordinates.
2. The frontend sends latitude, longitude, and search options to Flask.
3. Flask validates the input and runs a parameterised PostGIS query.
4. PostGIS returns the matching clinics and distances.
5. Flask returns JSON; Leaflet displays the result markers and details.

## Agreed first-version assumptions

- Study area: Zomba District unless the group formally selects another area.
- Facility data: public health-facility locations only; no patient or personal health data.
- Distance: straight-line distance in metres. Road-network routes and travel time are outside the MVP.
- Coordinates supplied by Leaflet are longitude/latitude in EPSG:4326.
