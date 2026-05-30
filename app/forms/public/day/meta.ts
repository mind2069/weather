import type { Metadata } from "next";
import { MetaData, LanguageId, META_CONSTANTS, JsonLdData } from "@/scripts/types/meta";
import { FormattingHelper } from "@/scripts/helpers/formatting";
import { MetaOpenGraph, MetaTwitter, MetaLanguageAlternates, MetaGeoTags, MetaJsonLdWebPage, type MetaLocationInput, IsEnglish } from "@/scripts/helpers/meta-helpers";
import type { DayRoute, DayRouteKind } from "./resolve-route";

export interface DayMetaContext
{
    date: string;
    kind: DayRouteKind;
    baseUrl: string;
}

function localeCode(languageId: LanguageId): string
{
    return IsEnglish(languageId) ? "en-ca" : "fr-ca";
}

function dayPath(languageId: LanguageId, kind: DayRouteKind, date: string): string
{
    if (IsEnglish(languageId))
    {
        switch (kind)
        {
            case "today": return "/en-ca/today";
            case "tomorrow": return "/en-ca/tomorrow";
            case "after-tomorrow": return "/en-ca/after-tomorrow";
            case "date": return `/en-ca/day/${date}`;
        }
    }

    switch (kind)
    {
        case "today": return "/fr-ca/aujourdhui";
        case "tomorrow": return "/fr-ca/demain";
        case "after-tomorrow": return "/fr-ca/apres-demain";
        case "date": return `/fr-ca/journee/${date}`;
    }

    return "";
}

function titleFor(context: DayMetaContext, languageId: LanguageId): string
{
    const site = META_CONSTANTS.SITE_NAME;
    const locale = localeCode(languageId);
    const dateLabel = FormattingHelper.DateFull(context.date, locale);

    return `${dateLabel} | ${site}`;
}

function descriptionFor(context: DayMetaContext, languageId: LanguageId): string
{
    const locale = localeCode(languageId);

    if (context.kind === "today")
    {
        return IsEnglish(languageId)
            ? "Hour-by-hour weather for today: temperature, feels-like, precipitation, wind, UV index, sunrise and sunset."
            : "Météo heure par heure pour aujourd'hui : température, ressenti, précipitations, vent, indice UV, lever et coucher du soleil.";
    }

    if (context.kind === "tomorrow")
    {
        return IsEnglish(languageId)
            ? "Hour-by-hour weather for tomorrow: temperature, feels-like, precipitation, wind, UV index, sunrise and sunset."
            : "Météo heure par heure pour demain : température, ressenti, précipitations, vent, indice UV, lever et coucher du soleil.";
    }

    if (context.kind === "after-tomorrow")
    {
        return IsEnglish(languageId)
            ? "Hour-by-hour weather for after tomorrow: temperature, feels-like, precipitation, wind, UV index, sunrise and sunset."
            : "Météo heure par heure pour après demain : température, ressenti, précipitations, vent, indice UV, lever et coucher du soleil.";
    }

    const dateLabel = FormattingHelper.TextLong(context.date, locale);

    return IsEnglish(languageId)
        ? `Detailed weather for ${dateLabel}. Hourly forecast with highs, lows, and current conditions.`
        : `Météo détaillée pour le ${dateLabel}. Prévisions horaires, maxima, minima et conditions.`;
}

function keywordsFor(languageId: LanguageId): string
{
    return IsEnglish(languageId)
        ? "weather, hourly forecast, temperature, precipitation, wind, UV index, sunrise, sunset"
        : "météo, prévisions horaires, température, précipitations, vent, indice UV, lever du soleil, coucher du soleil";
}

export const Meta: MetaData =
{
    Title(languageId, context?: unknown): string
    {
        return titleFor(context as DayMetaContext, languageId);
    },

    Description(languageId, context?: unknown): string
    {
        return descriptionFor(context as DayMetaContext, languageId);
    },

    OpenGraph(languageId, context?: unknown)
    {
        const ctx = context as DayMetaContext;
        const title = this.Title(languageId, ctx);
        const description = this.Description(languageId, ctx);
        const url = this.Canonical(languageId, ctx);

        return MetaOpenGraph(title, description, url, languageId);
    },

    Twitter(languageId, context?: unknown)
    {
        const ctx = context as DayMetaContext;

        return MetaTwitter(this.Title(languageId, ctx), this.Description(languageId, ctx));
    },

    Keywords: keywordsFor,

    Category(languageId: LanguageId): string
    {
        return IsEnglish(languageId) ? "Weather" : "Météo";
    },

    Classification(languageId: LanguageId): string
    {
        return IsEnglish(languageId) ? "Weather Forecast" : "Prévisions météo";
    },

    Canonical(languageId: LanguageId, context?: unknown): string
    {
        const ctx = context as DayMetaContext;

        return `${ctx.baseUrl}${dayPath(languageId, ctx.kind, ctx.date)}`;
    },

    LanguageAlternates(context?: unknown)
    {
        const ctx = context as DayMetaContext;

        return MetaLanguageAlternates(
            `${ctx.baseUrl}${dayPath(META_CONSTANTS.LANGUAGES.EN, ctx.kind, ctx.date)}`,
            `${ctx.baseUrl}${dayPath(META_CONSTANTS.LANGUAGES.FR, ctx.kind, ctx.date)}`,
        );
    },

    JsonLd(languageId: LanguageId, context?: unknown): JsonLdData
    {
        const ctx = context as DayMetaContext;
        const title = this.Title(languageId, ctx);
        const description = this.Description(languageId, ctx);
        const url = this.Canonical(languageId, ctx);
        const inLanguage = IsEnglish(languageId) ? "en-CA" : "fr-CA";

        return MetaJsonLdWebPage(title, description, url, inLanguage);
    },
};

export function DayMetaContextFromRoute(route: DayRoute, baseUrl: string): DayMetaContext
{
    return { date: route.date, kind: route.kind, baseUrl };
}

export function ToNextMetadata(
    languageId: LanguageId,
    context: DayMetaContext,
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
