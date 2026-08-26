import { FormattingHelper } from "@/scripts/helpers/formatting";
import { DateHelper } from "@/scripts/helpers/date";

export type DayRouteKind = "today" | "tomorrow" | "after-tomorrow" | "date";

export interface DayRoute
{
    valid: boolean;
    date: string;
    kind: DayRouteKind;
}

function KindFromIsoDate(isoDate: string): DayRouteKind
{
    const today = FormattingHelper.IsoDateLocal(new Date());
    const tomorrow = FormattingHelper.IsoDateLocal(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const afterTomorrow = FormattingHelper.IsoDateLocal(new Date(Date.now() + 48 * 60 * 60 * 1000));

    if (isoDate === today)
    {
        return "today";
    }

    if (isoDate === tomorrow)
    {
        return "tomorrow";
    }

    if (isoDate === afterTomorrow)
    {
        return "after-tomorrow";
    }

    return "date";
}

export function EffectiveDayDate(kind: DayRouteKind, fixedDate: string): string
{
    if (kind === "today")
    {
        return FormattingHelper.IsoDateLocal(new Date());
    }

    if (kind === "tomorrow")
    {
        return FormattingHelper.IsoDateLocal(new Date(Date.now() + 24 * 60 * 60 * 1000));
    }

    if (kind === "after-tomorrow")
    {
        return FormattingHelper.IsoDateLocal(new Date(Date.now() + 48 * 60 * 60 * 1000));
    }

    return fixedDate;
}

export function ResolveDayRoute(page: string, filename: string): DayRoute
{
    const today = FormattingHelper.IsoDateLocal(new Date());
    const filenameTrimmed = filename?.trim() ?? "";

    if (page === "day" || page === "journee")
    {
        if (FormattingHelper.IsValidIsoDate(filenameTrimmed))
        {
            return {
                valid: true,
                date: filenameTrimmed,
                kind: KindFromIsoDate(filenameTrimmed),
            };
        }

        const dateFromSlug = DateHelper.FileNameToDate(filenameTrimmed);

        if (dateFromSlug)
        {
            return {
                valid: true,
                date: dateFromSlug,
                kind: KindFromIsoDate(dateFromSlug),
            };
        }

        return { valid: false, date: today, kind: "today" };
    }

    return { valid: false, date: today, kind: "today" };
}
