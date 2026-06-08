import FooterClient from "./footer-client";
import { getSession } from "@/services/session/get-session";
import { Session } from "@/scripts/types/session";
import "./styles.css";
import "./styles-responsive.css";

export default async function Footer()
{
    const session: Session = await getSession();

    return <FooterClient session={session} />;
}
