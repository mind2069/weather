import * as LocationsTypes from '@/services/locations/types';
import { ServiceClient } from '@/scripts/services/client';

export class LocationsServiceClient
{
    public static async Search( parameters: LocationsTypes.LocationsSearchParameters ): Promise<LocationsTypes.LocationsSearchResponse>
    {
        return ServiceClient.Execute<LocationsTypes.LocationsSearchResponse>(
            '/api/locations/search',
            parameters,
            'Failed to search locations',
            'tght12',
        );
    }
}

