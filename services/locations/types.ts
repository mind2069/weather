import { LocationDefault, LocationResults } from "@/scripts/types/location";
import { Session } from "@/scripts/types/session";

export interface LocationsDefaultParameters
{
    latitude: number;
    longitude: number;
}

export interface LocationsDefaultResponse
{
    success: boolean;
    data: LocationDefault;
    codes: string[];
    message: string;
}

export interface LocationsSearchParameters
{
    session: Session;
    keyword: string;
    locations_countries_id: number;
    locations_provinces_id: number;
}

export interface LocationsSearchResponse
{
    success: boolean;
    data: LocationResults[] | null;
    codes: string[];
    message: string;
}

