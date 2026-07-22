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
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        locations.id,
        locations.country::character varying AS country,
        locations.province::character varying AS province,
        locations.city::character varying AS city,
        locations.latitude,
        locations.longitude
    FROM locations
    ORDER BY
        (
            (locations.latitude - p_latitude) * (locations.latitude - p_latitude)
            + (locations.longitude - p_longitude) * (locations.longitude - p_longitude)
        ) ASC
    LIMIT 1;
END;
$function$;
