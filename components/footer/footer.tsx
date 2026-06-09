import FooterClient from "./footer-client";
import { Cache } from "@/scripts/cache/cache";
import { Session } from "@/scripts/types/session";
import "./styles.css";
import "./styles-responsive.css";

export default async function Footer()
{
    const session: Session = await Cache.Session();

    return <FooterClient session={session} />;
}
