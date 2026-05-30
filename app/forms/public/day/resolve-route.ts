import { FormattingHelper } from "@/scripts/helpers/formatting";

export type DayRouteKind = "today" | "tomorrow" | "after-tomorrow" | "date";

export interface DayRoute
{
    valid: boolean;
    date: string;
    kind: DayRouteKind;
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

export function ResolveDayRoute(page: string): DayRoute
{
    const today = FormattingHelper.IsoDateLocal(new Date());
    const tomorrow = FormattingHelper.IsoDateLocal(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const afterTomorrow = FormattingHelper.IsoDateLocal(new Date(Date.now() + 48 * 60 * 60 * 1000));

    switch (page)
    {
        case "day":
        case "journee":
        case "today":
        case "aujourdhui":

            return { valid: true, date: today, kind: "today" };

        case "tomorrow":
        case "demain":

            return { valid: true, date: tomorrow, kind: "tomorrow" };

        case "after-tomorrow":
        case "apres-demain":

             return { valid: true, date: afterTomorrow, kind: "after-tomorrow" };
    }

    return { valid: false, date: today, kind: "today" };
}
