import { SupabaseConnectionServer } from '@/scripts/connections/supabase/supabase-server';
import type { LocationDefault, LocationResults } from '@/scripts/types/location';
import * as LocationsTypes from '@/services/locations/types';
import { LocationsData } from '@/scripts/data/locations';

export class LocationsServiceServer
{
    public static async Default( parameters: LocationsTypes.LocationsDefaultParameters ): Promise<LocationsTypes.LocationsDefaultResponse>
    {
        let success = false;
        let data: LocationDefault = { name: '', latitude: 0, longitude: 0 };
        let codes: string[] = ['UnknownError'];
        let message = '';

        if(parameters.latitude === -999999 || parameters.longitude === -999999)
        {
            data = LocationsData.DefaultCity();
            success = true;
            codes = ['Success'];
            message = 'Locations default retrieved successfully';
        }
        else
        {
            const supabaseServer = SupabaseConnectionServer();

            const { data: dataLocations, error: errorLocations } = await supabaseServer.rpc('locations_closest',
            {
                p_latitude: parameters.latitude,
                p_longitude: parameters.longitude,
            });

            if (errorLocations)
            {
                throw new Error(errorLocations.message);
            }
            else if (dataLocations && dataLocations.length > 0)
            {
                const closest = dataLocations[0] as LocationResults;

                data = 
                {
                    name: `${closest.city}, ${closest.province}, ${closest.country}`,
                    latitude: Number(closest.latitude),
                    longitude: Number(closest.longitude),
                };
                
                success = true;
                codes = ['Success'];
                message = 'Locations closest retrieved successfully';
            }
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

        const supabaseServer = await SupabaseConnectionServer();

        const { data: dataLocations, error: errorLocations } = await supabaseServer.rpc('locations_search', 
        {
            p_keyword: parameters.keyword,
        });

        if (errorLocations)
        {
            throw new Error(errorLocations.message);
        }
        else if (dataLocations)
        {
            data = (dataLocations as any[]).map((item: any): LocationResults =>
            {
                return {
                    id: item.id,
                    country: item.country,
                    province: item.province,
                    city: item.city,
                    latitude: item.latitude,
                    longitude: item.longitude,
                };
            });

            success = true;
            codes = ['Success'];
            message = 'Locations cities searched successfully';
        }

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
