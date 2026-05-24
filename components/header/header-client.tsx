"use client";

import { useEffect, useRef, useState } from "react";
import * as LanguagesHelper from '@/scripts/languages/languages-helper';
import { Session } from "@/scripts/types/session";
import { CookiesHelper } from "@/scripts/helpers/cookies";
import HeaderLocationSearch from "@/components/header/header-location-search";

interface ClientProperties
{
    session: Session;
}

export default function HeaderClient({session}: ClientProperties)
{
    LanguagesHelper.Initialize(session.language.code);

    const pathCode = session.tracking.code;
    const pathEnglish = LanguagesHelper.PathLanguage(pathCode, "1");
    const pathFrench = LanguagesHelper.PathLanguage(pathCode, "2");
    const unitValue = session.user.unit === "imperial" ? "imperial" : "metric";

    const [navMenuOpen, setNavMenuOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);
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
                                                <a href={LanguagesHelper.Path("Public_Today")} onClick={() => setNavMenuOpen(false)}>
                                                    {LanguagesHelper.Caption("Today")}
                                                </a>
                                                <a href={LanguagesHelper.Path("Public_Tomorrow")} onClick={() => setNavMenuOpen(false)}>
                                                    {LanguagesHelper.Caption("Tomorrow")}
                                                </a>
                                                <a href={LanguagesHelper.Path("Public_Forecast")} onClick={() => setNavMenuOpen(false)}>
                                                    {LanguagesHelper.Caption("Forecast")}
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
                                    <a href={pathEnglish} onClick={() => setLangMenuOpen(false)}>
                                        English
                                    </a>
                                    <a href={pathFrench} onClick={() => setLangMenuOpen(false)}>
                                        Français
                                    </a>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
