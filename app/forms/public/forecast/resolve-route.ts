import { TextHelper } from "@/scripts/helpers/text";

export const FORECAST_DEFAULT_DAYS = 14;

export interface ForecastRoute
{
    valid: boolean;
    days: number;
}

export function ResolveForecastRoute(page: string): ForecastRoute
{
    let days = FORECAST_DEFAULT_DAYS;

    const digits = TextHelper.Numeric(page);

    if (digits.length > 0)
    {
        days = Number.parseInt(digits, 10)
    }

    return { valid: true, days: days };
}
