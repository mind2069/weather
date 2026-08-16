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

export default function Client({ session }: ClientProperties)
{
    LanguagesHelper.Initialize(session.language.code);

    const language = session.language.code;
    const [todayHref, setTodayHref] = useState(LanguagesHelper.Path("Public_Day"));

    useEffect(() =>
    {
        const today = new Date();
        const isoToday = FormattingHelper.IsoDateLocal(today);
        const textToday = `${FormattingHelper.Weekday(isoToday, language)} ${FormattingHelper.TextLong(isoToday, language)}`;
        const urlToday = TextHelper.FileName(textToday);

        setTodayHref(LanguagesHelper.Path("Public_Day") + "/" + urlToday);

    }, [language]);

    return (
        <div className="not-found">
            <section className="details">
                <div className="container">
                    <div className="content">
                        <div className="code">404</div>
                        <h1 className="title">
                            {LanguagesHelper.Caption("PageNotFound")}
                        </h1>
                        <p className="message">
                            {LanguagesHelper.Caption("PageNotFoundMessage")}
                        </p>
                        <div className="actions">
                            <a className="btn" href={todayHref}>
                                {LanguagesHelper.Caption("BackToWeather")}
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
