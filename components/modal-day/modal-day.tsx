"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import type { ForecastNormalized, DayNormalized } from "@/scripts/types/open-meteo";

import type { Session } from "@/scripts/types/session";
import { FormattingHelper } from "@/scripts/helpers/formatting";
import Link from "next/link";

import "./styles.css";
import "./styles-responsive.css";

export interface ComponentProperties
{
    session: Session;
    day: ForecastNormalized | null;
    dayForecast: DayNormalized | null;
    open: boolean;
    loading: boolean;
    error: string | null;
    onClose: () => void;
}

export default function ModalDayForecast({ session, day, dayForecast, open, loading, error, onClose }: ComponentProperties)
{
    LanguagesHelper.Initialize(session.language.code);

    const locale = session.user.locale;
    const windSpeedUnit = session.user.unit === "imperial" ? "mph" : "km/h";
    const windSpeedUnitDisplay = session.user.unit === "imperial" ? "MPH" : "KM/H";
    const tempUnitSuffix = session.user.unit === "imperial" ? "F" : "C";
    const hourly = dayForecast?.hourly ?? [];
    const now = new Date();
    const dateToday = FormattingHelper.IsoDateLocal(now);
    const listRef = useRef<HTMLDivElement>(null);
    const date = day?.date ?? "";

    let time = "12:00 AM";

    if (day && date === dateToday)
    {
        const floored = new Date(now);

        floored.setMinutes(0, 0, 0);
        floored.setSeconds(0, 0);
        floored.setMilliseconds(0);

        time = FormattingHelper.LocalTime(floored.toISOString(), locale);
    }

    useLayoutEffect(() =>
    {
        const hourRows = dayForecast?.hourly ?? [];

        if (!open || loading || error || !day || !dayForecast || hourRows.length === 0)
        {
            return;
        }

        if (time === "12:00 AM")
        {
            return;
        }

        const match = hourRows.find((item) => FormattingHelper.LocalTime(item.time, locale) === time);

        if (!match)
        {
            return;
        }

        requestAnimationFrame(() =>
        {
            const escaped = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(match.time) : match.time.replace(/"/g, '\\"');
            const row = listRef.current?.querySelector<HTMLElement>(`[data-slot-time="${escaped}"]`);

            row?.scrollIntoView({ block: "start", behavior: "smooth" });
        });

    }, [open, loading, error, day, dayForecast, date, time, locale]);

    useEffect(() =>
    {
        if (!open)
        {
            return;
        }

        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";

        const onKeyDown = (e: KeyboardEvent) =>
        {
            if (e.key === "Escape")
            {
                onClose();
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () =>
        {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };

    }, [open, onClose]);

    if (!open)
    {
        return null;
    }

    if (!day)
    {
        return null;
    }

    return (
        <div className="modal-day">
            <button className="backdrop" type="button" onClick={onClose}/>
            <div className="dialog">
                <div className="surface gradient">
                    <div className="inner">
                        {error && (
                            <p className="alert" role="alert">
                                {error}
                            </p>
                        )}
                        {loading && (
                            <div className="busy" aria-busy="true" aria-live="polite">
                                <p>{LanguagesHelper.Caption("Loading")}</p>
                            </div>
                        )}
                        {!loading && !error && dayForecast && hourly.length === 0 && (
                            <p className="empty">
                                {LanguagesHelper.Caption("CouldNotLoadWeather")}
                            </p>
                        )}
                        {!loading && !error && day && (
                            <div className="summary">
                                <div className="main">
                                    <div className="head">
                                        <h2 className="title">
                                            {FormattingHelper.Weekday(day.date, locale)}
                                            {", "}
                                            {FormattingHelper.TextLong(day.date, locale)}
                                        </h2>
                                        <div className="actions">
                                            <Link
                                                href={LanguagesHelper.Path("Public_Day") + "/" + date}
                                                className="action"
                                            >
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    aria-hidden
                                                >
                                                    <path d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5M21 3h-9m9 0v9m0-9L9 15" />
                                                </svg>
                                                <span className="label">
                                                    {LanguagesHelper.Caption("Details")}
                                                </span>
                                            </Link>
                                            <button
                                                type="button"
                                                className="action"
                                                onClick={onClose}
                                            >
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    aria-hidden
                                                >
                                                    <path d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                <span className="label">
                                                    {LanguagesHelper.Caption("Close")}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="data">
                                        <div className="col">
                                            <div className="row">
                                                <span className="label">{LanguagesHelper.Caption("High")}</span>
                                                <span className="value">
                                                    {Math.round(day.tempMax)}°{tempUnitSuffix}
                                                </span>
                                            </div>
                                            <div className="row">
                                                <span className="label">{LanguagesHelper.Caption("Low")}</span>
                                                <span className="value">
                                                    {Math.round(day.tempMin)}°{tempUnitSuffix}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="row">
                                                <span className="label">{LanguagesHelper.Caption("UVMax")}</span>
                                                <span className="value">
                                                    {FormattingHelper.UvIndex(day.uvMax)}
                                                </span>
                                            </div>
                                            <div className="row">
                                                <span className="label">{LanguagesHelper.Caption("Wind")}</span>
                                                <span className="value end">
                                                    {Math.round(day.windMin)} - {Math.round(day.windMax)}{" "}
                                                    {windSpeedUnitDisplay}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="row">
                                                <span className="label">{LanguagesHelper.Caption("Sunrise")}</span>
                                                <span className="value">
                                                    {day.sunrise
                                                        ? FormattingHelper.LocalTime(day.sunrise, locale)
                                                        : "—"}
                                                </span>
                                            </div>
                                            <div className="row">
                                                <span className="label">{LanguagesHelper.Caption("Sunset")}</span>
                                                <span className="value">
                                                    {day.sunset? FormattingHelper.LocalTime(day.sunset, locale) : "—"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {!loading && !error && dayForecast && hourly.length > 0 && (
                            <div ref={listRef}className="list scrollbar-transparent">
                                {hourly.map((item) => (
                                    <article className="hour" key={item.time} data-slot-time={item.time}>
                                        <div className="overview">
                                            <div className="grid">
                                                <div className="time">
                                                    {FormattingHelper.LocalTime(item.time, locale)}
                                                </div>
                                                <div className="icon" aria-hidden>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={item.icon}
                                                        alt=""
                                                        draggable={false}
                                                    />
                                                </div>
                                                <div className="temperature">
                                                    {Math.round(item.temperature)}°
                                                </div>
                                                <div className="forecast" title={item.forecast}>
                                                    {item.forecast}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="meta">
                                            <div className="grid">
                                                <div className="statistic precipitation">
                                                    <div className="label">
                                                        {LanguagesHelper.Caption("Precipitation")}
                                                    </div>
                                                    <div className="value">
                                                        {item.precipitation.toFixed(1)} mm
                                                    </div>
                                                </div>
                                                <div className="statistic wind">
                                                    <div className="label">
                                                        {LanguagesHelper.Caption("Wind")}
                                                    </div>
                                                    <div className="value">
                                                        {Math.round(item.windSpeed)}
                                                        {" "}
                                                        {windSpeedUnit}
                                                    </div>
                                                </div>
                                                <div className="statistic humidity">
                                                    <div className="label">
                                                        {LanguagesHelper.Caption("Humidity")}
                                                    </div>
                                                    <div className="value">
                                                        {Math.round(item.humidity)}%
                                                    </div>
                                                </div>
                                                <div className="statistic uv">
                                                    <div className="label">
                                                        {LanguagesHelper.Caption("UV")}
                                                    </div>
                                                    <div className="value">
                                                        {FormattingHelper.UvIndex(item.uvIndex)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
