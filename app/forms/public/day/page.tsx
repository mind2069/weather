import { redirect } from "next/navigation";
import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import Client from "./page-client";
import "./styles.css";
import "./styles-responsive.css";
import { Session } from "@/scripts/types/session";
import { Cache } from "@/scripts/cache/cache";
import { ResolveDayRoute } from "./resolve-route";
import { OpenMeteoDay } from "@/scripts/types/open-meteo";
import { OpenMeteoDayParameters, OpenMeteoDayResponse } from "@/services/open-meteo/types";
import { OpenMeteoServiceServer } from "@/services/open-meteo/server";
import { EffectiveDayDate } from "./resolve-route";

export default async function Page()
{
    const session: Session = await Cache.Session();
    const language = session.language.code;
    const page = session.tracking.page;
    const filename = session.tracking.filename;

    let dayData: OpenMeteoDay | null = null;

    LanguagesHelper.Initialize(language);

    const route = ResolveDayRoute(page, filename);

    if (!route.valid)
    {
        redirect(LanguagesHelper.Path("Public_Day"));
    }
    else
    {
        const effectiveDate = EffectiveDayDate(route.kind, route.date);

        const parametersDay: OpenMeteoDayParameters =
        {
            session: session,
            date: effectiveDate,
            cached: true,
        };

        const responseDay: OpenMeteoDayResponse = await OpenMeteoServiceServer.Day(parametersDay);

        if (responseDay.success && responseDay.data)
        {
            dayData = responseDay.data;
        }
    }

    return <Client session={session} date={route.date} kind={route.kind} dayData={dayData} />;
}
