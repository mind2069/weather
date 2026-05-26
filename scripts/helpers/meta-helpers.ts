import
{
    LanguageId,
    OpenGraphData,
    TwitterData,
    LanguageAlternates,
    JsonLdData,
    META_CONSTANTS,
} from "@/scripts/types/meta";
import { CookiesHelper } from "@/scripts/helpers/cookies";

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
    siteName: META_CONSTANTS.SITE_NAME,
    images: [],
    locale: languageId === META_CONSTANTS.LANGUAGES.EN
        ? META_CONSTANTS.LOCALES.EN
        : META_CONSTANTS.LOCALES.FR,
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
    ...(META_CONSTANTS.TWITTER_HANDLE
        ? { site: META_CONSTANTS.TWITTER_HANDLE, creator: META_CONSTANTS.TWITTER_HANDLE }
        : {}),
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

export function hasSavedLocationFromCookies(cookies: string): boolean
{
    const name = CookiesHelper.Get(cookies, "location")?.trim();

    if (name)
    {
        return true;
    }

    const latitude = CookiesHelper.Get(cookies, "latitude")?.trim();
    const longitude = CookiesHelper.Get(cookies, "longitude")?.trim();

    return Boolean(latitude && longitude);
}