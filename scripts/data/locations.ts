import type { LocationDefault, LocationResults } from '@/scripts/types/location';

export class LocationsData
{
    public static FormatName(location: LocationResults): string
    {
        return `${location.city}, ${location.province}, ${location.country}`;
    }

    public static DefaultCity(): LocationDefault
    {
        return { name: "Laval, Quebec, Canada (Default)", latitude: 45.6068, longitude: -73.7129 };
    }
}