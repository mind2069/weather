import HeaderClient from './header-client';
import { getSession } from "@/services/session/get-session";
import { Session } from "@/scripts/types/session";
import "./styles.css";
import "./styles-responsive.css";

async function Header()
{
    const session: Session = await getSession();

    return ( <HeaderClient session={session}/> );
}

export default Header