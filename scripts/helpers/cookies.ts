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

        return parts.pop()?.split(";")[0]?.trim() || null;
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
}