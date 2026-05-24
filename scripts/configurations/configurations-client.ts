export type TypeConfigurationsClient =
{
    Api:
    {
        Base: string;
    },
    Website:
    {
        Base: string;
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
    Api:
    {
        Base: isDevelopment ? "http://localhost:3000" : "http://localhost:3000"
    },
    Website:
    {
        Base: isDevelopment ? "http://localhost:3000" : "hhttp://localhost:3000"
    }
};
