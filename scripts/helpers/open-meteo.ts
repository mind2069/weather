import { OpenMeteoForecast, OpenMeteoDay, ForecastNormalized, DayNormalized, HourlyNormalized } from "@/scripts/types/open-meteo";
import { WEATHER_ICONS, WEATHER_ICONS_UNKNOWN } from "@/scripts/constants/open-meteo";
import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import { FormattingHelper } from "@/scripts/helpers/formatting";
import { Session } from "@/scripts/types/session";

function DaylightWeatherCodes(date: string, sunrise: string, sunset: string, hourlyTime: string[], hourlyCode: number[]): number[]
{
    const sunriseMs = Date.parse(sunrise);
    const sunsetMs = Date.parse(sunset);

    if (Number.isNaN(sunriseMs) || Number.isNaN(sunsetMs) || sunsetMs < sunriseMs)
    {
        return [];
    }

    const n = Math.min(hourlyTime.length, hourlyCode.length);
    const out: number[] = [];

    for (let j = 0; j < n; j++)
    {
        const t = hourlyTime[j];

        if (t.length < 10 || t.slice(0, 10) !== date)
        {
            continue;
        }

        const ms = Date.parse(t);

        if (Number.isNaN(ms) || ms < sunriseMs || ms > sunsetMs)
        {
            continue;
        }

        const code = hourlyCode[j];

        if (code != null && !Number.isNaN(code))
        {
            out.push(code);
        }
    }

    return out;
}

