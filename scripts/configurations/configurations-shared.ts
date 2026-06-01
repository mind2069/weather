export type TypeConfigurationsShared =
{
    Environment: string;
    Name: string;
    Hostname: string;
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

function ConfigurationsSharedValidate(value: string, name: string): string
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

export const ConfigurationsShared: TypeConfigurationsShared =
{
    Environment: isDevelopment ? "development" : "production",
    Name: "WeatherSimple",
    Hostname: "weathersimple.app",
    Api:
    {
        Base: isDevelopment ? "http://localhost:3000" : "https://weathersimple.app"
    },
    Website:
    {
        Base: isDevelopment ? "http://localhost:3000" : "https://weathersimple.app"
    }
};
