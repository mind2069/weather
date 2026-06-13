import { redirect } from "next/navigation";
import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import Client from "./page-client";
import "./styles.css";
import "./styles-responsive.css";
import { Session } from "@/scripts/types/session";
import { Cache } from "@/scripts/cache/cache";
import { ResolveDayRoute } from "./resolve-route";
import { OpenMeteoDay } from "@/scripts/types/open-meteo";

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

    return <Client session={session} date={route.date} kind={route.kind} dayData={dayData} />;
}
