import { LocationHelper } from "@/scripts/helpers/location";

export class CookiesHelper
{
    public static Get(cookies: string, name: string): string | null
    {
        if (!cookies)
        {
            return null;
        }

        const prefixed = `; ${cookies.trim()}`;
        const parts = prefixed.split(`; ${name}=`);

        if (parts.length < 2)
        {
            return null;
        }

        const value = parts.pop()?.split(";")[0]?.trim() || null;

        if (value === null)
        {
            return null;
        }

        try
        {
            return decodeURIComponent(value);
        }
        catch
        {
            return value;
        }
    }
    
    public static Set(name: string, value: string, days: number = 365): void
    {
        if (typeof document === 'undefined')
        {
            return;
        }
        
        const expires = new Date();
        
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }
    
    public static Delete(name: string): void
    {
        if (typeof document === 'undefined')
        {
            return;
        }
        
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }

    public static HasCompleteLocation(cookieHeader: string): boolean
    {
        const location = CookiesHelper.Get(cookieHeader, "location")?.trim() ?? "";
        const latitude = LocationHelper.LatitudeNormalize(Number.parseFloat(CookiesHelper.Get(cookieHeader, "latitude") ?? ""));
        const longitude = LocationHelper.LongitudeNormalize(Number.parseFloat(CookiesHelper.Get(cookieHeader, "longitude") ?? ""));

        return location !== "" && latitude !== -999999 && longitude !== -999999;
    }
}