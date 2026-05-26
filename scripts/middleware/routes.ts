import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES_PATHS } from "./routes-paths";
import { RouteAuthorized, RouteProtected } from "./authentification";
const LANGUAGES = ["en-ca", "fr-ca"] as const;

function IsAssetRequest(pathname: string): boolean
{
    return (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/images") ||
        pathname.startsWith("/favicon.ico") ||
        pathname.startsWith("/static") ||
        pathname.startsWith("/fonts") ||
        pathname.includes(".")
    );
}

function WithHeaders(response: NextResponse, language: string, pathname: string, page: string, filename: string, ipAddress: string)
{
    response.headers.set("x-language", language);
    response.headers.set("x-ip-address", ipAddress);
    response.headers.set("x-pathname", pathname);
    response.headers.set("x-filename", filename);
    response.headers.set("x-page", page);

    return response;
}

function SetRefererCookie(response: NextResponse, referer: string, language: string)
{
    return response;
}

export async function handleRoutes(request: NextRequest)
{
    const { pathname } = request.nextUrl;
    const headers = request.headers;
    const referer = headers.get('referer') || '';
    const forwarded = headers.get('x-forwarded-for');
    const realIp = headers.get('x-real-ip');
    const ipAddress = forwarded?.split(',')[0]?.trim() || realIp || (headers.get('cf-connecting-ip') ?? '0.0.0.0');

    if (IsAssetRequest(pathname))
    {
        return NextResponse.next();
    }

    if (pathname === "/")
    {
        return NextResponse.redirect(new URL("/en-ca/forecast", request.url));
    }

    const segments = pathname.split("/").filter(Boolean);
    const language = (LANGUAGES as readonly string[]).includes(segments[0]) ? (segments[0] as typeof LANGUAGES[number]) : LANGUAGES[0];
    const page = segments[1] ?? "";
    const filename = segments.pop() ?? "";

    if (RouteProtected(pathname))
    {
        const isAuthenticated = await RouteAuthorized(request);
        
        if (!isAuthenticated)
        {
            const pathHome = language === 'fr-ca' ? '/fr-ca/aujourdhui' : '/en-ca/today';

            return NextResponse.redirect(new URL(pathHome, request.url));
        }
    }

    for (const { pattern, rewrite } of ROUTES_PATHS)
    {
        if (typeof pattern === "string" && pattern === pathname)
        {
            const rewriteUrl = new URL(rewrite, request.url);

            rewriteUrl.search = request.nextUrl.search;

            const response = WithHeaders( NextResponse.rewrite(rewriteUrl), language, pathname, page, filename, ipAddress);

            return SetRefererCookie(response, referer, language);
        }

        if (pattern instanceof RegExp)
        {
            const match = pathname.match(pattern);

            if (match)
            {
                let rewritePath = rewrite;

                for (let i = 1; i < match.length; i++)
                {
                    rewritePath = rewritePath.split(`$${i}`).join(match[i] ?? "");
                }

                const rewriteUrl = new URL(rewritePath, request.url);

                rewriteUrl.search = request.nextUrl.search;

                const response = WithHeaders(NextResponse.rewrite(rewriteUrl), language, pathname, page, filename, ipAddress);

                return SetRefererCookie(response, referer, language);
            }
        }
    }

    if (segments[0] && !(LANGUAGES as readonly string[]).includes(segments[0]))
    {
        return NextResponse.redirect(new URL(`/en-ca${pathname}`, request.url));
    }

    const response = WithHeaders(NextResponse.next(), language, pathname, page, filename, ipAddress);

    return SetRefererCookie(response, referer, language);
}
