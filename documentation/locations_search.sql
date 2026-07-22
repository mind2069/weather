-- DROP FUNCTION public.locations_search(varchar);

CREATE OR REPLACE FUNCTION public.locations_search(p_keyword character varying)
 RETURNS TABLE(id integer, country character varying, province character varying, city character varying, latitude numeric, longitude numeric)
 LANGUAGE plpgsql
AS $function$
DECLARE
    p_keyword_normalized text;
BEGIN
    p_keyword_normalized := public.text_normalize(p_keyword::text);

    RETURN QUERY
    SELECT
        locations.id,
        locations.country::character varying AS country,
        locations.province::character varying AS province,
        locations.city::character varying AS city,
        locations.latitude,
        locations.longitude
    FROM locations
    WHERE locations.city_normalized LIKE '%' || p_keyword_normalized || '%'
    ORDER BY locations.city;
END;
$function$
;
