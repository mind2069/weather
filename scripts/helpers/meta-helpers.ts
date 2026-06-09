import { LanguageId, OpenGraphData, TwitterData, LanguageAlternates, JsonLdData, META_CONSTANTS } from "@/scripts/types/meta";
import { ConfigurationsShared } from "@/scripts/configurations/configurations-shared";
import { LocationHelper } from "@/scripts/helpers/location";
import type { Session } from "@/scripts/types/session";

export interface MetaLocationInput
{
    name: string;
    latitude: number;
    longitude: number;
}

export const MetaOpenGraph = (
    title: string,
    description: string,
    url: string,
    languageId: LanguageId,
): OpenGraphData =>
({
    title,
    description,
    url,
    siteName: ConfigurationsShared.Name,
    images: [],
    locale: languageId === META_CONSTANTS.LANGUAGES.EN ? META_CONSTANTS.LOCALES.EN : META_CONSTANTS.LOCALES.FR,
    type: "website",
});

export const MetaTwitter = (
    title: string,
    description: string,
): TwitterData =>
({
    card: "summary",
    title,
    description,
    images: [],
    ...(META_CONSTANTS.TWITTER_HANDLE ? { site: META_CONSTANTS.TWITTER_HANDLE, creator: META_CONSTANTS.TWITTER_HANDLE } : {}),
});

export const MetaLanguageAlternates = (
    enUrl: string,
    frUrl: string,
): LanguageAlternates =>
({
    "en-CA": enUrl,
    "fr-CA": frUrl,
    "x-default": enUrl,
});

export const MetaGeoTags = (location: MetaLocationInput): Record<string, string> | undefined =>
{
    const tags: Record<string, string> = {};
    const name = location.name.trim();

    if (name)
    {
        tags["geo.placename"] = name;
    }

    const { latitude, longitude } = location;

    if (Number.isFinite(latitude) && Number.isFinite(longitude))
    {
        tags["geo.position"] = `${latitude};${longitude}`;
    }

    return Object.keys(tags).length > 0 ? tags : undefined;
};

export const MetaJsonLdWebPage = (
    name: string,
    description: string,
    url: string,
    inLanguage: "en-CA" | "fr-CA",
): JsonLdData =>
({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url,
    inLanguage,
});

export const IsEnglish = (languageId: LanguageId): boolean => languageId === META_CONSTANTS.LANGUAGES.EN;
export const IsFrench = (languageId: LanguageId): boolean => languageId === META_CONSTANTS.LANGUAGES.FR;

export function MetaLocation(cookies: string, session: Session, resolvedLocationHeader: string | null): MetaLocationInput | undefined
{
    const hasSaved = LocationHelper.CookiesCompleted(cookies);
    const hasResolved = (resolvedLocationHeader ?? "").trim() !== "";

    if (!hasSaved && !hasResolved)
    {
        return undefined;
    }

    const latitude = LocationHelper.LatitudeNormalize(session.user.location.latitude);
    const longitude = LocationHelper.LongitudeNormalize(session.user.location.longitude);

    if (session.user.location.name === "" || latitude === -999999 || longitude === -999999)
    {
        return undefined;
    }

    return {
        name: session.user.location.name,
        latitude: latitude,
        longitude: longitude,
    };
}