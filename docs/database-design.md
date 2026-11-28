# Initial database design

The first implementation can use one main table, `public.clinics`:

| Column | Type | Purpose |
|---|---|---|
| `id` | identity / primary key | Internal unique identifier |
| `name` | text | Facility name |
| `facility_type` | text | Clinic, health centre, hospital, etc. |
| `source` | text | Dataset/source name |
| `source_id` | text | Original dataset identifier, where available |
| `geom` | geometry(Point, 4326) | Facility longitude/latitude |

The SQL files in `database/sql/` create the extension, table, and spatial index. The group must inspect the actual source-data fields in QGIS before writing the import/mapping procedure.

For distance calculations, cast `geom` to `geography` so distances and `ST_DWithin` radii use metres. Consider a GiST index on `geom`; verify the query plan and test the query results.

Do not add user accounts, patient records, appointments, or clinical records to this student MVP.
