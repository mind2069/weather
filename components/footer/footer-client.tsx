"use client";

import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import { Session } from "@/scripts/types/session";

interface ClientProperties
{
    session: Session;
}

export default function FooterClient({ session }: ClientProperties)
{
    LanguagesHelper.Initialize(session.language.code);

    return (
        <footer>
            <div className="container">
                <nav aria-label={LanguagesHelper.Caption("Weather")}>
                    <a className="link" href={LanguagesHelper.Path("Public_Today")}>
                        {LanguagesHelper.Caption("Today")}
                    </a>
                    <span className="separator" aria-hidden>
                        |
                    </span>
                    <a className="link" href={LanguagesHelper.Path("Public_Tomorrow")}>
                        {LanguagesHelper.Caption("Tomorrow")}
                    </a>
                    <span className="separator" aria-hidden>
                        |
                    </span>
                    <a className="link" href={LanguagesHelper.Path("Public_Forecast14Days")}>
                        {LanguagesHelper.Caption("Forecast")}
                    </a>
                </nav>
            </div>
        </footer>
    );
}
