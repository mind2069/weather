import { headers } from "next/headers";
import Client from "./page-client";
import "./styles.css";
import "./styles-responsive.css";
import { Session } from "@/scripts/types/session";
import { SessionServiceShared } from "@/services/session/shared";
import { TextHelper } from "@/scripts/helpers/text";

export default async function Page()
{
    const headersList = await headers();
    const session: Session = SessionServiceShared.Build(headersList);
    const pathname = session.tracking.pathname;
    const segments = pathname.split("/").filter(Boolean);

    let days = 14;

    if (segments.length === 3)
    {
        const daysPath = TextHelper.Numeric(segments[2]);
        
        if (daysPath.length > 0)
        {
            days = parseInt(daysPath);
        }
    }

    return ( <Client session={session} days={days}/> )
}
