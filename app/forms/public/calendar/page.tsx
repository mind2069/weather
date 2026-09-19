import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import Client from "./page-client";
import "./styles.css";
import "./styles-responsive.css";
import { Session } from "@/scripts/types/session";
import { Cache } from "@/scripts/cache/cache";
import { FormattingHelper } from "@/scripts/helpers/formatting";

/** Open-Meteo ensemble mean supports up to 35 days; standard forecast max is 16. */
const FORECAST_MAX_DAYS = 35;

export default async function Page()
{
    const session: Session = await Cache.Session();
    const language = session.language.code;

    LanguagesHelper.Initialize(language);

    const today = new Date();
    const forecastEnd = new Date(today);

    forecastEnd.setDate(today.getDate() + (FORECAST_MAX_DAYS - 1));

    return (
        <Client
            session={session}
            forecastStart={FormattingHelper.IsoDateLocal(today)}
            forecastEnd={FormattingHelper.IsoDateLocal(forecastEnd)}
        />
    );
}
