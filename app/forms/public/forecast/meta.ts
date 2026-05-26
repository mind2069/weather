import type { Metadata } from "next";
import { MetaData, LanguageId, META_CONSTANTS, JsonLdData } from "@/scripts/types/meta";
import { MetaOpenGraph, MetaTwitter, MetaLanguageAlternates, MetaGeoTags, MetaJsonLdWebPage, type MetaLocationInput, IsEnglish } from "@/scripts/helpers/meta-helpers";
import { FORECAST_DEFAULT_DAYS, type ForecastRoute } from "./resolve-route";

export interface ForecastMetaContext
{
    days: number;
    baseUrl: string;
}

function forecastPath(languageId: LanguageId, days: number): string
{
    const base = IsEnglish(languageId) ? "/en-ca/forecast" : "/fr-ca/prevision";

    if (days === FORECAST_DEFAULT_DAYS)
    {
        return base;
    }

    return `${base}/${days}`;
}

function titleFor(context: ForecastMetaContext, languageId: LanguageId): string
{
    const site = META_CONSTANTS.SITE_NAME;
    const days = context.days;

    if (IsEnglish(languageId))
    {
        return `${days}-Day Weather Forecast | ${site}`;
    }

    return `Prévisions météo sur ${days} jours | ${site}`;
}

function descriptionFor(context: ForecastMetaContext, languageId: LanguageId): string
{
    const days = context.days;

    if (IsEnglish(languageId))
    {
        return `${days}-day weather outlook: daily highs and lows, conditions, rain chance, wind, humidity, sunrise and sunset. Tap a day for the hour-by-hour view.`;
    }

    return `Prévisions météo sur ${days} jours : maxima et minima, conditions, probabilité de pluie, vent, humidité, lever et coucher du soleil. Touchez un jour pour la vue heure par heure.`;
}

function keywordsFor(languageId: LanguageId): string
{
    return IsEnglish(languageId)
        ? "weather forecast, 14 day forecast, daily forecast, extended forecast, temperature, precipitation, wind, humidity"
        : "prévisions météo, prévisions 14 jours, prévisions quotidiennes, température, précipitations, vent, humidité";
}

export const Meta: MetaData =
{
    Title(languageId, context?: unknown): string
    {
        return titleFor(context as ForecastMetaContext, languageId);
    },

    Description(languageId, context?: unknown): string
    {
        return descriptionFor(context as ForecastMetaContext, languageId);
    },

    OpenGraph(languageId, context?: unknown)
    {
        const ctx = context as ForecastMetaContext;
        const title = this.Title(languageId, ctx);
        const description = this.Description(languageId, ctx);
        const url = this.Canonical(languageId, ctx);

        return MetaOpenGraph(title, description, url, languageId);
    },

    Twitter(languageId, context?: unknown)
    {
        const ctx = context as ForecastMetaContext;

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
        const ctx = context as ForecastMetaContext;

        return `${ctx.baseUrl}${forecastPath(languageId, ctx.days)}`;
    },

    LanguageAlternates(context?: unknown)
    {
        const ctx = context as ForecastMetaContext;

        return MetaLanguageAlternates(
            `${ctx.baseUrl}${forecastPath(META_CONSTANTS.LANGUAGES.EN, ctx.days)}`,
            `${ctx.baseUrl}${forecastPath(META_CONSTANTS.LANGUAGES.FR, ctx.days)}`,
        );
    },

    JsonLd(languageId: LanguageId, context?: unknown): JsonLdData
    {
        const ctx = context as ForecastMetaContext;
        const title = this.Title(languageId, ctx);
        const description = this.Description(languageId, ctx);
        const url = this.Canonical(languageId, ctx);
        const inLanguage = IsEnglish(languageId) ? "en-CA" : "fr-CA";

        return MetaJsonLdWebPage(title, description, url, inLanguage);
    },
};

export function ForecastMetaContextFromRoute(route: ForecastRoute, baseUrl: string): ForecastMetaContext
{
    return { days: route.days, baseUrl };
}

export function ToNextMetadata(
    languageId: LanguageId,
    context: ForecastMetaContext,
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
