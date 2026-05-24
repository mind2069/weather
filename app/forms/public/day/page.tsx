import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import { FormattingHelper } from "@/scripts/helpers/formatting";
import Client from "./page-client";
import "./styles.css";
import "./styles-responsive.css";
import { Session } from "@/scripts/types/session";
import { SessionServiceShared } from "@/services/session/shared";

export default async function Page()
{
    const headersList = await headers();
    const session: Session = SessionServiceShared.Build(headersList);
    const language = session.language.code;
    const pathname = session.tracking.pathname;
    const segments = pathname.split("/").filter(Boolean);

    let valid = false;

    LanguagesHelper.Initialize(language);

    let date = FormattingHelper.IsoDateLocal(new Date());

    if (segments.length === 2)
    {
        const filename = segments[1];

        switch (filename)
        {
            case "day": 
            case "journee":
            case "today":
            case "aujourdhui":

                date = FormattingHelper.IsoDateLocal(new Date());

                valid = true;

                break;

            case "tomorrow":
            case "demain":

                date = FormattingHelper.IsoDateLocal(new Date(Date.now() + 24 * 60 * 60 * 1000));

                valid = true;

                break;
        }
    }
    else if (segments.length === 3)
    {
        let valid = false;

        date = segments[2];

        valid = FormattingHelper.IsValidIsoDate(date);
    }

    if (!valid)
    {
        const path = LanguagesHelper.Path("Public_Day");

        redirect(path);
    }

    return ( <Client session={session} date={date} /> )
}
