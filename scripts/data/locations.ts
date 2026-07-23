import type { LocationDefault } from '@/scripts/types/location';

export class LocationsData
{
    public static FormatName(location: Pick<LocationDefault, "city" | "province" | "country">): string
    {
        return `${location.city}, ${location.province}, ${location.country}`;
    }

    public static DefaultCity(): LocationDefault
    {
        const location = 
        { 
            id: 0,
            city: "Laval", 
            province: "Quebec", 
            country: "Canada", 
            latitude: 45.6068, 
            longitude: -73.7129 
        };

        return location;
    }
}