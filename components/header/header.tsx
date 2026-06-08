import { headers } from "next/headers";
import HeaderClient from './header-client';
import { SessionServiceShared } from '@/services/session/shared';
import { Session } from "@/scripts/types/session";
import "./styles.css";
import "./styles-responsive.css";

async function Header()
{
    const headersList = await headers();
    const session: Session = await SessionServiceShared.Build(headersList);

    return ( <HeaderClient session={session}/> );
}

export default Header