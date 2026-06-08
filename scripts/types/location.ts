export type Country = 
{
    id: number;
    name: string;
    name_normalized: string;
    code: string;
    latitude: number;
    longitude: number;
};

export type State = 
{
    id: number;
    countryId: number;
    name: string;
    name_normalized: string;
    code: string;
    latitude: number;
    longitude: number;
};

export type City = 
{
    id: number;
    countryId: number;
    stateId: number;
    name: string;
    name_normalized: string;
    latitude: number;
    longitude: number;
};

export interface LocationResults
{
    id: number;
	name: string;
	latitude: number;
	longitude: number;
	locations_provinces_id: number;
	locations_provinces_name: string;
	locations_provinces_code: string;
    locations_provinces_latitude: number;
    locations_provinces_longitude: number;
	locations_countries_id: number;
	locations_countries_name: string;
	locations_countries_code: string;
    locations_countries_latitude: number;
    locations_countries_longitude: number;
}

export interface LocationDefault
{
	name: string;
	latitude: number;
	longitude: number;
}
