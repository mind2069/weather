export type LanguageId = "1" | "2";

export interface OpenGraphImage
{
    url: string;
    width: number;
    height: number;
    alt: string;
}

export interface OpenGraphData
{
    title: string;
    description: string;
    url: string;
    siteName: string;
    images: OpenGraphImage[];
    locale: "en_CA" | "fr_CA";
    type: "website";
}

export interface TwitterData
{
    card: "summary" | "summary_large_image";
    title: string;
    description: string;
    images: string[];
    site?: string;
    creator?: string;
}

export interface LanguageAlternates
{
    "en-CA": string;
    "fr-CA": string;
    "x-default"?: string;
}

export interface JsonLdWebPage
{
    "@context": "https://schema.org";
    "@type": "WebPage";
    name: string;
    description: string;
    url: string;
    inLanguage: "en-CA" | "fr-CA";
}

export type JsonLdData = JsonLdWebPage;

export interface MetaData
{
    Title(languageId: LanguageId, context?: unknown): string;
    Description(languageId: LanguageId, context?: unknown): string;
    OpenGraph(languageId: LanguageId, context?: unknown): OpenGraphData;
    Twitter(languageId: LanguageId, context?: unknown): TwitterData;
    Keywords(languageId: LanguageId): string;
    Category(languageId: LanguageId): string;
    Classification(languageId: LanguageId): string;
    Canonical(languageId: LanguageId, context?: unknown): string;
    LanguageAlternates(context?: unknown): LanguageAlternates;
    JsonLd(languageId: LanguageId, context?: unknown): JsonLdData;
}

export const META_CONSTANTS =
{
    TWITTER_HANDLE: "",
    LOCALES:
    {
        EN: "en_CA" as const,
        FR: "fr_CA" as const,
    },
    LANGUAGES:
    {
        EN: "1" as const,
        FR: "2" as const,
    },
} as const;
