import { unstable_cache } from "next/cache";
import * as OpenMeteoTypes from "@/services/open-meteo/types";
import { OpenMeteoForecast, OpenMeteoDay } from "@/scripts/types/open-meteo";

export class OpenMeteoServiceServer
{
    private static readonly CACHE_KEY_VERSION = "1.11";
    /** Standard forecast often returns an empty last day at 16; use 15 then ensemble. */
    private static readonly FORECAST_API_MAX_DAYS = 15;
    private static readonly ENSEMBLE_MEAN_MODEL = "ncep_gefs_ensemble_mean_seamless";

    public static async Forecast( parameters: OpenMeteoTypes.OpenMeteoForecastParameters ): Promise<OpenMeteoTypes.OpenMeteoForecastResponse>
    {
        const latitude = parameters.session.weather.location.latitude.toFixed(2);
        const longitude = parameters.session.weather.location.longitude.toFixed(2);

        return unstable_cache(
            async () => OpenMeteoServiceServer.ForecastUncached(parameters),
            [
                `open-meteo-forecast-${OpenMeteoServiceServer.CACHE_KEY_VERSION}`,
                latitude,
                longitude,
                parameters.dateStart,
                parameters.dateEnd,
                parameters.session.user.unit,
            ],
            { revalidate: 1800 }
        )();
    }

    private static ForecastDayCount(dateStart: string, dateEnd: string): number
    {
        const start = new Date(`${dateStart}T12:00:00`);
        const end = new Date(`${dateEnd}T12:00:00`);

        return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    }

    private static AddDaysIso(isoDate: string, days: number): string
    {
        const d = new Date(`${isoDate}T12:00:00`);

        d.setDate(d.getDate() + days);

        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    private static MergeForecast(primary: OpenMeteoForecast, extension: OpenMeteoForecast): OpenMeteoForecast
    {
        const mergeDaily = <T,>(a: T[] | undefined, b: T[] | undefined): T[] | undefined =>
        {
            if (!a && !b)
            {
                return undefined;
            }

            return [...(a ?? []), ...(b ?? [])];
        };

        return {
            ...primary,
            daily_units: primary.daily_units,
            daily:
            {
                time: [...primary.daily.time, ...extension.daily.time],
                temperature_2m_max: [...primary.daily.temperature_2m_max, ...extension.daily.temperature_2m_max],
                temperature_2m_min: [...primary.daily.temperature_2m_min, ...extension.daily.temperature_2m_min],
                uv_index_max: [...primary.daily.uv_index_max, ...extension.daily.uv_index_max],
                uv_index_clear_sky_max: [...primary.daily.uv_index_clear_sky_max, ...extension.daily.uv_index_clear_sky_max],
                wind_speed_10m_max: [...primary.daily.wind_speed_10m_max, ...extension.daily.wind_speed_10m_max],
                wind_speed_10m_min: [...primary.daily.wind_speed_10m_min, ...extension.daily.wind_speed_10m_min],
                wind_direction_10m_dominant: mergeDaily(
                    primary.daily.wind_direction_10m_dominant,
                    extension.daily.wind_direction_10m_dominant,
                ),
                weather_code: [...primary.daily.weather_code, ...extension.daily.weather_code],
                sunrise: [...primary.daily.sunrise, ...extension.daily.sunrise],
                sunset: [...primary.daily.sunset, ...extension.daily.sunset],
                precipitation_probability_max: mergeDaily(
                    primary.daily.precipitation_probability_max,
                    extension.daily.precipitation_probability_max,
                ),
                precipitation_sum: mergeDaily(primary.daily.precipitation_sum, extension.daily.precipitation_sum),
                relative_humidity_2m_mean: mergeDaily(
                    primary.daily.relative_humidity_2m_mean,
                    extension.daily.relative_humidity_2m_mean,
                ),
                relative_humidity_2m_min: mergeDaily(
                    primary.daily.relative_humidity_2m_min,
                    extension.daily.relative_humidity_2m_min,
                ),
                relative_humidity_2m_max: mergeDaily(
                    primary.daily.relative_humidity_2m_max,
                    extension.daily.relative_humidity_2m_max,
                ),
            },
            hourly_units: primary.hourly_units ?? extension.hourly_units,
            hourly:
            {
                time: [...(primary.hourly?.time ?? []), ...(extension.hourly?.time ?? [])],
                weather_code: [...(primary.hourly?.weather_code ?? []), ...(extension.hourly?.weather_code ?? [])],
            },
        };
    }

    private static async ForecastFetch(
        parameters: OpenMeteoTypes.OpenMeteoForecastParameters,
        dateStart: string,
        dateEnd: string,
        ensemble: boolean,
        daily: string[],
    ): Promise<OpenMeteoForecast>
    {
        const url = new URL(
            ensemble
                ? "https://ensemble-api.open-meteo.com/v1/ensemble"
                : "https://api.open-meteo.com/v1/forecast",
        );
        const latitude = parameters.session.weather.location.latitude.toFixed(2);
        const longitude = parameters.session.weather.location.longitude.toFixed(2);

        url.searchParams.set("latitude", latitude);
        url.searchParams.set("longitude", longitude);
        url.searchParams.set("start_date", dateStart);
        url.searchParams.set("end_date", dateEnd);
        url.searchParams.set("timezone", "auto");
        url.searchParams.set("daily", daily.join(","));
        url.searchParams.set("hourly", "weather_code");

        if (ensemble)
        {
            url.searchParams.set("models", OpenMeteoServiceServer.ENSEMBLE_MEAN_MODEL);
        }

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

        if (!response.ok)
        {
            throw new Error(response.statusText || "Open meteo request failed");
        }

        return await response.json() as OpenMeteoForecast;
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
                "wind_direction_10m_dominant",
                "weather_code",
                "sunrise",
                "sunset",
                "precipitation_probability_max",
                "precipitation_sum",
                "relative_humidity_2m_mean",
                "relative_humidity_2m_min",
                "relative_humidity_2m_max",
            ];

            const dayCount = OpenMeteoServiceServer.ForecastDayCount(parameters.dateStart, parameters.dateEnd);
            const standardDays = Math.min(dayCount, OpenMeteoServiceServer.FORECAST_API_MAX_DAYS);
            const standardEnd = OpenMeteoServiceServer.AddDaysIso(parameters.dateStart, standardDays - 1);

            const primary = await OpenMeteoServiceServer.ForecastFetch(
                parameters,
                parameters.dateStart,
                standardEnd,
                false,
                daily,
            );

            if (dayCount > OpenMeteoServiceServer.FORECAST_API_MAX_DAYS)
            {
                const extensionStart = OpenMeteoServiceServer.AddDaysIso(standardEnd, 1);
                const extension = await OpenMeteoServiceServer.ForecastFetch(
                    parameters,
                    extensionStart,
                    parameters.dateEnd,
                    true,
                    daily,
                );

                data = OpenMeteoServiceServer.MergeForecast(primary, extension);
            }
            else
            {
                data = primary;
            }

            success = true;
            codes = ["Success"];
            message = "Open meteo get successful";
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
        const latitude = parameters.session.weather.location.latitude.toFixed(2);
        const longitude = parameters.session.weather.location.longitude.toFixed(2);
        
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
                const latitude = parameters.session.weather.location.latitude.toFixed(2);
                const longitude = parameters.session.weather.location.longitude.toFixed(2);

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
