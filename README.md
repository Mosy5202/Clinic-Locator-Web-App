# Clinic Locator Web App

A student GIS project: a database-driven web application for locating health facilities in the selected study area (proposed default: Zomba District, Malawi).

## Planned MVP

- Display health-facility locations on an interactive Leaflet map.
- Let a user select a point on the map.
- Find the nearest clinics to that point.
- Find clinics within a user-selected radius (metres or kilometres).
- Show each facility's name, type, and calculated straight-line distance.

**Important:** distances in the first version are straight-line proximity distances, not walking/road distances or travel times. The application is not a medical advice service and will not collect patient data.

## Technology

- QGIS: inspect, clean, filter, and validate spatial datasets.
- PostgreSQL + PostGIS: store facilities and execute spatial queries.
- Python + Flask: expose the database through a small API.
- HTML, CSS, JavaScript + Leaflet: web interface and map.

## Repository layout

```text
clinic-locator/
├── backend/             # Flask API
├── database/            # SQL schema, indexes, and database notes
├── data/                # Data instructions; large/raw datasets stay out of Git
├── docs/                # Architecture, API contract, and project documentation
├── frontend/            # Leaflet web interface
├── tests/               # Cross-component / integration tests
├── .env.example         # Example configuration (no real secrets)
├── .gitignore
└── CONTRIBUTING.md
```

## Getting started

1. Read `docs/architecture.md`, `docs/api-contract.md`, and `CONTRIBUTING.md`.
2. Copy `.env.example` to `.env` and fill in your local database settings. Never commit `.env`.
3. Create a PostgreSQL database and enable PostGIS. Run the SQL files in `database/sql/` in numeric order.
4. Prepare the facility dataset in QGIS and import the cleaned point layer into the `public.clinics` table. See `data/raw/README.md` and `database/README.md`.
5. Start the API using the instructions in `backend/README.md`.
6. Start the frontend using the instructions in `frontend/README.md`.

Each member should work on a feature branch and open a pull request. See `CONTRIBUTING.md`.

## Data and attribution

Keep a record of the dataset name, download date, source URL, licence, coordinate reference system, processing steps, and known limitations. OpenStreetMap-derived data requires appropriate attribution and compliance with the ODbL. Do not commit large downloaded datasets unless the group has agreed that the size and licence permit it.

## Project status

This is the initial project scaffold, not a completed application. API search endpoints, database loading, and the clinic result display are to be implemented by the team.
