import { unstable_cache } from "next/cache";
import * as OpenMeteoTypes from "@/services/open-meteo/types";
import { OpenMeteoForecast, OpenMeteoDay } from "@/scripts/types/open-meteo";

export class OpenMeteoServiceServer
{
    private static readonly CACHE_KEY_VERSION = "1.5";

    public static async Forecast( parameters: OpenMeteoTypes.OpenMeteoForecastParameters ): Promise<OpenMeteoTypes.OpenMeteoForecastResponse>
    {
        const latitude = parameters.session.user.location.latitude.toFixed(2);
        const longitude = parameters.session.user.location.longitude.toFixed(2);

        return unstable_cache(
            async () => OpenMeteoServiceServer.ForecastUncached(parameters),
            [
                `open-meteo-forecast-${OpenMeteoServiceServer.CACHE_KEY_VERSION}`,
                latitude,
                longitude,
                String(parameters.days),
                parameters.session.user.unit,
            ],
            { revalidate: 1800 }
        )();
    }

    private static async ForecastUncached( parameters: OpenMeteoTypes.OpenMeteoForecastParameters ): Promise<OpenMeteoTypes.OpenMeteoForecastResponse>
    {
        let success = false;
        let data: OpenMeteoForecast | null = null;
        let codes: string[] = ["UnknownError"];
        let message = "";

        try
        {
            const daily =
            [
                "temperature_2m_max",
                "temperature_2m_min",
                "uv_index_max",
                "uv_index_clear_sky_max",
                "wind_speed_10m_max",
                "wind_speed_10m_min",
                "weather_code",
                "sunrise",
                "sunset",
                "precipitation_probability_max",
                "precipitation_sum",
                "relative_humidity_2m_mean",
            ];

            const url = new URL("https://api.open-meteo.com/v1/forecast");
            const latitude = parameters.session.user.location.latitude.toFixed(2);
            const longitude = parameters.session.user.location.longitude.toFixed(2);

            url.searchParams.set("latitude", latitude);
            url.searchParams.set("longitude", longitude);
            url.searchParams.set("forecast_days", String(parameters.days));
            url.searchParams.set("timezone", "auto");
            url.searchParams.set("daily", daily.join(","));
            url.searchParams.set("hourly", "weather_code");

            if (parameters.session.user.unit == "imperial")
            {
                url.searchParams.set("temperature_unit", "fahrenheit");
                url.searchParams.set("wind_speed_unit", "mph");
            }
            else
            {
                url.searchParams.set("temperature_unit", "celsius");
                url.searchParams.set("wind_speed_unit", "kmh");
            }

            const response = await fetch(url.toString());

            if (response.ok)
            {
                success = true;
                data = await response.json() as OpenMeteoForecast;
                codes = ["Success"];
                message = "Open meteo get successful";
            }
            else
            {
                message = response.statusText;
            }
        }
        catch (error)
        {
            message = (error instanceof Error) ? error.message : String(error);
        }

        const json: OpenMeteoTypes.OpenMeteoForecastResponse =
        {
            success: success,
            data: data,
            codes: codes,
            message: message
        };

        return json;
    }

    public static async Day( parameters: OpenMeteoTypes.OpenMeteoDayParameters ): Promise<OpenMeteoTypes.OpenMeteoDayResponse>
    {
        const latitude = parameters.session.user.location.latitude.toFixed(2);
        const longitude = parameters.session.user.location.longitude.toFixed(2);
        
        let cached = true;

        const response = await unstable_cache(
            async () =>
            {
                cached = false;

                return OpenMeteoServiceServer.DayUncached(parameters);
            },
            [
                `open-meteo-day-${OpenMeteoServiceServer.CACHE_KEY_VERSION}`,
                latitude,
                longitude,
                parameters.date.trim(),
                parameters.session.user.unit,
            ],
            { revalidate: 1800 }
        )();

        return {
            success: response.success,
            data: response.data,
            codes: response.codes,
            message: response.message,
            cached: cached,
        };
    }

    private static async DayUncached( parameters: OpenMeteoTypes.OpenMeteoDayParameters ): Promise<Omit<OpenMeteoTypes.OpenMeteoDayResponse, "cached">>
    {
        let success = false;
        let data: OpenMeteoDay | null = null;
        let codes: string[] = ["UnknownError"];
        let message = "";

        try
        {
            const day = parameters.date.trim();

            if (!/^\d{4}-\d{2}-\d{2}$/.test(day))
            {
                message = "Invalid date; use YYYY-MM-DD";
            }
            else
            {
                const hourlyVars =
                [
                    "temperature_2m",
                    "apparent_temperature",
                    "relative_humidity_2m",
                    "precipitation",
                    "precipitation_probability",
                    "wind_speed_10m",
                    "wind_direction_10m",
                    "uv_index",
                    "weather_code",
                ];

                const url = new URL("https://api.open-meteo.com/v1/forecast");
                const latitude = parameters.session.user.location.latitude.toFixed(2);
                const longitude = parameters.session.user.location.longitude.toFixed(2);

                url.searchParams.set("latitude", latitude);
                url.searchParams.set("longitude", longitude);
                url.searchParams.set("timezone", "auto");
                url.searchParams.set("start_date", day);
                url.searchParams.set("end_date", day);
                url.searchParams.set("hourly", hourlyVars.join(","));
                url.searchParams.set("daily", "sunrise,sunset,weather_code");

                if (parameters.session.user.unit == "imperial")
                {
                    url.searchParams.set("temperature_unit", "fahrenheit");
                    url.searchParams.set("wind_speed_unit", "mph");
                }
                else
                {
                    url.searchParams.set("temperature_unit", "celsius");
                    url.searchParams.set("wind_speed_unit", "kmh");
                }

                const response = await fetch(url.toString());

                if (response.ok)
                {
                    data = await response.json() as OpenMeteoDay;
                    success = true;
                    codes = ["Success"];
                    message = "Open-Meteo day hourly forecast retrieved";
                }
                else
                {
                    message = response.statusText;
                }
            }
        }
        catch (error)
        {
            message = (error instanceof Error) ? error.message : String(error);
        }

        return {
            success: success,
            data: data,
            codes: codes,
            message: message,
        };
    }
}
