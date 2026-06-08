import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import Client from "./page-client";
import "./styles.css";
import "./styles-responsive.css";
import { Session } from "@/scripts/types/session";
import { SessionServiceShared } from "@/services/session/shared";
import { ResolveForecastRoute } from "./resolve-route";
import { CookiesHelper } from "@/scripts/helpers/cookies";

export default async function Page()
{
    const headersList = await headers();
    const session: Session = SessionServiceShared.Build(headersList);
    const language = session.language.code;
    const page = session.tracking.page;

    LanguagesHelper.Initialize(language);

    const route = ResolveForecastRoute(page);

    if (!route.valid)
    {
        redirect(LanguagesHelper.Path("Public_Forecast14Days"));
    }

    return <Client session={session} days={route.days} />;
}
