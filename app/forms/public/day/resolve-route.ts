import { FormattingHelper } from "@/scripts/helpers/formatting";

export type DayRouteKind = "today" | "tomorrow" | "date";

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

    return fixedDate;
}

export function ResolveDayRoute(pathname: string): DayRoute
{
    const segments = pathname.split("/").filter(Boolean);
    const today = FormattingHelper.IsoDateLocal(new Date());
    const tomorrow = FormattingHelper.IsoDateLocal(new Date(Date.now() + 24 * 60 * 60 * 1000));

    if (segments.length === 2)
    {
        switch (segments[1])
        {
            case "day":
            case "journee":
            case "today":
            case "aujourdhui":
                return { valid: true, date: today, kind: "today" };

            case "tomorrow":
            case "demain":
                return { valid: true, date: tomorrow, kind: "tomorrow" };
        }
    }
    else if (segments.length === 3)
    {
        const date = segments[2];

        if (FormattingHelper.IsValidIsoDate(date))
        {
            return { valid: true, date, kind: "date" };
        }
    }

    return { valid: false, date: today, kind: "today" };
}
