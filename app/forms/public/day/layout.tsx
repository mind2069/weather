import { headers } from "next/headers";
import type { Metadata } from "next";
import LayoutPublic from "@/layouts/public/public";
import { LANGUAGES_ID } from "@/scripts/languages/languages-id";
import { type LanguageId } from "@/scripts/types/meta";
import { hasSavedLocationFromCookies } from "@/scripts/helpers/meta-helpers";
import { SessionServiceShared } from "@/services/session/shared";
import { DayMetaContextFromRoute, Meta, ToNextMetadata } from "./meta";
import { ResolveDayRoute } from "./resolve-route";
import { ConfigurationsShared } from "@/scripts/configurations/configurations-shared";

export async function generateMetadata(): Promise<Metadata>
{
    const headersList = await headers();
    const session = await SessionServiceShared.Build(headersList);
    const languageCode = session.language.code;
    const languageId = (LANGUAGES_ID[languageCode] ?? "1") as LanguageId;
    const page = session.tracking.page;
    const filename = session.tracking.filename;
    const route = ResolveDayRoute(page, filename);
    const baseUrl = ConfigurationsShared.Website.Base;
    const context = DayMetaContextFromRoute(route, baseUrl);
    const cookies = headersList.get("cookie") ?? "";
    const location = hasSavedLocationFromCookies(cookies) ? session.user.location : undefined;

    return ToNextMetadata(languageId, context, location);
}

export default async function LayoutBase({ children }: { children: React.ReactNode })
{
    const headersList = await headers();
    const session = await SessionServiceShared.Build(headersList);
    const languageCode = session.language.code;
    const languageId = (LANGUAGES_ID[languageCode] ?? "1") as LanguageId;
    const page = session.tracking.page;
    const filename = session.tracking.filename;
    const route = ResolveDayRoute(page, filename);
    const baseUrl = ConfigurationsShared.Website.Base;
    const context = DayMetaContextFromRoute(route, baseUrl);
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
