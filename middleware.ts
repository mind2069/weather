import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handleRoutes } from "@/scripts/middleware/routes";

export async function middleware(request: NextRequest)
{
    try
    {
        return await handleRoutes(request);
    }
    catch
    {
        return NextResponse.next();
    }
}

export const config =
{
    matcher: ["/((?!_next|api|favicon.ico).*)"]
};