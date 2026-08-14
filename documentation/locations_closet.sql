-- Requires: CREATE EXTENSION IF NOT EXISTS postgis;
-- And column: geom geography(Point, 4326) backfilled from latitude/longitude
-- And index: CREATE INDEX locations_geom_gix ON locations USING GIST (geom);

CREATE OR REPLACE FUNCTION public.locations_closest(
    p_latitude numeric,
    p_longitude numeric
)
RETURNS TABLE(
    id integer,
    country character varying,
    province character varying,
    city character varying,
    latitude numeric,
    longitude numeric
)
LANGUAGE sql
STABLE
AS $function$
    SELECT
        locations.id,
        locations.country::character varying AS country,
        locations.province::character varying AS province,
        locations.city::character varying AS city,
        locations.latitude,
        locations.longitude
    FROM locations
    ORDER BY
        locations.geom <-> ST_SetSRID(
            ST_MakePoint(p_longitude, p_latitude),
            4326
        )::geography
    LIMIT 1;
$function$;
