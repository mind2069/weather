-- Convert locations.id from serial4 to plain int4.
-- serial4 is already integer; this only removes the sequence / identity.

ALTER TABLE public.locations
    ALTER COLUMN id DROP IDENTITY IF EXISTS;

ALTER TABLE public.locations
    ALTER COLUMN id DROP DEFAULT;

DROP SEQUENCE IF EXISTS public.locations_id_seq;

ALTER TABLE public.locations
    ALTER COLUMN id SET DATA TYPE integer;
