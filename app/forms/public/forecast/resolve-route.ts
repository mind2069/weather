import { FormattingHelper } from "@/scripts/helpers/formatting";
import { DateHelper } from "@/scripts/helpers/date";

export const FORECAST_DEFAULT_DAYS = 14;
export const FORECAST_7_DAYS = 7;

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

function DayCountForPage(page: string): number
{
    switch (page)
    {
        case "7-days":
        case "7-jours":

            return FORECAST_7_DAYS;

        case "14-days":
        case "14-jours":

            return FORECAST_DEFAULT_DAYS;

        case "forecast":
        case "prevision":  
        default:

            return FORECAST_DEFAULT_DAYS;
    }
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
    const dayCount = DayCountForPage(page);
    const fallback = DefaultRange(dayCount);

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
            const normalizedEnd = RangeEndDate(dateStart, dayCount);

            return {
                valid: true,
                dateStart,
                dateEnd: normalizedEnd,
                page,
                slug: filenameTrimmed,
            };
        }

        return { valid: false, ...fallback, page, slug: "" };
    }

    return { valid: true, ...fallback, page, slug: "" };
}
