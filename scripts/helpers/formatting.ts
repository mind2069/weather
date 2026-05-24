export class FormattingHelper
{
    /** Calendar `YYYY-MM-DD` in the environment’s local timezone (server or browser). */
    public static IsoDateLocal(d: Date): string
    {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    /** True if `s` is a real calendar day in `YYYY-MM-DD` form. */
    public static IsValidIsoDate(s: string): boolean
    {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);

        if (!m)
        {
            return false;
        }

        const y = Number(m[1]);
        const mo = Number(m[2]);
        const da = Number(m[3]);
        const d = new Date(Date.UTC(y, mo - 1, da));

        return (
            d.getUTCFullYear() === y &&
            d.getUTCMonth() + 1 === mo &&
            d.getUTCDate() === da
        );
    }

    public static Weekday(isoDate: string, locale: string): string
    {
        const d = new Date(`${isoDate}T12:00:00`);
        const weekday = d.toLocaleDateString(locale, { weekday: "long" });

        if (weekday.length === 0)
        {
            return weekday;
        }

        return weekday[0].toUpperCase() + weekday.slice(1);
    }
    
    public static CalendarDate(isoDate: string, locale: string): string
    {
        const d = new Date(`${isoDate}T12:00:00`);
    
        return d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
    }

    public static TextLong(isoDate: string, locale: string): string
    {
        const d = new Date(`${isoDate}T12:00:00`);
        const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" });
        const parts = formatter.formatToParts(d);

        return parts
            .map((p) =>
            {
                if (p.type === "month" && p.value.length > 0)
                {
                    return p.value[0].toUpperCase() + p.value.slice(1);
                }

                return p.value;
            })
            .join("");
    }
    
    public static LocalTime(iso: string, locale: string): string
    {
        const d = new Date(iso);
    
        if (Number.isNaN(d.getTime()))
        {
            return "—";
        }
    
        return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    }
    
    public static UvIndex(value: number): string
    {
        if (value == null || Number.isNaN(value))
        {
            return "—";
        }
    
        return value.toFixed(1);
    }
}