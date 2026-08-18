import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES_PATHS } from "./routes-paths";
import { RouteAuthorized, RouteProtected } from "./authentification";
import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import { SessionServiceShared } from "@/services/session/shared";
import { LocationsData } from "@/scripts/data/locations";
import { FormattingHelper } from "@/scripts/helpers/formatting";
import { DateHelper } from "@/scripts/helpers/date";

const LANGUAGES = ["en-ca", "fr-ca"] as const;

const PAGES_WITH_FILENAME = new Set(
[
    "day",
    "journee",
    "today",
    "aujourdhui",
    "tomorrow",
    "demain",
    "after-tomorrow",
    "apres-demain",
    "forecast",
    "prevision",
    "7-days",
    "7-jours",
    "14-days",
    "14-jours",
]);


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

function SetRefererCookie(response: NextResponse, referer: string, language: string)
{
    return response;
}

function TrackingFromRequest(request: NextRequest, language: string, ipAddress: string, hostname: string, pathname: string, section: string, page: string, filename: string)
{
    const headers = request.headers;

    let city = headers.get("x-vercel-ip-city") ?? "";
    let country = headers.get("x-vercel-ip-country") ?? "";
    let province = headers.get("x-vercel-ip-country-region") ?? "";
    let latitude = headers.get("x-vercel-ip-latitude") ?? "-999999";
    let longitude = headers.get("x-vercel-ip-longitude") ?? "-999999";

    const data = 
    {
        language: language,
        ipAddress: ipAddress,
        hostname: hostname,
        pathname: pathname,
        section: section,
        page: page,
        filename: filename,
        city: city,
        country: country,
        province: province,
        latitude: latitude,
        longitude: longitude,
    };

    return data;
}

async function CreateSessionResponse(request: NextRequest, rewriteUrl: URL | null, language: string, ipAddress: string, hostname: string, pathname: string, section: string, page: string, filename: string, status?: number): Promise<NextResponse>
{
    const tracking = TrackingFromRequest(request, language, ipAddress, hostname, pathname, section, page, filename);

    return SessionServiceShared.CreateResponse(
        request.headers,
        rewriteUrl,
        request.headers.get("cookie") ?? "",
        tracking,
        status,
    );
}

export async function handleRoutes(request: NextRequest)
{
    const { pathname } = request.nextUrl;
    const headers = request.headers;
    const referer = headers.get('referer') || '';
    const forwarded = headers.get('x-forwarded-for');
    const realIp = headers.get('x-real-ip');
    const hostname = request.nextUrl.hostname.toLowerCase();
    const ipAddress = forwarded?.split(',')[0]?.trim() || realIp || (headers.get('cf-connecting-ip') ?? '0.0.0.0');

    if (IsAssetRequest(pathname))
    {
        return NextResponse.next();
    }

    if (pathname === "/")
    {
        LanguagesHelper.Initialize("en-ca");

        const languageId = LanguagesHelper.LanguageId();
        const isoToday = FormattingHelper.IsoDateLocal(new Date());
        const slug = DateHelper.DateToFileName(isoToday, "en-ca");
        const path = LanguagesHelper.PathLanguage("Public_Day", languageId) + "/" + slug;

        return NextResponse.redirect(new URL(path, request.url));
    }

    const segments = pathname.split("/").filter(Boolean);
    const language = (LANGUAGES as readonly string[]).includes(segments[0]) ? (segments[0] as typeof LANGUAGES[number]) : LANGUAGES[0];

    let section = "";
    let page = "";
    let filename = "";

    if (segments.length === 2)
    {
        section = language == "en-ca" ? "public" : "publique";
        page = segments[1] ?? "";
        filename = "";
    }
    else if (segments.length === 3 && PAGES_WITH_FILENAME.has(segments[1] ?? ""))
    {
        section = language == "en-ca" ? "public" : "publique";
        page = segments[1] ?? "";
        filename = segments[2] ?? "";
    }
    else if (segments.length === 3)
    {
        section = segments[1] ?? "";
        page = segments[1] ?? "";
        filename = "";
    }

    if (section === page)
    {
        section = language == "en-ca" ? "public" : "publique";
    }

    if (RouteProtected(pathname))
    {
        const isAuthenticated = await RouteAuthorized(request);

        if (!isAuthenticated)
        {
            LanguagesHelper.Initialize(language);

            const languageId = LanguagesHelper.LanguageId();
            const path = LanguagesHelper.PathLanguage("Public_Today", languageId);

            return NextResponse.redirect(new URL(path, request.url));
        }
    }

    for (const { pattern, rewrite } of ROUTES_PATHS)
    {
        if (typeof pattern === "string" && pattern === pathname)
        {
            const rewriteUrl = new URL(rewrite, request.url);

            rewriteUrl.search = request.nextUrl.search;

            const response = await CreateSessionResponse(request, rewriteUrl, language, ipAddress, hostname, pathname, section, page, filename);

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

                const response = await CreateSessionResponse(request, rewriteUrl, language, ipAddress, hostname, pathname, section, page, filename);

                return SetRefererCookie(response, referer, language);
            }
        }
    }

    if (segments[0] && !(LANGUAGES as readonly string[]).includes(segments[0]))
    {
        return NextResponse.redirect(new URL(`/en-ca${pathname}`, request.url));
    }

    const rewriteUrlNotFound = new URL("/forms/public/not-found", request.url);

    const response = await CreateSessionResponse(request, rewriteUrlNotFound, language, ipAddress, hostname, pathname, section, page, filename, 404);

    return SetRefererCookie(response, referer, language);
}
