export type TypeConfigurationsClient =
{
    Environment: string;
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
};
