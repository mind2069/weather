import { CITIES } from '@/scripts/data/locations-cities';
import { COUNTRIES } from '@/scripts/data/locations-countries';
import { STATES } from '@/scripts/data/locations-states';
import type { LocationResults } from '@/scripts/types/location';
import type { City } from '@/scripts/types/location';

export class LocationsData
{
    public static Get(city: City): LocationResults
    {
        const country = COUNTRIES.find( ( c ) => c.id === city.countryId );
        const state = STATES.find( ( s ) => s.id === city.stateId );
    
        return {
            id: city.id,
            name: city.name,
            latitude: city.latitude,
            longitude: city.longitude,
            locations_provinces_id: city.stateId,
            locations_provinces_name: state?.name ?? '',
            locations_provinces_code: state?.code ?? '',
            locations_provinces_latitude: state?.latitude ?? 0,
            locations_provinces_longitude: state?.longitude ?? 0,
            locations_countries_id: city.countryId,
            locations_countries_name: country?.name ?? '',
            locations_countries_code: country?.code ?? '',
            locations_countries_latitude: country?.latitude ?? 0,
            locations_countries_longitude: country?.longitude ?? 0,
        };     
    }
}