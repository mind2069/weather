import { TextHelper } from "@/scripts/helpers/text";

export const FORECAST_DEFAULT_DAYS = 14;

export interface ForecastRoute
{
    valid: boolean;
    days: number;
}

export function ResolveForecastRoute(pathname: string): ForecastRoute
{
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 2)
    {
        const page = segments[1];

        if (page === "forecast" || page === "prevision")
        {
            return { valid: true, days: FORECAST_DEFAULT_DAYS };
        }
    }
    else if (segments.length === 3)
    {
        const page = segments[1];

        if (page === "forecast" || page === "prevision")
        {
            const digits = TextHelper.Numeric(segments[2]);

            if (digits.length > 0)
            {
                const days = Number.parseInt(digits, 10);

                if (Number.isFinite(days) && days > 0)
                {
                    return { valid: true, days };
                }
            }
        }
    }

    return { valid: false, days: FORECAST_DEFAULT_DAYS };
}
