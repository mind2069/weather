-- Copy Canada and United States from locations_full into locations.
-- Uses GeoNames id. Run locations_id_to_int.sql first if locations.id is still serial.
--
-- Country names in GeoNames are "Canada" and "United States".

TRUNCATE TABLE public.locations;

INSERT INTO public.locations
(
    id,
    country,
    province,
    city,
    city_normalized,
    latitude,
    longitude,
    geom
)
OVERRIDING SYSTEM VALUE
SELECT
    id,
    country,
    province,
    city,
    city_normalized,
    latitude,
    longitude,
    geom
FROM public.locations_full
WHERE country IN ('Canada', 'United States');
