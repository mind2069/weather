"use client";

import { useEffect, useState } from "react";
import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import { Session } from "@/scripts/types/session";
import { FormattingHelper } from "@/scripts/helpers/formatting";
import { TextHelper } from "@/scripts/helpers/text";
import { DateHelper } from "@/scripts/helpers/date";

interface ClientProperties
{
    session: Session;
}

export default function FooterClient({ session }: ClientProperties)
{
    LanguagesHelper.Initialize(session.language.code);

    const language = session.language.code;
    const [todayHref, setTodayHref] = useState(LanguagesHelper.Path("Public_Day"));
    const [tomorrowHref, setTomorrowHref] = useState(LanguagesHelper.Path("Public_Day"));
    const [afterTomorrowHref, setAfterTomorrowHref] = useState(LanguagesHelper.Path("Public_Day"));
    const [daysSevenHref, setDaysSevenHref] = useState(LanguagesHelper.Path("Public_7DayForecast"));
    const [daysFourteenHref, setDaysFourteenHref] = useState(LanguagesHelper.Path("Public_14DayForecast"));
    const [todayDate, setTodayDate] = useState("");
    const [tomorrowDate, setTomorrowDate] = useState("");
    const [afterTomorrowDate, setAfterTomorrowDate] = useState("");
    const [daysSevenDate, setDaysSevenDate] = useState("");
    const [daysFourteenDate, setDaysFourteenDate] = useState("");

    useEffect(() =>
    {
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const afterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
        const daysSeven = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000);
        const daysFourteen = new Date(today.getTime() + 13 * 24 * 60 * 60 * 1000);

        const isoToday = FormattingHelper.IsoDateLocal(today);
        const isoTomorrow = FormattingHelper.IsoDateLocal(tomorrow);
        const isoAfterTomorrow = FormattingHelper.IsoDateLocal(afterTomorrow);
        const isoDaysSeven = FormattingHelper.IsoDateLocal(daysSeven);
        const isoDaysFourteen = FormattingHelper.IsoDateLocal(daysFourteen);

        const textToday = `${FormattingHelper.Weekday(isoToday, language)} ${FormattingHelper.TextLong(isoToday, language)}`;
        const textTomorrow = `${FormattingHelper.Weekday(isoTomorrow, language)} ${FormattingHelper.TextLong(isoTomorrow, language)}`;
        const textAfterTomorrow = `${FormattingHelper.Weekday(isoAfterTomorrow, language)} ${FormattingHelper.TextLong(isoAfterTomorrow, language)}`;
        const textDaysSeven = `${FormattingHelper.Weekday(isoToday, language)} ${FormattingHelper.TextLong(isoToday, language)} ${LanguagesHelper.Caption("To").toLowerCase()} ${FormattingHelper.Weekday(isoDaysSeven, language)} ${FormattingHelper.TextLong(isoDaysSeven, language)}`;
        const textDaysFourteen = `${FormattingHelper.Weekday(isoToday, language)} ${FormattingHelper.TextLong(isoToday, language)} ${LanguagesHelper.Caption("To").toLowerCase()} ${FormattingHelper.Weekday(isoDaysFourteen, language)} ${FormattingHelper.TextLong(isoDaysFourteen, language)}`;

        const urlToday = TextHelper.FileName(textToday);
        const urlTomorrow = TextHelper.FileName(textTomorrow);
        const urlAfterTomorrow = TextHelper.FileName(textAfterTomorrow);
        const urlDaysSeven = DateHelper.DatesToFileName(isoToday, isoDaysSeven, language);
        const urlDaysFourteen = DateHelper.DatesToFileName(isoToday, isoDaysFourteen, language);

        setTodayHref(LanguagesHelper.Path("Public_Day") + "/" + urlToday);
        setTomorrowHref(LanguagesHelper.Path("Public_Day") + "/" + urlTomorrow);
        setAfterTomorrowHref(LanguagesHelper.Path("Public_Day") + "/" + urlAfterTomorrow);
        setDaysSevenHref(LanguagesHelper.Path("Public_7DayForecast") + "/" + urlDaysSeven);
        setDaysFourteenHref(LanguagesHelper.Path("Public_14DayForecast") + "/" + urlDaysFourteen);

        setTodayDate(textToday.replace(",", "").replace(",", "").trim());
        setTomorrowDate(textTomorrow.replace(",", "").replace(",", "").trim());
        setAfterTomorrowDate(textAfterTomorrow.replace(",", "").replace(",", "").trim());
        setDaysSevenDate(textDaysSeven.replace(",", "").replace(",", "").trim());
        setDaysFourteenDate(textDaysFourteen.replace(",", "").replace(",", "").trim());

    }, [language]);

    return (
        <footer>
            <div className="container">
                <nav aria-label={LanguagesHelper.Caption("Weather")}>
                    <a className="link" href={todayHref}>
                        <span className="caption">{LanguagesHelper.Caption("Today")}</span>
                        <span className="date">{todayDate}</span>
                    </a>
                    <span className="separator" aria-hidden>
                        |
                    </span>
                    <a className="link" href={tomorrowHref}>
                        <span className="caption">{LanguagesHelper.Caption("Tomorrow")}</span>
                        <span className="date">{tomorrowDate}</span>
                    </a>
                    <span className="separator" aria-hidden>
                        |
                    </span>
                    <a className="link" href={afterTomorrowHref}>
                        <span className="caption">{LanguagesHelper.Caption("AfterTomorrow")}</span>
                        <span className="date">{afterTomorrowDate}</span>
                    </a>
                    <span className="separator" aria-hidden>
                        |
                    </span>
                    <a className="link" href={daysSevenHref}>
                        <span className="caption">{LanguagesHelper.Caption("7Days")}</span>
                        <span className="date">{daysSevenDate}</span>
                    </a>
                    <span className="separator" aria-hidden>
                        |
                    </span>
                    <a className="link" href={daysFourteenHref}>
                        <span className="caption">{LanguagesHelper.Caption("14Days")}</span>
                        <span className="date">{daysFourteenDate}</span>
                    </a>
                </nav>
            </div>
        </footer>
    );
}
