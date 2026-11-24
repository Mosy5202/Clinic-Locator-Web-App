# Database setup

1. Create a PostgreSQL database (suggested name: `clinic_locator`).
2. Connect to that database using pgAdmin or `psql`.
3. Run the files in `sql/` in numeric order.
4. Import the cleaned facility point layer into `public.clinics` using QGIS DB Manager or `ogr2ogr`.
5. Confirm that the row count and geometries are plausible in QGIS and SQL.

Example inspection queries:

```sql
SELECT COUNT(*) FROM public.clinics;
SELECT id, name, facility_type, ST_AsText(geom)
FROM public.clinics
LIMIT 10;
```

The group must confirm the input layer's CRS before importing. The target column expects EPSG:4326 longitude/latitude.
