import { LocationHelper } from "@/scripts/helpers/location";

export const COOKIE_PATH = "/";
export const COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
export const COOKIE_SAME_SITE = "lax" as const;
export const COOKIE_DEFAULT_OPTIONS = 
{
    path: COOKIE_PATH,
    maxAge: COOKIE_MAX_AGE_SECONDS,
    sameSite: COOKIE_SAME_SITE,
    
} as const;

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
    
    public static Set(name: string, value: string, maxAgeSeconds: number = COOKIE_MAX_AGE_SECONDS): void
    {
        if (typeof document === "undefined")
        {
            return;
        }

        const encodedValue = encodeURIComponent(value);

        document.cookie = `${name}=${encodedValue};path=${COOKIE_PATH};max-age=${maxAgeSeconds};SameSite=${COOKIE_SAME_SITE}`;
    }

    public static Delete(name: string): void
    {
        if (typeof document === "undefined")
        {
            return;
        }

        document.cookie = `${name}=;path=${COOKIE_PATH};max-age=0;SameSite=${COOKIE_SAME_SITE}`;
    }
}