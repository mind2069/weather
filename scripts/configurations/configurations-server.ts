export type TypeConfigurationsServer =
{
    Environment: string;
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
    Environment: isDevelopment ? "development" : "production"
};
