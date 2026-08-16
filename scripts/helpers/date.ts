import { FormattingHelper } from "@/scripts/helpers/formatting";
import { TextHelper } from "@/scripts/helpers/text";

export class DateHelper
{
    private static readonly MONTHS: Record<string, number> =
    {
        january: 1,
        february: 2,
        march: 3,
        april: 4,
        may: 5,
        june: 6,
        july: 7,
        august: 8,
        september: 9,
        october: 10,
        november: 11,
        december: 12,
        janvier: 1,
        fevrier: 2,
        mars: 3,
        avril: 4,
        mai: 5,
        juin: 6,
        juillet: 7,
        aout: 8,
        septembre: 9,
        octobre: 10,
        novembre: 11,
        decembre: 12,
    };

    public static DateToFileName(isoDate: string, locale: string): string
    {
        const text = `${FormattingHelper.Weekday(isoDate, locale)} ${FormattingHelper.TextLong(isoDate, locale)}`;

        return TextHelper.FileName(text);
    }

    public static FileNameToDate(filename: string): string
    {
        const parts = filename
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .split("-")
            .filter(Boolean);

        const yearIndex = parts.findIndex((part) => /^\d{4}$/.test(part));

        if (yearIndex < 0)
        {
            return "";
        }

        const year = Number(parts[yearIndex]);
        const beforeYear = parts.slice(0, yearIndex);
        
        let monthIndex = -1;

        for (let i = beforeYear.length - 1; i >= 0; i--)
        {
            if (DateHelper.MONTHS[beforeYear[i]!] != null)
            {
                monthIndex = i;
                break;
            }
        }

        if (monthIndex < 0)
        {
            return "";
        }

        const month = DateHelper.MONTHS[beforeYear[monthIndex]!]!;
        const afterMonth = beforeYear[monthIndex + 1];
        const beforeMonth = beforeYear[monthIndex - 1];

        let day = 0;

        if (afterMonth && /^\d{1,2}$/.test(afterMonth))
        {
            day = Number(afterMonth);
        }
        else if (beforeMonth && /^\d{1,2}$/.test(beforeMonth))
        {
            day = Number(beforeMonth);
        }
        else
        {
            return "";
        }

        const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        return FormattingHelper.IsValidIsoDate(iso) ? iso : "";
    }

    public static FileNameToDates(filename: string): { dateStart: string; dateEnd: string }
    {
        const separator = filename.includes("-to-") ? "-to-" : filename.includes("-au-") ? "-au-" : "";

        if (!separator)
        {
            const date = DateHelper.FileNameToDate(filename);

            return { dateStart: date, dateEnd: date };
        }

        const [startPart = "", endPart = ""] = filename.split(separator);

        return {
            dateStart: DateHelper.FileNameToDate(startPart),
            dateEnd: DateHelper.FileNameToDate(endPart),
        };
    }
}
