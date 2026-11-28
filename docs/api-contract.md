# API contract (agreement between backend and frontend)

The frontend and backend members should use these names consistently. The routes below are the planned contract; implement them in Flask.

## `GET /api/health`

Purpose: confirm the API is running.

Example response:

```json
{"status": "ok"}
```

## `GET /api/clinics/nearest?lat=-15.39&lon=35.31&limit=3`

Purpose: return the nearest `limit` clinics to a selected location.

Parameters:

- `lat`: latitude in decimal degrees, required, range -90 to 90.
- `lon`: longitude in decimal degrees, required, range -180 to 180.
- `limit`: optional integer, default 3; backend should set a sensible maximum (for example 20).

Expected response: JSON array of clinic objects.

## `GET /api/clinics/within?lat=-15.39&lon=35.31&radius_m=5000`

Purpose: return clinics no farther than the supplied radius from a selected point.

Parameters:

- `lat`, `lon`: required decimal-degree coordinates.
- `radius_m`: required positive radius in metres; backend should enforce a sensible maximum.

## Clinic object

```json
{
  "id": 12,
  "name": "Example Health Centre",
  "facility_type": "Health Centre",
  "lat": -15.39,
  "lon": 35.31,
  "distance_m": 1250.4
}
```

`distance_m` is included for search results and may be omitted for an unfiltered list. Do not hard-code sample clinics into the production frontend; the real results must come from the PostGIS database via Flask.

## Error response

Use an appropriate HTTP status (usually 400 for invalid parameters, 500 for unexpected server errors) and a consistent JSON body, for example:

```json
{"error": "lat and lon are required decimal-degree coordinates"}
```
