-- GiST index supports spatial filtering. Run after the table exists.
CREATE INDEX IF NOT EXISTS idx_clinics_geom_gist
    ON public.clinics USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_clinics_facility_type
    ON public.clinics (facility_type);
