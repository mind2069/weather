
import { NextResponse } from "next/server";
import { Session } from '@/scripts/types/session';
import { SessionEmpty } from '@/scripts/models/session';
import { COOKIE_DEFAULT_OPTIONS, CookiesHelper } from '@/scripts/helpers/cookies';
import * as LanguagesHelper from '@/scripts/languages/languages-helper';
import { LocationsDefaultParameters, LocationsDefaultResponse } from '@/services/locations/types';
import { LocationsServiceServer } from '@/services/locations/server';
import { LocationDefault } from '@/scripts/types/location';
import { LocationHelper } from '@/scripts/helpers/location';
import { LocationsData } from '@/scripts/data/locations';
import { TextHelper } from "@/scripts/helpers/text";

export class SessionServiceShared
{
    public static async Build(headers: Headers): Promise<Session>
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

        const latitudeVercel = LocationHelper.LatitudeNormalize(Number.parseFloat(headers.get("v-latitude") ?? headers.get("x-vercel-ip-latitude") ?? ""));
        const longitudeVercel = LocationHelper.LongitudeNormalize(Number.parseFloat(headers.get("v-longitude") ?? headers.get("x-vercel-ip-longitude") ?? ""));
        const vercelCoordsValid = latitudeVercel !== -999999 && longitudeVercel !== -999999;

        const locationDefault = LocationsData.DefaultCity();

        let locationCurrent: LocationDefault =
        {
            id: locationDefault.id,
            city: locationDefault.city,
            province: locationDefault.province,
            country: locationDefault.country,
            latitude: locationDefault.latitude,
            longitude: locationDefault.longitude,
        };

        if (vercelCoordsValid)
        {
            const parameters: LocationsDefaultParameters =
            {
                latitude: latitudeVercel,
                longitude: longitudeVercel,
            };

            const response: LocationsDefaultResponse = await LocationsServiceServer.Default(parameters);

            if (response.success)
            {
                const locationClosest: LocationDefault = response.data;

                locationCurrent.id = locationClosest.id;
                locationCurrent.city = locationClosest.city;
                locationCurrent.province = locationClosest.province;
                locationCurrent.country = locationClosest.country;
                locationCurrent.latitude = locationClosest.latitude;
                locationCurrent.longitude = locationClosest.longitude;
            }
            else
            {
                locationCurrent.latitude = latitudeVercel;
                locationCurrent.longitude = longitudeVercel;
            }
        }

        const userLocationName = LocationsData.FormatName(locationCurrent);
        const userLocationLatitude = locationCurrent.latitude;
        const userLocationLongitude = locationCurrent.longitude;

        let unit = 'metric';
        let locale = languageId === "2" ? "fr-FR" : "en-US";

        let weatherLocationName = '';
        let weatherLocationLatitude = -999999;
        let weatherLocationLongitude = -999999;

        let unitCookies = CookiesHelper.Get(cookies, 'unit') ?? '';
        let locationCookies = CookiesHelper.Get(cookies, 'location') ?? '';
        let latitudeCookies = CookiesHelper.Get(cookies, 'latitude') ?? '';
        let longitudeCookies = CookiesHelper.Get(cookies, 'longitude') ?? '';

        unitCookies = unitCookies.trim().toLowerCase();
        locationCookies = locationCookies.trim();
        latitudeCookies = latitudeCookies.trim();
        longitudeCookies = longitudeCookies.trim();

        if (unitCookies === 'imperial' || unitCookies === 'metric')
        {
            unit = unitCookies;
        }

        if (latitudeCookies !== '' && longitudeCookies !== '')
        {
            weatherLocationLatitude = LocationHelper.LatitudeNormalize(Number.parseFloat(latitudeCookies));
            weatherLocationLongitude = LocationHelper.LongitudeNormalize(Number.parseFloat(longitudeCookies));
        }

        if (locationCookies !== '')
        {
            weatherLocationName = locationCookies;
        }

        const cookieCoordsValid = weatherLocationLatitude !== -999999 && weatherLocationLongitude !== -999999;
        const cookieLocationComplete = weatherLocationName !== '' && cookieCoordsValid;

