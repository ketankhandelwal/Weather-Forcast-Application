-- FIRST RUN THIS TO CREATE DATABASE
CREATE DATABASE weather_db;

-- THEN RUN THESE QUERIES INSIDE YOUR DATABASE

CREATE TABLE IF NOT EXISTS public.locations
(
    id integer NOT NULL DEFAULT nextval('locations_id_seq'::regclass),
    name character varying COLLATE pg_catalog."default" NOT NULL,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint,
    CONSTRAINT locations_pkey PRIMARY KEY (id),
    CONSTRAINT unique_location UNIQUE (lat, lng)
)

