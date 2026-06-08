import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import Client from "./page-client";
import "./styles.css";
import "./styles-responsive.css";
import { Session } from "@/scripts/types/session";
import { SessionServiceShared } from "@/services/session/shared";
import { ResolveDayRoute } from "./resolve-route";
import { CookiesHelper } from "@/scripts/helpers/cookies";

export default async function Page()
{
    const headersList = await headers();
    const maxAge = 365 * 24 * 60 * 60;
    const session: Session = SessionServiceShared.Build(headersList);
    const language = session.language.code;
    const page = session.tracking.page;
    const filename = session.tracking.filename;

    LanguagesHelper.Initialize(language);

    const route = ResolveDayRoute(page, filename);

    if (!route.valid)
    {
        //redirect(LanguagesHelper.Path("Public_Day"));
    }

    return <Client session={session} date={route.date} kind={route.kind} />;
}
