
import { WEATHER_MAP } from "@/scripts/constants/open-meteo";
import { LANGUAGES_ID } from "./languages-id";
import { LANGUAGES_CAPTION } from "./languages-caption";
import { LANGUAGES_PATH } from "./languages-path";
import { LANGUAGES_CODE } from "./languages-code";
import { LANGUAGES } from "./languages";

let _currentLanguage = LANGUAGES[0];

export function Initialize(language: string | null | undefined) : string
{
    if (language === "1" || language === null || language === undefined)
    {
        _currentLanguage = LANGUAGES[0];
    }
    else if (language === "2")
    {
        _currentLanguage = LANGUAGES[1];
    }
    else
    {
        const normalized = language.toLowerCase();

        if (LANGUAGES.includes(normalized))
        {
            _currentLanguage = normalized;
        }
        else
        {
            _currentLanguage = LANGUAGES[0];
        }
    }

    return _currentLanguage;
}

/* --------------  Functions  -------------- */

function getLanguage(): string
{
    return _currentLanguage;
}

function getLanguageId(): string
{
    const language = getLanguage();

    return LANGUAGES_ID[language] ?? "1";
}

export function Caption(code: string): string
{
    const languageId = getLanguageId();
    const key = `${languageId}_${code}`;
    const value = LANGUAGES_CAPTION[key] ?? `!${code}`;

    return value;
}

/** Open-Meteo WMO weather code → localized short condition label. */
export function WeatherCaption(weatherCode: number): string
{
    const translated = Caption(`Weather_${weatherCode}`);

    if (translated.startsWith("!"))
    {
        return WEATHER_MAP[weatherCode] ?? "Unknown";
    }

    return translated;
}

export function CaptionLanguage(code: string, languageId: string): string
{
    const key = `${languageId}_${code}`;
    const value = LANGUAGES_CAPTION[key] ?? `!${code}`;

    return value;
}

export function CaptionDefault(value: string | null | undefined, defaultValue: string = '-'): string
{
    if (!value || value === '' || value === 'null' || value === 'undefined')
    {
        return defaultValue;
    }

    value = value.replace('.', '')

    return Caption(value);
};

export function Path(code: string): string
{
    const languageId = getLanguageId();
    const key = `${languageId}_${code}`;
    const value = LANGUAGES_PATH[key] ?? `!${code}`;

    return value;
}

export function PathLanguage(code: string, languageId: string): string
{
    const key = `${languageId}_${code}`;
    const value = LANGUAGES_PATH[key] ?? `!${code}`;

    return value;
}

export function PathCode(section: string, page: string) : string
{
    const code = section == page ? page : section + "_" + page;

    const value = LANGUAGES_CODE[code] ?? "Public_Home";

    return value;
}

export function Language(): string
{
    return getLanguage();
}

export function LanguageId(): string
{
    return getLanguageId();
}
