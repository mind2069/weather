import { Session } from '@/scripts/types/session';
import { SessionEmpty } from '@/scripts/models/session';
import { CookiesHelper } from '@/scripts/helpers/cookies';
import * as LanguagesHelper from '@/scripts/languages/languages-helper';

export class SessionServiceShared
{
    public static Build(headers: Headers): Session
    {
        let session: Session = SessionEmpty();
        
        const cookies = headers.get("cookie") ?? "";

        const languageHeaders = headers.get("x-language");
        const language = LanguagesHelper.Initialize(languageHeaders);
        const languageId = LanguagesHelper.LanguageId();

        session.language.id = languageId;
        session.language.code = language;

        const ipAddress = headers.get("x-ip-address") ?? '0.0.0.0';
        const pathname = headers.get("x-pathname") ?? "";
        const section = headers.get("x-section") ?? "";
        const page = headers.get("x-page") ?? "";
        const filename = headers.get("x-filename") ?? "";

        session.tracking.ip_address = ipAddress;
        session.tracking.pathname = pathname;
        session.tracking.section = section;
        session.tracking.page = page;
        session.tracking.filename = filename;
        session.tracking.code = LanguagesHelper.PathCode(section, page);

        let unit = CookiesHelper.Get(cookies, 'unit') ?? '';

        if (unit !== '')
        {
            unit = unit.toLowerCase().trim();

            if (unit !== 'imperial' && unit !== 'metric')
            {
                unit = 'metric';
            }

            session.user.unit = unit;
        }

        const location = CookiesHelper.Get(cookies, 'location') ?? '';

        if (location.trim() !== '')
        {
            session.user.location.name = location.trim();
        }

        const latitudeRaw = CookiesHelper.Get(cookies, 'latitude') ?? '';
        const longitudeRaw = CookiesHelper.Get(cookies, 'longitude') ?? '';

        if (latitudeRaw !== '' && longitudeRaw !== '')
        {
            const latitude = Number.parseFloat(latitudeRaw);
            const longitude = Number.parseFloat(longitudeRaw);

            if (Number.isFinite(latitude) && Number.isFinite(longitude))
            {
                session.user.location.latitude = latitude;
                session.user.location.longitude = longitude;
            }
        }

        session.user.locale = languageId === "2" ? "fr-FR" : "en-US";

        return session;
    }
}
