import { CITIES } from '@/scripts/data/locations-cities';
import type { LocationDefault, LocationResults } from '@/scripts/types/location';
import * as LocationsTypes from '@/services/locations/types';
import { TextHelper } from '@/scripts/helpers/text';
import { LocationsData } from '@/scripts/data/locations';

export class LocationsServiceServer
{
    public static Default( parameters: LocationsTypes.LocationsDefaultParameters ): LocationsTypes.LocationsDefaultResponse
    {
        let success = false;
        let data: LocationDefault = { name: '', latitude: 0, longitude: 0 };
        let codes: string[] = ['UnknownError'];
        let message = '';

        if(parameters.latitude === -999999 || parameters.longitude === -999999)
        {
            data = { name: 'Laval, QC, Canada (Default)', latitude: 45.6068, longitude: -73.7129 };
            success = true;
            codes = ['Success'];
            message = 'Locations default data retrieved successfully';
        }
        else
        {
            // TO DO MAP CLOSER CITY BY LATITUDE AND LONGITUDE
    
            data = { name: 'Montreal, QC, Canada (Default)', latitude: 45.5017, longitude: -73.5673 };
            success = true;
            codes = ['Success'];
            message = 'Locations default data retrieved successfully';
        }

        const json: LocationsTypes.LocationsDefaultResponse = 
        {
            success: success,
            data: data,
            codes: codes,
            message: message
        };

        return json;
    }


    public static async Search( parameters: LocationsTypes.LocationsSearchParameters ): Promise<LocationsTypes.LocationsSearchResponse>
    {
        let success = false;
        let data: LocationResults[] = [];
        let codes: string[] = ['UnknownError'];
        let message = '';

        const keyword = TextHelper.Normalize(parameters.keyword);
        const filterCountryId = parameters.locations_countries_id > 0 ? parameters.locations_countries_id : null;
        const filterProvinceId = parameters.locations_provinces_id > 0 ? parameters.locations_provinces_id : null;

        const matched = CITIES.filter( ( city ) =>
        {
            if ( filterCountryId !== null && city.countryId !== filterCountryId )
            {
                return false;
            }
            if ( filterProvinceId !== null && city.stateId !== filterProvinceId )
            {
                return false;
            }
            if ( !keyword )
            {
                return false;
            }
            return (
                city.name_normalized.includes( keyword ) ||
                city.name.toLowerCase().includes( keyword )
            );
        } );

        data = matched.map( LocationsData.Get );
        success = true;
        codes = ['Success'];
        message = 'Locations cities searched successfully';

        const json: LocationsTypes.LocationsSearchResponse = 
        {
            success: success,
            data: data,
            codes: codes,
            message: message
        };

        return json;
    }
}
