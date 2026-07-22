export type TypeConfigurationsClient =
{
    Environment: string;
    Supabase:
    {
        Url: string;
        AnonKey: string;
    }
};

const isDevelopment = process.env.NODE_ENV === "development";

function ConfigurationsClientValidate(value: string, name: string): string
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

export const ConfigurationsClient: TypeConfigurationsClient =
{
    Environment: isDevelopment ? "development" : "production",
    Supabase:
    {
        Url: ConfigurationsClientValidate(process.env.NEXT_PUBLIC_SUPABASE_URL || "", "NEXT_PUBLIC_SUPABASE_URL"),
        AnonKey: ConfigurationsClientValidate(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", "NEXT_PUBLIC_SUPABASE_ANON_KEY")
    },
};