        if (!cookieLocationComplete)
        {
            const locationMiddleware = TextHelper.Decode(headers.get("s-location") ?? "");
            const latitudeMiddleware = LocationHelper.LatitudeNormalize(Number.parseFloat(headers.get("s-latitude") ?? ""));
            const longitudeMiddleware = LocationHelper.LongitudeNormalize(Number.parseFloat(headers.get("s-longitude") ?? ""));
            const sessionValidMiddleware = locationMiddleware !== "" && latitudeMiddleware !== -999999 && longitudeMiddleware !== -999999;

            if (sessionValidMiddleware)
            {
                weatherLocationName = locationMiddleware;
                weatherLocationLatitude = latitudeMiddleware;
                weatherLocationLongitude = longitudeMiddleware;

                const unitMiddleware = headers.get("s-unit")?.trim().toLowerCase() ?? "";

                if (unitMiddleware === "imperial" || unitMiddleware === "metric")
                {
                    unit = unitMiddleware;
                }
            }
            else
            {
                weatherLocationName = userLocationName;
                weatherLocationLatitude = userLocationLatitude;
                weatherLocationLongitude = userLocationLongitude;
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
        session.user.location.name = userLocationName;
        session.user.location.latitude = userLocationLatitude;
        session.user.location.longitude = userLocationLongitude;
        session.user.locale = locale;

        session.weather.location.name = weatherLocationName;
        session.weather.location.latitude = weatherLocationLatitude;
        session.weather.location.longitude = weatherLocationLongitude;

        return session;
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

    public static ForwardSessionHeaders(headers: Headers, session: Session): void
    {
        headers.set("s-location", session.weather.location.name);
        headers.set("s-latitude", String(session.weather.location.latitude));
        headers.set("s-longitude", String(session.weather.location.longitude));
        headers.set("s-unit", session.user.unit);
    }

    public static Store(
        response: NextResponse,
        session: Session,
        cookieHeader: string,
        current?: { city: string; country: string; province: string; latitude: string; longitude: string },
    ): void
    {
        SessionServiceShared.ForwardSessionHeaders(response.headers, session);

        if (current)
        {
            response.cookies.set("Current.City", current.city, COOKIE_DEFAULT_OPTIONS);
            response.cookies.set("Current.Province", current.province, COOKIE_DEFAULT_OPTIONS);
            response.cookies.set("Current.Country", current.country, COOKIE_DEFAULT_OPTIONS);
            response.cookies.set("Current.Latitude", current.latitude, COOKIE_DEFAULT_OPTIONS);
            response.cookies.set("Current.Longitude", current.longitude, COOKIE_DEFAULT_OPTIONS);
        }

        if (LocationHelper.CookiesCompleted(cookieHeader))
        {
            const unitCookie = CookiesHelper.Get(cookieHeader, "unit")?.trim().toLowerCase() ?? "";

            if (unitCookie !== "imperial" && unitCookie !== "metric")
            {
                response.cookies.set("unit", session.user.unit, COOKIE_DEFAULT_OPTIONS);
            }

            return;
        }

        const latitude = LocationHelper.LatitudeNormalize(session.weather.location.latitude);
        const longitude = LocationHelper.LongitudeNormalize(session.weather.location.longitude);

        if (session.weather.location.name === "" || latitude === -999999 || longitude === -999999)
        {
            return;
        }

        response.cookies.set("unit", session.user.unit, COOKIE_DEFAULT_OPTIONS);
        response.cookies.set("location", session.weather.location.name, COOKIE_DEFAULT_OPTIONS);
        response.cookies.set("latitude", String(latitude), COOKIE_DEFAULT_OPTIONS);
        response.cookies.set("longitude", String(longitude), COOKIE_DEFAULT_OPTIONS);
    }

    public static async CreateResponse(requestHeaders: Headers, rewriteUrl: URL | null, cookieHeader: string, tracking: { language: string; ipAddress: string; hostname: string; pathname: string; section: string; page: string; filename: string; city: string; country: string; province: string; latitude: string; longitude: string }): Promise<NextResponse>
    {
        const sessionHeaders = SessionServiceShared.HeadersForBuild(requestHeaders, tracking);
        const session = await SessionServiceShared.Build(sessionHeaders);

        const forwardedHeaders = SessionServiceShared.HeadersForBuild(requestHeaders, tracking);

        SessionServiceShared.ForwardSessionHeaders(forwardedHeaders, session);

        const response = rewriteUrl ? NextResponse.rewrite(rewriteUrl, { request: { headers: forwardedHeaders } }) : NextResponse.next({ request: { headers: forwardedHeaders } });

        SessionServiceShared.Store(response, session, cookieHeader, {
            city: tracking.city,
            country: tracking.country,
            province: tracking.province,
            latitude: tracking.latitude,
            longitude: tracking.longitude,
        });

        return response;
    }
}