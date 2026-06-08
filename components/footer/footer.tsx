import { headers } from "next/headers";
import FooterClient from "./footer-client";
import { SessionServiceShared } from "@/services/session/shared";
import { Session } from "@/scripts/types/session";
import "./styles.css";
import "./styles-responsive.css";

export default async function Footer()
{
    const headersList = await headers();
    const session: Session = await SessionServiceShared.Build(headersList);

    return <FooterClient session={session} />;
}
