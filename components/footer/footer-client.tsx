"use client";

import { useEffect, useState } from "react";
import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import { Session } from "@/scripts/types/session";
import { FormattingHelper } from "@/scripts/helpers/formatting";
import { TextHelper } from "@/scripts/helpers/text";

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
    const [daysSevenHref, setDaysSevenHref] = useState(LanguagesHelper.Path("Public_Forecast7Days"));
    const [daysFourteenHref, setDaysFourteenHref] = useState(LanguagesHelper.Path("Public_Forecast14Days"));

    useEffect(() =>
    {
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const afterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
        const daysSeven = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const daysFourteen = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

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
        const urlDaysSeven = TextHelper.FileName(textDaysSeven);
        const urlDaysFourteen = TextHelper.FileName(textDaysFourteen);

        setTodayHref(LanguagesHelper.Path("Public_Day") + "/" + urlToday);
        setTomorrowHref(LanguagesHelper.Path("Public_Day") + "/" + urlTomorrow);
        setAfterTomorrowHref(LanguagesHelper.Path("Public_Day") + "/" + urlAfterTomorrow);
        setDaysSevenHref(LanguagesHelper.Path("Public_Forecast7Days") + "/" + urlDaysSeven);
        setDaysFourteenHref(LanguagesHelper.Path("Public_Forecast14Days") + "/" + urlDaysFourteen);

    }, [language]);

    return (
        <footer>
            <div className="container">
                <nav aria-label={LanguagesHelper.Caption("Weather")}>
                    <a className="link" href={todayHref}>
                        {LanguagesHelper.Caption("Today")}
                    </a>
                    <span className="separator" aria-hidden>
                        |
                    </span>
                    <a className="link" href={tomorrowHref}>
                        {LanguagesHelper.Caption("Tomorrow")}
                    </a>
                    <span className="separator" aria-hidden>
                        |
                    </span>
                    <a className="link" href={afterTomorrowHref}>
                        {LanguagesHelper.Caption("AfterTomorrow")}
                    </a>
                    <span className="separator" aria-hidden>
                        |
                    </span>
                    <a className="link" href={daysSevenHref}>
                        {LanguagesHelper.Caption("7Days")}
                    </a>
                    <span className="separator" aria-hidden>
                        |
                    </span>
                    <a className="link" href={daysFourteenHref}>
                        {LanguagesHelper.Caption("14Days")}
                    </a>
                </nav>
            </div>
        </footer>
    );
}
