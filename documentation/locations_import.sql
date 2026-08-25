-- GeoNames cities500 -> locations_full
--
-- File columns (tab-separated, no header):
--   geonameid, name, asciiname, alternatenames, latitude, longitude,
--   feature_class, feature_code, country_code, cc2, admin1_code,
--   admin2_code, admin3_code, admin4_code, population, elevation, dem,
--   timezone, modification_date
--
-- Download the two lookup files into documentation/:
--   https://download.geonames.org/export/dump/countryInfo.txt
--   https://download.geonames.org/export/dump/admin1CodesASCII.txt
--
-- Run from psql so \copy can read local files:
--   \i documentation/locations_import.sql

CREATE TEMP TABLE geonames_cities500
(
    geonameid integer,
    name text,
    asciiname text,
    alternatenames text,
    latitude numeric,
    longitude numeric,
    feature_class text,
    feature_code text,
    country_code text,
    cc2 text,
    admin1_code text,
    admin2_code text,
    admin3_code text,
    admin4_code text,
    population integer,
    elevation integer,
    dem integer,
    timezone text,
    modification_date date
);

CREATE TEMP TABLE geonames_countries
(
    iso text,
    iso3 text,
    iso_numeric text,
    fips text,
    name text,
    capital text,
    area text,
    population text,
    continent text,
    tld text,
    currency_code text,
    currency_name text,
    phone text,
    postal_code_format text,
    postal_code_regex text,
    languages text,
    geonameid text,
    neighbours text,
    equivalent_fips text
);

CREATE TEMP TABLE geonames_admin1
(
    code text,
    name text,
    ascii_name text,
    geonameid integer
);

\copy geonames_cities500 FROM 'documentation/cities500.txt' WITH (FORMAT text, DELIMITER E'\t', NULL '')
\copy geonames_countries FROM 'documentation/countryInfo.txt' WITH (FORMAT text, DELIMITER E'\t', NULL '', COMMENT '#')
\copy geonames_admin1 FROM 'documentation/admin1CodesASCII.txt' WITH (FORMAT text, DELIMITER E'\t', NULL '')

INSERT INTO locations_full
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
    city.geonameid,
    country.name,
    COALESCE(NULLIF(admin1.name, ''), country.name),
    city.name,
    public.text_normalize(city.name),
    city.latitude,
    city.longitude,
    ST_SetSRID(ST_MakePoint(city.longitude, city.latitude), 4326)::geography
FROM geonames_cities500 AS city
INNER JOIN geonames_countries AS country
    ON country.iso = city.country_code
LEFT JOIN geonames_admin1 AS admin1
    ON admin1.code = city.country_code || '.' || city.admin1_code
WHERE city.latitude IS NOT NULL
  AND city.longitude IS NOT NULL
ON CONFLICT (id) DO UPDATE
SET
    country = EXCLUDED.country,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    city_normalized = EXCLUDED.city_normalized,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    geom = EXCLUDED.geom;

-- CREATE INDEX IF NOT EXISTS locations_full_geom_gix ON locations_full USING GIST (geom);
