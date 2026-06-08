import { headers } from "next/headers";
import type { Metadata } from "next";
import LayoutPublic from "@/layouts/public/public";
import { LANGUAGES_ID } from "@/scripts/languages/languages-id";
import { type LanguageId } from "@/scripts/types/meta";
import { getMetaLocation } from "@/scripts/helpers/meta-helpers";
import { getSession } from "@/services/session/get-session";
import { ForecastMetaContextFromRoute, Meta, ToNextMetadata } from "./meta";
import { ResolveForecastRoute } from "./resolve-route";
import { ConfigurationsShared } from "@/scripts/configurations/configurations-shared";

export async function generateMetadata(): Promise<Metadata>
{
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "";
    const languageCode = headersList.get("x-language") ?? "en-ca";
    const languageId = (LANGUAGES_ID[languageCode] ?? "1") as LanguageId;
    const route = ResolveForecastRoute(pathname);
    const baseUrl = ConfigurationsShared.Website.Base;
    const context = ForecastMetaContextFromRoute(route, baseUrl);
    const cookies = headersList.get("cookie") ?? "";
    const session = await getSession();
    const location = getMetaLocation(cookies, session, headersList.get("s-location"));

    return ToNextMetadata(languageId, context, location);
}

export default async function LayoutBase({ children }: { children: React.ReactNode })
{
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "";
    const languageCode = headersList.get("x-language") ?? "en-ca";
    const languageId = (LANGUAGES_ID[languageCode] ?? "1") as LanguageId;
    const route = ResolveForecastRoute(pathname);
    const baseUrl = ConfigurationsShared.Website.Base;
    const context = ForecastMetaContextFromRoute(route, baseUrl);
    const jsonLd = JSON.stringify(Meta.JsonLd(languageId, context));

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLd }}
            />
            <LayoutPublic>{children}</LayoutPublic>
        </>
    );
}