function TimeWithAmPm(iso: string): string
{
    const d = new Date(iso);

    if (Number.isNaN(d.getTime()))
    {
        return iso;
    }

    const hours24 = d.getHours();
    const minutes = d.getMinutes();
    const hours12 = hours24 % 12 || 12;
    const amPm = hours24 < 12 ? "AM" : "PM";

    return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${amPm}`;
}

function ModeWeatherCode(codes: number[]): number | null
{
    if (codes.length === 0)
    {
        return null;
    }

    const counts = new Map<number, number>();

    for (const c of codes)
    {
        counts.set(c, (counts.get(c) ?? 0) + 1);
    }

    let best = codes[0];
    let bestCount = -1;

    for (const [code, count] of counts)
    {
        if (count > bestCount || (count === bestCount && code < best))
        {
            bestCount = count;
            best = code;
        }
    }

    return best;
}

export class OpenMeteoHelper
{
    public static ForecastNormalize(session: Session, data: OpenMeteoForecast): ForecastNormalized[]
    {
        LanguagesHelper.Initialize(session.language.code);

        const hourly = data.hourly;

        return data.daily.time.map((date, i) =>
        {
            const p = data.daily.precipitation_probability_max?.[i];
            const rh = data.daily.relative_humidity_2m_mean?.[i];
            const sunrise = data.daily.sunrise[i];
            const sunset = data.daily.sunset[i]; 
            const displayCodeFallback = data.daily.weather_code[i];
            const windDirRaw = data.daily.wind_direction_10m_dominant?.[i];
            const windDirection = windDirRaw == null || Number.isNaN(windDirRaw) ? 0 : Math.round(((windDirRaw % 360) + 360) % 360);

            let displayCode = displayCodeFallback;

            if (hourly?.time?.length && hourly.weather_code?.length)
            {
                const daylight = DaylightWeatherCodes(
                    date,
                    sunrise,
                    sunset,
                    hourly.time,
                    hourly.weather_code,
                );

                const mode = ModeWeatherCode(daylight);

                if (mode != null)
                {
                    displayCode = mode;
                }
            }

            return {
                date: date,
                tempMin: data.daily.temperature_2m_min[i],
                tempMax: data.daily.temperature_2m_max[i],
                humidity: rh == null || Number.isNaN(rh) ? 0 : Math.round(Math.min(100, Math.max(0, rh))),
                uvMin: 0,
                uvMax: data.daily.uv_index_max[i],
                uvClearSkyMax: data.daily.uv_index_clear_sky_max[i],
                windMin: data.daily.wind_speed_10m_min[i],
                windMax: data.daily.wind_speed_10m_max[i],
                windDirection,
                rainProbability: p == null || Number.isNaN(p) ? 0 : Math.round(Math.min(100, Math.max(0, p))),
                forecast: LanguagesHelper.WeatherCaption(displayCode),
                icon: WEATHER_ICONS[displayCode] ?? WEATHER_ICONS_UNKNOWN,
                severityForecast: LanguagesHelper.WeatherCaption(displayCodeFallback),
                severityIcon: WEATHER_ICONS[displayCodeFallback] ?? WEATHER_ICONS_UNKNOWN,
                sunrise: sunrise,
                sunset: sunset,
            };
        });
    }

    public static DayNormalize(session: Session, data: OpenMeteoDay): DayNormalized | null
    {
        LanguagesHelper.Initialize(session.language.code);

        const h = data.hourly;
        const times = h.time;

        if (!times.length)
        {
            return null;
        }

        const num = (v: number | null | undefined): number => v == null || Number.isNaN(v) ? 0 : v;
        const date = times[0].split("T")[0];
        const sunrise = data.daily.sunrise[0] ?? "";
        const sunset = data.daily.sunset[0] ?? "";

        const hourly: HourlyNormalized[] = times.map((t, i) =>
        {
            const code = h.weather_code[i] ?? 0;

            return {
                time: t,
                temperature: num(h.temperature_2m[i]),
                feelsLike: num(h.apparent_temperature[i]),
                humidity: num(h.relative_humidity_2m[i]),
                precipitation: num(h.precipitation[i]),
                windSpeed: num(h.wind_speed_10m[i]),
                windDirection: num(h.wind_direction_10m[i]),
                uvIndex: num(h.uv_index[i]),
                forecast: LanguagesHelper.WeatherCaption(code),
                icon: WEATHER_ICONS[code] ?? WEATHER_ICONS_UNKNOWN,
            };
        });

        const temps = h.temperature_2m.map(num);
        const feels = h.apparent_temperature.map(num);
        const humidities = h.relative_humidity_2m.map(num);
        const precips = h.precipitation.map(num);
        const winds = h.wind_speed_10m.map(num);
        const windDirections = h.wind_direction_10m.map(num);
        const uvs = h.uv_index.map(num);

        const dailyCodeRaw = data.daily.weather_code?.[0];
        const dailyCode = dailyCodeRaw != null && !Number.isNaN(dailyCodeRaw) ? dailyCodeRaw : null;
        const fallbackHour = hourly[Math.floor(hourly.length / 2)];

        let highlights: HourlyNormalized | null = null;

        if (date === FormattingHelper.IsoDateLocal(new Date()))
        {
            const nowMs = Date.now();

            let bestIdx = 0;
            let bestDelta = Infinity;

            for (let i = 0; i < hourly.length; i++)
            {
                const slotMs = Date.parse(hourly[i].time);

                if (Number.isNaN(slotMs))
                {
                    continue;
                }

                const delta = Math.abs(slotMs - nowMs);

                if (delta < bestDelta)
                {
                    bestDelta = delta;
                    bestIdx = i;
                }
            }

            highlights = hourly[bestIdx];
        }
        else
        {
            const maxWind = Math.max(...winds);
            const windMaxIdx = h.wind_speed_10m.findIndex((v) => num(v) === maxWind);

            highlights = 
            {
                time: fallbackHour?.time ?? `${date}T12:00`,
                temperature: Math.max(...temps),
                feelsLike: Math.max(...feels),
                humidity: Math.max(...humidities),
                precipitation: Math.max(...precips),
                windSpeed: maxWind,
                windDirection: windMaxIdx >= 0 ? num(h.wind_direction_10m[windMaxIdx]) : (fallbackHour?.windDirection ?? 0),
                uvIndex: Math.max(...uvs),
                forecast: dailyCode != null ? LanguagesHelper.WeatherCaption(dailyCode) : (fallbackHour?.forecast ?? ""),
                icon: dailyCode != null ? (WEATHER_ICONS[dailyCode] ?? WEATHER_ICONS_UNKNOWN) : (fallbackHour?.icon ?? WEATHER_ICONS_UNKNOWN),
            };
        }

        return {
            date: date,
            sunrise: sunrise,
            sunset: sunset,
            tempMin: Math.min(...temps),
            tempMax: Math.max(...temps),
            windMin: Math.min(...winds),
            windMax: Math.max(...winds),
            windDirections: windDirections,
            uvMin: Math.min(...uvs),
            uvMax: Math.max(...uvs),
            hourly: hourly,
            highlights: highlights,
        };
    }
}
