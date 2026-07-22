export type TypeConfigurationsServer =
{
    Environment: string;
    Supabase:
    {
        Url: string;
        ServiceRoleKey: string;
        AnonKey: string;
    };
};

function ConfigurationsServerValidate(value: string, name: string): string
{
    if (!value || value.trim() === "")
    {
        throw new Error(`Required environment variable ${name} is not set!`);
    }

    value = value.trim();

    if(value.startsWith("\""))
    {
        value = value.substring(1);
    }

    if(value.endsWith("\""))
    {
        value = value.substring(0, value.length - 1);
    }

    return value;
}

const isDevelopment = process.env.NODE_ENV === "development";

export const ConfigurationsServer: TypeConfigurationsServer =
{
    Environment: isDevelopment ? "development" : "production",
    Supabase:
    {
        Url: ConfigurationsServerValidate(process.env.SUPABASE_URL || "", "SUPABASE_URL"),
        ServiceRoleKey: ConfigurationsServerValidate(process.env.SUPABASE_SERVICE_ROLE_KEY || "", "SUPABASE_SERVICE_ROLE_KEY"),
        AnonKey: ConfigurationsServerValidate(process.env.SUPABASE_ANON_KEY || "", "SUPABASE_ANON_KEY")
    },
};
