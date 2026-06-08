import type { NextResponse } from "next/server";
import { Session } from '@/scripts/types/session';
import { SessionEmpty } from '@/scripts/models/session';
import { CookiesHelper } from '@/scripts/helpers/cookies';
import * as LanguagesHelper from '@/scripts/languages/languages-helper';
import { LocationsDefaultParameters, LocationsDefaultResponse } from '@/services/locations/types';
import { LocationsServiceServer } from '@/services/locations/server';
import { LocationDefault } from '@/scripts/types/location';
import { LocationHelper } from '@/scripts/helpers/location';

export class SessionServiceShared
{
    private static DecodeVercelCity(city: string): string
    {
        if (city === '')
        {
            return '';
        }

        try
        {
            return decodeURIComponent(city);
        }
        catch
        {
            return city;
        }
    }

    public static Build(headers: Headers): Session
    {
        let session: Session = SessionEmpty();
        
        const cookies = headers.get("cookie") ?? "";

        const languageHeaders = headers.get("x-language");
        const language = LanguagesHelper.Initialize(languageHeaders);
        const languageId = LanguagesHelper.LanguageId();

        const ipAddress = headers.get("x-ip-address") ?? '0.0.0.0';
        const pathname = headers.get("x-pathname") ?? "";
        const section = headers.get("x-section") ?? "";
        const page = headers.get("x-page") ?? "";
        const filename = headers.get("x-filename") ?? "";

        const cityVercel = SessionServiceShared.DecodeVercelCity(headers.get("v-city") ?? '');
        const countryVercel = headers.get("v-country") ?? '';
        const provinceVercel = headers.get("v-province") ?? '';
        const latitudeVercel = LocationHelper.LatitudeNormalize(Number.parseFloat(headers.get("v-latitude") ?? ''));
        const longitudeVercel = LocationHelper.LongitudeNormalize(Number.parseFloat(headers.get("v-longitude") ?? ''));
        const vercelCoordsValid = latitudeVercel !== -999999 && longitudeVercel !== -999999;
        const locationVercel = [cityVercel, provinceVercel, countryVercel].filter((part) => part !== '').join(', ');

        let unit = 'metric';
        let location = '';
        let latitude = -999999;
        let longitude = -999999;
        let locale = languageId === "2" ? "fr-FR" : "en-US";

        let unitCookies = CookiesHelper.Get(cookies, 'unit') ?? '';
        let locationCookies = CookiesHelper.Get(cookies, 'location') ?? '';
        let latitudeCookies = CookiesHelper.Get(cookies, 'latitude') ?? '';
        let longitudeCookies = CookiesHelper.Get(cookies, 'longitude') ?? '';

        unitCookies = unitCookies.trim().toLowerCase();
        locationCookies = locationCookies.trim();
        latitudeCookies = latitudeCookies.trim();
        longitudeCookies = longitudeCookies.trim();

        if(unitCookies !== '')
        {
            if (unitCookies === 'imperial' || unitCookies === 'metric')
            {
                unit = 'metric';
            }
        }

        if (latitudeCookies !== '' && longitudeCookies !== '')
        {
            latitude = LocationHelper.LatitudeNormalize(Number.parseFloat(latitudeCookies));
            longitude = LocationHelper.LongitudeNormalize(Number.parseFloat(longitudeCookies));
        }

        if (locationCookies !== '')
        {
            location = locationCookies;
        }

        const cookieCoordsValid = latitude !== -999999 && longitude !== -999999;
        const cookieLocationComplete = location !== '' && cookieCoordsValid;

        if (!cookieLocationComplete)
        {
            if (!cookieCoordsValid && vercelCoordsValid)
            {
                latitude = latitudeVercel;
                longitude = longitudeVercel;

                if (location === '')
                {
                    location = locationVercel !== '' ? locationVercel : `${latitude}, ${longitude}`;
                }
            }

            if (location === '' || latitude === -999999 || longitude === -999999)
            {
                const parameters: LocationsDefaultParameters =
                {
                    latitude: latitude,
                    longitude: longitude
                };

                const response: LocationsDefaultResponse = LocationsServiceServer.Default(parameters);

                if (response.success)
                {
                    const locationDefault: LocationDefault = response.data;

                    location = locationDefault.name;
                    latitude = locationDefault.latitude;
                    longitude = locationDefault.longitude;
                }
                else
                {
                    location = 'X, QC, Canada';
                    latitude = 45.6068;
                    longitude = -73.7129;
                }
            }
        }
        
        session.language.id = languageId;
        session.language.code = language;
        session.tracking.ip_address = ipAddress;
        session.tracking.pathname = pathname;
        session.tracking.section = section;
        session.tracking.page = page;
        session.tracking.filename = filename;
        session.tracking.code = LanguagesHelper.PathCode(section, page);

        session.user.unit = unit;
        session.user.location.name = location;
        session.user.location.latitude = latitude;
        session.user.location.longitude = longitude;
        session.user.locale = locale;

        return session;
    }

    private static HasCompleteLocationCookies(cookieHeader: string): boolean
    {
        const location = CookiesHelper.Get(cookieHeader, "location")?.trim() ?? "";
        const latitude = LocationHelper.LatitudeNormalize(Number.parseFloat(CookiesHelper.Get(cookieHeader, "latitude") ?? ""));
        const longitude = LocationHelper.LongitudeNormalize(Number.parseFloat(CookiesHelper.Get(cookieHeader, "longitude") ?? ""));

        return location !== "" && latitude !== -999999 && longitude !== -999999;
    }

    public static HeadersForBuild(requestHeaders: Headers, tracking: { language: string; ipAddress: string; hostname: string; pathname: string; section: string; page: string; filename: string; city: string; country: string; province: string; latitude: string; longitude: string }): Headers
    {
        const headers = new Headers(requestHeaders);

        headers.set("x-language", tracking.language);
        headers.set("x-ip-address", tracking.ipAddress);
        headers.set("x-hostname", tracking.hostname);
        headers.set("x-pathname", tracking.pathname);
        headers.set("x-section", tracking.section);
        headers.set("x-page", tracking.page);
        headers.set("x-filename", tracking.filename);
        headers.set("v-city", tracking.city);
        headers.set("v-country", tracking.country);
        headers.set("v-province", tracking.province);
        headers.set("v-latitude", tracking.latitude);
        headers.set("v-longitude", tracking.longitude);

        return headers;
    }

    public static Store(response: NextResponse, session: Session, cookieHeader: string): void
    {
        if (SessionServiceShared.HasCompleteLocationCookies(cookieHeader))
        {
            return;
        }

        const latitude = LocationHelper.LatitudeNormalize(session.user.location.latitude);
        const longitude = LocationHelper.LongitudeNormalize(session.user.location.longitude);

        if (session.user.location.name === "" || latitude === -999999 || longitude === -999999)
        {
            return;
        }

        const maxAge = 365 * 24 * 60 * 60;

        response.cookies.set("unit", session.user.unit, { path: "/", maxAge, sameSite: "lax" });
        response.cookies.set("location", session.user.location.name, { path: "/", maxAge, sameSite: "lax" });
        response.cookies.set("latitude", String(latitude), { path: "/", maxAge, sameSite: "lax" });
        response.cookies.set("longitude", String(longitude), { path: "/", maxAge, sameSite: "lax" });
    }
}
