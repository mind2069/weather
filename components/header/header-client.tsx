"use client";

import { useEffect, useRef, useState } from "react";
import * as LanguagesHelper from '@/scripts/languages/languages-helper';
import { Session } from "@/scripts/types/session";
import { CookiesHelper } from "@/scripts/helpers/cookies";
import HeaderLocationSearch from "@/components/header/header-location-search";
import { FormattingHelper } from "@/scripts/helpers/formatting";
import { TextHelper } from "@/scripts/helpers/text";

interface ClientProperties
{
    session: Session;
}

export default function HeaderClient({session}: ClientProperties)
{
    const language = session.language.code;

    LanguagesHelper.Initialize(language);

    const unitValue = session.user.unit === "imperial" ? "imperial" : "metric";
    const pathCode = session.tracking.code;

    let pathEnglish = LanguagesHelper.PathLanguage(pathCode, "1");
    let pathFrench = LanguagesHelper.PathLanguage(pathCode, "2");

    if(session.tracking.filename !== "")    
    {
        pathEnglish += "/" + session.tracking.filename;
        pathFrench += "/" + session.tracking.filename;
    }

    const [navMenuOpen, setNavMenuOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [todayDate, setTodayDate] = useState("");
    const [tomorrowDate, setTomorrowDate] = useState("");
    const [afterTomorrowDate, setAfterTomorrowDate] = useState("");
    const [daysSevenDate, setDaysSevenDate] = useState("");
    const [daysFourteenDate, setDaysFourteenDate] = useState("");
    const [urlToday, setUrlToday] = useState("");
    const [urlTomorrow, setUrlTomorrow] = useState("");
    const [urlAfterTomorrow, setUrlAfterTomorrow] = useState("");
    const [urlDaysSeven, setUrlDaysSeven] = useState("");
    const [urlDaysFourteen, setUrlDaysFourteen] = useState("");
    const navMenuRef = useRef<HTMLDivElement>(null);
    const langMenuRef = useRef<HTMLDivElement>(null);

    const onUnitChange = (value: string) =>
    {
        if (value !== "metric" && value !== "imperial")
        {
            return;
        }

        CookiesHelper.Set("unit", value);
        
        window.location.reload();
    };

    const onSetCurrentLocation = () =>
    {
        const location = session.user.location.name;
        const latitude = session.user.location.latitude;
        const longitude = session.user.location.longitude;

        if (!location || latitude === -999999 || longitude === -999999)
        {
            return;
        }

        session.weather.location.name = location;
        session.weather.location.latitude = latitude;
        session.weather.location.longitude = longitude;

        CookiesHelper.Set("location", location);
        CookiesHelper.Set("latitude", String(latitude));
        CookiesHelper.Set("longitude", String(longitude));

        window.location.reload();
    };

    useEffect(() =>
    {
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const afterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
        const daysSeven = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const daysFourteen = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

        const isoToday = FormattingHelper.IsoDateLocal(today);
        const isoTomorrow = FormattingHelper.IsoDateLocal(tomorrow);
        const isoAfterTomorrow = FormattingHelper.IsoDateLocal(afterTomorrow);
        const isoDaysSeven = FormattingHelper.IsoDateLocal(daysSeven);
        const isoDaysFourteen = FormattingHelper.IsoDateLocal(daysFourteen);

        const textToday = `${FormattingHelper.Weekday(isoToday, language)} ${FormattingHelper.TextLong(isoToday, language)}`;
        const textTomorrow = `${FormattingHelper.Weekday(isoTomorrow, language)} ${FormattingHelper.TextLong(isoTomorrow, language)}`;
        const textAfterTomorrow = `${FormattingHelper.Weekday(isoAfterTomorrow, language)} ${FormattingHelper.TextLong(isoAfterTomorrow, language)}`;
        const textDaysSeven = `${FormattingHelper.Weekday(isoToday, language)} ${FormattingHelper.TextLong(isoToday, language)} ${LanguagesHelper.Caption("To").toLowerCase()} ${FormattingHelper.Weekday(isoDaysSeven, language)} ${FormattingHelper.TextLong(isoDaysSeven, language)}`;
        const textDaysFourteen = `${FormattingHelper.Weekday(isoToday, language)} ${FormattingHelper.TextLong(isoToday, language)} ${LanguagesHelper.Caption("To").toLowerCase()} ${FormattingHelper.Weekday(isoDaysFourteen, language)} ${FormattingHelper.TextLong(isoDaysFourteen, language)}`;

        const urlToday = TextHelper.FileName(textToday);
        const urlTomorrow = TextHelper.FileName(textTomorrow);
        const urlAfterTomorrow = TextHelper.FileName(textAfterTomorrow);
        const urlDaysSeven = TextHelper.FileName(textDaysSeven);
        const urlDaysFourteen = TextHelper.FileName(textDaysFourteen);

        setTodayDate(textToday.replace(",", "").replace(",", "").trim());
        setTomorrowDate(textTomorrow.replace(",", "").replace(",", "").trim());
        setAfterTomorrowDate(textAfterTomorrow.replace(",", "").replace(",", "").trim());
        setDaysSevenDate(textDaysSeven.replace(",", "").replace(",", "").trim());
        setDaysFourteenDate(textDaysFourteen.replace(",", "").replace(",", "").trim());

        setUrlToday(urlToday);
        setUrlTomorrow(urlTomorrow);
        setUrlAfterTomorrow(urlAfterTomorrow);
        setUrlDaysSeven(urlDaysSeven);
        setUrlDaysFourteen(urlDaysFourteen);


    
    }, [language]);

    useEffect(() =>
    {
        if (!navMenuOpen && !langMenuOpen)
        {
            return;
        }

        const onPointerDown = (e: PointerEvent) =>
        {
            const t = e.target as Node;

            if (navMenuRef.current?.contains(t) || langMenuRef.current?.contains(t))
            {
                return;
            }

            setNavMenuOpen(false);
            setLangMenuOpen(false);
        };

        const onKeyDown = (e: KeyboardEvent) =>
        {
            if (e.key === "Escape")
            {
                setNavMenuOpen(false);
                setLangMenuOpen(false);
            }
        };

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);

        return () =>
        {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };

    }, [navMenuOpen, langMenuOpen]);

    const HamburgerIcon = () =>
    {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
            >
                <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        );
    }

    const LanguageIcon = () =>
    {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
            >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
        );
    }

    return (
        <header>       
            <div className="container">
                <div className="wrapper">
                    <div className="menu">
                        <nav>
                            <div ref={navMenuRef} className="anchor">
                                <button
                                    type="button"
                                    className="icon"
                                    aria-expanded={navMenuOpen}
                                    onClick={() => setNavMenuOpen((open) => !open)}
                                >
                                    <HamburgerIcon />
                                </button>
                                {navMenuOpen ? (
                                    <>
                                        <div className="dropdown">
                                            <div className="links">
                                                <a href={LanguagesHelper.Path("Public_Today") + (urlToday ? "/" + urlToday : "")} onClick={() => setNavMenuOpen(false)}>
                                                    <span className="caption">{LanguagesHelper.Caption("Today")}</span>
                                                    <span className="date">{todayDate}</span>
                                                </a>
                                                <a href={LanguagesHelper.Path("Public_Tomorrow") + (urlTomorrow ? "/" + urlTomorrow : "")} onClick={() => setNavMenuOpen(false)}>
                                                    <span className="caption">{LanguagesHelper.Caption("Tomorrow")}</span>
                                                    <span className="date">{tomorrowDate}</span>
                                                </a>
                                                <a href={LanguagesHelper.Path("Public_AfterTomorrow") + (urlAfterTomorrow ? "/" + urlAfterTomorrow : "")} onClick={() => setNavMenuOpen(false)}>
                                                    <span className="caption">{LanguagesHelper.Caption("AfterTomorrow")}</span>
                                                    <span className="date">{afterTomorrowDate}</span>
                                                </a>
                                                <a href={LanguagesHelper.Path("Public_Forecast7Days") + (urlDaysSeven ? "/" + urlDaysSeven : "")} onClick={() => setNavMenuOpen(false)}>
                                                    <span className="caption">{LanguagesHelper.Caption("Forecast7Days")}</span>
                                                    <span className="date">{daysSevenDate}</span>
                                                </a>
                                                <a href={LanguagesHelper.Path("Public_Forecast14Days") + (urlDaysFourteen ? "/" + urlDaysFourteen : "")} onClick={() => setNavMenuOpen(false)}>
                                                    <span className="caption">{LanguagesHelper.Caption("Forecast14Days")}</span>
                                                    <span className="date">{daysFourteenDate}</span>
                                                </a>
                                            </div>
                                            <div className="units">
                                                <select className="select" value={unitValue} onChange={(e) => onUnitChange(e.target.value)}>
                                                    <option value="metric">{LanguagesHelper.Caption("Metric")}</option>
                                                    <option value="imperial">{LanguagesHelper.Caption("Imperial")}</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </nav>
                    </div>
                    <div className="location">
                        <div className="row">
                            <HeaderLocationSearch session={session} />
                            <div className="unit">
                                <select className="select" value={unitValue} onChange={(e) => onUnitChange(e.target.value)}>
                                    <option value="metric">{LanguagesHelper.Caption("Metric")}</option>
                                    <option value="imperial">{LanguagesHelper.Caption("Imperial")}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="language">
                        <div ref={langMenuRef} className="anchor">
                            <button
                                type="button"
                                className="icon"
                                aria-expanded={langMenuOpen}
                                onClick={() => setLangMenuOpen((open) => !open)}
                            >
                                <LanguageIcon />
                            </button>
                            {langMenuOpen ? (
                                <div className="dropdown">
                                    <div className="links">
                                        {( language !== "en-ca" && 
                                            <a href={pathEnglish} onClick={() => setLangMenuOpen(false)}>
                                                English
                                            </a>
                                        )}
                                        {( language !== "fr-ca" && 
                                            <a href={pathFrench} onClick={() => setLangMenuOpen(false)}>
                                                Français
                                            </a>
                                        )}
                                    </div>
                                    {session.user.location.name ? (
                                        <div className="current">
                                            <span className="name" title={session.user.location.name}>
                                                {session.user.location.name}
                                            </span>
                                            <button
                                                type="button"
                                                className="btn-set"
                                                onClick={onSetCurrentLocation}
                                            >
                                                {LanguagesHelper.Caption("Use")}
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
