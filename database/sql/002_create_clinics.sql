-- Initial facility table. Confirm source attributes before importing data.
CREATE TABLE IF NOT EXISTS public.clinics (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    facility_type TEXT,
    source TEXT,
    source_id TEXT,
    geom geometry(Point, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
