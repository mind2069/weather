import { CookiesHelper } from "@/scripts/helpers/cookies";

export class LocationHelper
{
    public static LatitudeNormalize(value: number): number
    {
        return Number.isFinite(value) && value >= -90 && value <= 90 ? value : -999999;
    }

    public static LongitudeNormalize(value: number): number
    {
        return Number.isFinite(value) && value >= -180 && value <= 180 ? value : -999999;
    }

    public static CookiesCompleted(cookieHeader: string): boolean
    {
        const locationCookie = CookiesHelper.Get(cookieHeader, "location")?.trim() ?? "";
        const latitudeCookie = CookiesHelper.Get(cookieHeader, "latitude") ?? "";
        const longitudeCookie = CookiesHelper.Get(cookieHeader, "longitude") ?? "";

        const location = locationCookie.trim();
        const latitude = LocationHelper.LatitudeNormalize(Number.parseFloat(latitudeCookie));
        const longitude = LocationHelper.LongitudeNormalize(Number.parseFloat(longitudeCookie));

        const locationValid = location !== "";
        const latitudeValid = latitude !== -999999;
        const longitudeValid = longitude !== -999999;

        return locationValid && latitudeValid && longitudeValid;
    }
}
