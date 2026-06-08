import { redirect } from "next/navigation";
import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import Client from "./page-client";
import "./styles.css";
import "./styles-responsive.css";
import { Session } from "@/scripts/types/session";
import { getSession } from "@/services/session/get-session";
import { ResolveDayRoute } from "./resolve-route";

export default async function Page()
{
    const session: Session = await getSession();
    const language = session.language.code;
    const page = session.tracking.page;
    const filename = session.tracking.filename;

    LanguagesHelper.Initialize(language);

    const route = ResolveDayRoute(page, filename);

    if (!route.valid)
    {
        redirect(LanguagesHelper.Path("Public_Day"));
    }

    return <Client session={session} date={route.date} kind={route.kind} />;
}
