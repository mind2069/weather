import { TextHelper } from "@/scripts/helpers/text";

export const FORECAST_DEFAULT_DAYS = 14;

export interface ForecastRoute
{
    valid: boolean;
    days: number;
}

export function ResolveForecastRoute(page: string): ForecastRoute
{
    // Page token only (e.g. forecast-7-days). Ignore SEO filename slugs.
    const token = page.split("/").filter(Boolean).find((segment) =>
        segment.includes("forecast") || segment.includes("prevision")
    ) ?? page;

    let days = FORECAST_DEFAULT_DAYS;

    const digits = TextHelper.Numeric(token);

    if (digits.length > 0)
    {
        days = Number.parseInt(digits, 10);
    }

    return { valid: true, days: days };
}
