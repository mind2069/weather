import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigurationsClient } from '@/scripts/configurations/configurations-client';

class SupabaseClientSingleton
{
    private static instance: SupabaseClient | null = null;

    public static getInstance(): SupabaseClient
    {
        if (!SupabaseClientSingleton.instance)
        {
            const url = ConfigurationsClient.Supabase.Url;
            const key = ConfigurationsClient.Supabase.AnonKey;

            SupabaseClientSingleton.instance = createClient(url, key);
        }

        return SupabaseClientSingleton.instance;
    }
}

export function SupabaseConnectionClient(): SupabaseClient
{
    return SupabaseClientSingleton.getInstance();
}
