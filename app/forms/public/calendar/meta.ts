import type { Metadata } from "next";
import { MetaData, LanguageId, META_CONSTANTS, JsonLdData } from "@/scripts/types/meta";
import { MetaOpenGraph, MetaTwitter, MetaLanguageAlternates, MetaGeoTags, MetaJsonLdWebPage, type MetaLocationInput, IsEnglish } from "@/scripts/helpers/meta-helpers";
import { ConfigurationsShared } from "@/scripts/configurations/configurations-shared";

export interface CalendarMetaContext
{
    baseUrl: string;
}

function calendarPath(languageId: LanguageId): string
{
    return IsEnglish(languageId) ? "/en-ca/calendar" : "/fr-ca/calendrier";
}

function titleFor(languageId: LanguageId): string
{
    const site = ConfigurationsShared.Name;

    return IsEnglish(languageId)
        ? `Weather Calendar | ${site}`
        : `Calendrier météo | ${site}`;
}

function descriptionFor(languageId: LanguageId): string
{
    return IsEnglish(languageId)
        ? "Two-week weather calendar: daily highs and conditions at a glance. Tap a day for the hour-by-hour forecast."
        : "Calendrier météo sur deux semaines : maxima et conditions en un coup d'œil. Touchez un jour pour la vue heure par heure.";
}

function keywordsFor(languageId: LanguageId): string
{
    return IsEnglish(languageId)
        ? "weather calendar, daily forecast, temperature, conditions"
        : "calendrier météo, prévisions quotidiennes, température, conditions";
}

export const Meta: MetaData =
{
    Title(languageId): string
    {
        return titleFor(languageId);
    },

    Description(languageId): string
    {
        return descriptionFor(languageId);
    },

    OpenGraph(languageId, context?: unknown)
    {
        const ctx = context as CalendarMetaContext;
        const title = this.Title(languageId, ctx);
        const description = this.Description(languageId, ctx);
        const url = this.Canonical(languageId, ctx);

        return MetaOpenGraph(title, description, url, languageId);
    },

    Twitter(languageId, context?: unknown)
    {
        const ctx = context as CalendarMetaContext;

        return MetaTwitter(this.Title(languageId, ctx), this.Description(languageId, ctx));
    },

    Keywords: keywordsFor,

    Category(languageId: LanguageId): string
    {
        return IsEnglish(languageId) ? "Weather" : "Météo";
    },

    Classification(languageId: LanguageId): string
    {
        return IsEnglish(languageId) ? "Weather Calendar" : "Calendrier météo";
    },

    Canonical(languageId: LanguageId, context?: unknown): string
    {
        const ctx = context as CalendarMetaContext;

        return `${ctx.baseUrl}${calendarPath(languageId)}`;
    },

    LanguageAlternates(context?: unknown)
    {
        const ctx = context as CalendarMetaContext;

        return MetaLanguageAlternates(
            `${ctx.baseUrl}${calendarPath(META_CONSTANTS.LANGUAGES.EN)}`,
            `${ctx.baseUrl}${calendarPath(META_CONSTANTS.LANGUAGES.FR)}`,
        );
    },

    JsonLd(languageId: LanguageId, context?: unknown): JsonLdData
    {
        const ctx = context as CalendarMetaContext;
        const title = this.Title(languageId, ctx);
        const description = this.Description(languageId, ctx);
        const url = this.Canonical(languageId, ctx);
        const inLanguage = IsEnglish(languageId) ? "en-CA" : "fr-CA";

        return MetaJsonLdWebPage(title, description, url, inLanguage);
    },
};

export function CalendarMetaContextFromSession(baseUrl: string): CalendarMetaContext
{
    return { baseUrl };
}

export function ToNextMetadata(
    languageId: LanguageId,
    context: CalendarMetaContext,
    location?: MetaLocationInput,
): Metadata
{
    const title = Meta.Title(languageId, context);
    const description = Meta.Description(languageId, context);
    const openGraph = Meta.OpenGraph(languageId, context);
    const twitter = Meta.Twitter(languageId, context);
    const alternates = Meta.LanguageAlternates(context);
    const geoTags = location ? MetaGeoTags(location) : undefined;

    return {
        title,
        description,
        keywords: Meta.Keywords(languageId),
        category: Meta.Category(languageId),
        classification: Meta.Classification(languageId),
        alternates: {
            canonical: Meta.Canonical(languageId, context),
            languages: {
                "en-CA": alternates["en-CA"],
                "fr-CA": alternates["fr-CA"],
                "x-default": alternates["x-default"],
            },
        },
        openGraph: {
            title: openGraph.title,
            description: openGraph.description,
            url: openGraph.url,
            siteName: openGraph.siteName,
            locale: openGraph.locale,
            type: openGraph.type,
        },
        twitter: {
            card: twitter.card,
            title: twitter.title,
            description: twitter.description,
        },
        ...(geoTags ? { other: geoTags } : {}),
        robots: { index: true, follow: true },
        metadataBase: new URL(context.baseUrl),
    };
}
