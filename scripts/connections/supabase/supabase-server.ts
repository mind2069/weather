import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigurationsServer } from "@/scripts/configurations/configurations-server";

export function SupabaseConnectionServer(): SupabaseClient
{
    const url = ConfigurationsServer.Supabase.Url;
    const key = ConfigurationsServer.Supabase.ServiceRoleKey;

    return createClient(url, key);
}
