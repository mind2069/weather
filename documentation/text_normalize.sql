-- DROP FUNCTION public.text_normalize(text);

CREATE OR REPLACE FUNCTION public.text_normalize(p_value text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
    SELECT regexp_replace(lower(translate(coalesce(p_value, ''), 'àáâãäåèéêëìíîïòóôõöùúûüçñ', 'aaaaaaeeeeiiiiooooouuuucn')),'[^a-z0-9]', '', 'g');
$function$
;
