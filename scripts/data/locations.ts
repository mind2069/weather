import { CITIES } from '@/scripts/data/locations-cities';
import { COUNTRIES } from '@/scripts/data/locations-countries';
import { STATES } from '@/scripts/data/locations-states';
import type { City, LocationDefault, LocationResults } from '@/scripts/types/location';

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

    public static FormatName(location: LocationResults): string
    {
        return location.name + ", " + location.locations_provinces_name + ", " + location.locations_countries_name;
    }

    public static DefaultCity(): LocationDefault
    {
        return { name: "Laval, Quebec, Canada (Default)", latitude: 45.6068, longitude: -73.7129 };

        // const laval = CITIES.find((city) => city.name === "Laval");

        // if (!laval)
        // {
        //     return { name: "Laval, Quebec, Canada", latitude: 45.6068, longitude: -73.7129 };
        // }

        // const location = LocationsData.Get(laval);

        // return {
        //     name: LocationsData.FormatName(location),
        //     latitude: location.latitude,
        //     longitude: location.longitude,
        // };
    }

    private static DistanceSquared(latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number): number
    {
        const deltaLatitude = latitudeB - latitudeA;
        const deltaLongitude = longitudeB - longitudeA;

        return deltaLatitude * deltaLatitude + deltaLongitude * deltaLongitude;
    }

    public static async Closest(latitude: number, longitude: number): Promise<LocationResults>
    {
        let closestCity: City = CITIES[0];
        let minDistance = Number.POSITIVE_INFINITY;

        for (const city of CITIES)
        {
            if (city.name_normalized === "unknown")
            {
                continue;
            }

            const distance = LocationsData.DistanceSquared(latitude, longitude, city.latitude, city.longitude);

            if (distance < minDistance)
            {
                minDistance = distance;
                closestCity = city;
            }
        }

        return LocationsData.Get(closestCity);
    }
}