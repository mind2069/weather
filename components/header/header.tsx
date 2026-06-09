import HeaderClient from './header-client';
import { Cache } from "@/scripts/cache/cache";
import { Session } from "@/scripts/types/session";
import "./styles.css";
import "./styles-responsive.css";

async function Header()
{
    const session: Session = await Cache.Session();

    return ( <HeaderClient session={session}/> );
}

export default Header