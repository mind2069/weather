import { cache } from "react";
import { headers } from "next/headers";
import { SessionServiceShared } from "@/services/session/shared";
import type { Session } from "@/scripts/types/session";

export const getSession = cache(async (): Promise<Session> =>
{
    const headersList = await headers();

    return SessionServiceShared.Build(headersList);
});