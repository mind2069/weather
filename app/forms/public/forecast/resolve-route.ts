import { FormattingHelper } from "@/scripts/helpers/formatting";
import { DateHelper } from "@/scripts/helpers/date";

export const FORECAST_DEFAULT_DAYS = 14;
export const FORECAST_7_DAYS = 7;
export const FORECAST_3_DAYS = 3;

export interface ForecastRoute
{
    valid: boolean;
    dateStart: string;
    dateEnd: string;
    page: string;
    slug: string;
}

function RangeEndDate(dateStart: string, dayCount: number): string
{
    const end = new Date(`${dateStart}T12:00:00`);

    end.setDate(end.getDate() + dayCount - 1);

    return FormattingHelper.IsoDateLocal(end);
}

function DefaultRange(dayCount: number): { dateStart: string; dateEnd: string }
{
    const today = FormattingHelper.IsoDateLocal(new Date());

    return { dateStart: today, dateEnd: RangeEndDate(today, dayCount) };
}

function RangeDayCount(token: string): number | null
{
    if (token === "3-days" || token === "3-jours")
    {
        return FORECAST_3_DAYS;
    }

    if (token === "7-days" || token === "7-jours")
    {
        return FORECAST_7_DAYS;
    }

    if (token === "14-days" || token === "14-jours")
    {
        return FORECAST_DEFAULT_DAYS;
    }

    return null;
}

export function ForecastDaysFromRange(dateStart: string, dateEnd: string): number
{
    const start = new Date(`${dateStart}T12:00:00`);
    const end = new Date(`${dateEnd}T12:00:00`);
    const diffMs = end.getTime() - start.getTime();

    return Math.max(1, Math.round(diffMs / (24 * 60 * 60 * 1000)) + 1);
}

export function ResolveForecastRoute(page: string, filename: string): ForecastRoute
{
    const filenameTrimmed = filename?.trim() ?? "";
    const rangeDays = RangeDayCount(filenameTrimmed);

    if (rangeDays != null)
    {
        return { valid: true, ...DefaultRange(rangeDays), page, slug: filenameTrimmed };
    }

    if (filenameTrimmed)
    {
        const { dateStart, dateEnd } = DateHelper.FileNameToDates(filenameTrimmed);

        if (
            dateStart &&
            dateEnd &&
            FormattingHelper.IsValidIsoDate(dateStart) &&
            FormattingHelper.IsValidIsoDate(dateEnd)
        )
        {
            return {
                valid: true,
                dateStart,
                dateEnd,
                page,
                slug: filenameTrimmed,
            };
        }

        return { valid: false, ...DefaultRange(FORECAST_DEFAULT_DAYS), page, slug: "" };
    }

    return { valid: true, ...DefaultRange(FORECAST_DEFAULT_DAYS), page, slug: "" };
}
