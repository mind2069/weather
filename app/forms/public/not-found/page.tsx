import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import Client from "./page-client";
import "./styles.css";
import "./styles-responsive.css";
import { Session } from "@/scripts/types/session";
import { Cache } from "@/scripts/cache/cache";

export default async function Page()
{
    const session: Session = await Cache.Session();
    const language = session.language.code;

    LanguagesHelper.Initialize(language);

    return <Client session={session} />;
}
