"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import { WeatherServiceClient } from "@/services/open-meteo/client";
import {
    OpenMeteoDayParameters,
    OpenMeteoDayResponse,
    OpenMeteoForecastParameters,
    OpenMeteoForecastResponse,
} from "@/services/open-meteo/types";
import { OpenMeteoHelper } from "@/scripts/helpers/open-meteo";
import { DayNormalized, ForecastNormalized, OpenMeteoDay, OpenMeteoForecast } from "@/scripts/types/open-meteo";
import { FormattingHelper } from "@/scripts/helpers/formatting";
import { Session } from "@/scripts/types/session";
import { WEATHER_ICONS_UNKNOWN } from "@/scripts/constants/open-meteo";
import ModalLoading from "@/components/modal-loading/modal-loading";
import ModalMessage from "@/components/modal-message/modal-message";
import ModalDay from "@/components/modal-day/modal-day";

const CALENDAR_ROWS = 6;
const CALENDAR_CELLS = CALENDAR_ROWS * 7;
const CLICKABLE_FORECAST_DAYS = 16;

interface ClientProperties
{
    session: Session;
    forecastStart: string;
    forecastEnd: string;
}

interface CalendarCell
{
    key: string;
    empty: boolean;
    date?: string;
    dayNumber?: number;
    forecast?: ForecastNormalized;
}

function WeekStartsOn(locale: string): number
{
    return locale.startsWith("fr") ? 1 : 0;
}

function WeekdayLabels(locale: string, weekStartsOn: number): string[]
{
    const labels: string[] = [];
    const sunday = new Date("2024-01-07T12:00:00");

    for (let i = 0; i < 7; i++)
    {
        const day = new Date(sunday);

        day.setDate(sunday.getDate() + ((weekStartsOn + i) % 7));

        const label = day.toLocaleDateString(locale, { weekday: "long" });

        labels.push(label.length > 0 ? label[0]!.toUpperCase() + label.slice(1) : label);
    }

    return labels;
}

function HasUsableForecast(item: ForecastNormalized): boolean
{
    return (
        item.icon !== WEATHER_ICONS_UNKNOWN &&
        Number.isFinite(item.tempMax) &&
        Number.isFinite(item.tempMin)
    );
}

function TrimTrailingEmptyRows(cells: CalendarCell[]): CalendarCell[]
{
    let end = cells.length;

    while (end >= 7)
    {
        const row = cells.slice(end - 7, end);
        const hasForecast = row.some((cell) => !!cell.forecast);

        if (hasForecast)
        {
            break;
        }

        end -= 7;
    }

    return cells.slice(0, end);
}

function BuildCells(
    todayIso: string,
    forecastByDate: Map<string, ForecastNormalized>,
    weekStartsOn: number,
): CalendarCell[]
{
    const today = new Date(`${todayIso}T12:00:00`);
    const offset = (today.getDay() - weekStartsOn + 7) % 7;
    const start = new Date(today);

    start.setDate(today.getDate() - offset);

    const cells: CalendarCell[] = [];

    for (let i = 0; i < CALENDAR_CELLS; i++)
    {
        const cursor = new Date(start);

        cursor.setDate(start.getDate() + i);

        const date = FormattingHelper.IsoDateLocal(cursor);
        const past = date < todayIso;
        const forecast = past ? undefined : forecastByDate.get(date);

        cells.push({
            key: date,
            empty: false,
            date,
            dayNumber: cursor.getDate(),
            forecast: forecast && HasUsableForecast(forecast) ? forecast : undefined,
        });
    }

    return TrimTrailingEmptyRows(cells);
}

export default function Client({ session, forecastStart, forecastEnd }: ClientProperties)
{
    LanguagesHelper.Initialize(session.language.code);

    const locale = session.user.locale;
    const tempUnitSuffix = session.user.unit === "imperial" ? "F" : "C";
    const weekStartsOn = WeekStartsOn(locale);
    const weekdayLabels = useMemo(() => WeekdayLabels(locale, weekStartsOn), [locale, weekStartsOn]);
    const [forecast, setForecast] = useState<ForecastNormalized[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dayModalOpen, setDayModalOpen] = useState(false);
    const [dayModalLoading, setDayModalLoading] = useState(false);
    const [dayModalError, setDayModalError] = useState<string | null>(null);
    const [dayModalDay, setDayModalDay] = useState<ForecastNormalized | null>(null);
    const [dayModalForecast, setDayModalForecast] = useState<DayNormalized | null>(null);
    const pageLoadedRef = useRef(false);
    const todayIso = FormattingHelper.IsoDateLocal(new Date());
    const clickableEndIso = useMemo(() =>
    {
        const end = new Date(`${todayIso}T12:00:00`);

        end.setDate(end.getDate() + (CLICKABLE_FORECAST_DAYS - 1));

        return FormattingHelper.IsoDateLocal(end);
    }, [todayIso]);

    useEffect(() =>
    {
        if (pageLoadedRef.current)
        {
            return;
        }

        pageLoadedRef.current = true;

        void ForecastLoad();
    }, []);

    const ForecastLoad = async () =>
    {
        setLoading(true);
        setError(null);

        const parametersForecast: OpenMeteoForecastParameters =
        {
            session: session,
            dateStart: forecastStart,
            dateEnd: forecastEnd,
        };

        const responseForecast: OpenMeteoForecastResponse = await WeatherServiceClient.Forecast(parametersForecast);

        if (responseForecast.success && responseForecast.data)
        {
            const data: OpenMeteoForecast = responseForecast.data;
            const forecastNormalize: ForecastNormalized[] = OpenMeteoHelper.ForecastNormalize(session, data);

            setForecast(forecastNormalize);
        }
        else
        {
            setForecast(null);

            const message = responseForecast.message?.trim();

            setError(message ? message : LanguagesHelper.Caption("CouldNotLoadForecast"));
        }

        setLoading(false);
    };

    const OpenDayModal = async (item: ForecastNormalized) =>
    {
        setDayModalOpen(true);
        setDayModalLoading(true);
        setDayModalError(null);
        setDayModalForecast(null);
        setDayModalDay(item);

        const parametersDay: OpenMeteoDayParameters =
        {
            session: session,
            date: item.date,
        };

        const responseDay: OpenMeteoDayResponse = await WeatherServiceClient.Day(parametersDay);

        if (responseDay.success && responseDay.data)
        {
            const data: OpenMeteoDay = responseDay.data;
            const dayForecast: DayNormalized | null = OpenMeteoHelper.DayNormalize(session, data);

            if (dayForecast)
            {
                setDayModalForecast(dayForecast);
            }
            else
            {
                setDayModalError(LanguagesHelper.Caption("CouldNotLoadWeather"));
            }
        }
        else
        {
            const message = responseDay.message?.trim();

            setDayModalError(message ? message : LanguagesHelper.Caption("CouldNotLoadWeather"));
        }

        setDayModalLoading(false);
    };

    const forecastByDate = useMemo(() =>
    {
        const map = new Map<string, ForecastNormalized>();

        for (const item of forecast ?? [])
        {
            map.set(item.date, item);
        }

        return map;
    }, [forecast]);

    const cells = useMemo(
        () => BuildCells(todayIso, forecastByDate, weekStartsOn),
        [todayIso, forecastByDate, weekStartsOn],
    );

    return (
        <div className="calendar">
            {loading && (
                <ModalLoading label={LanguagesHelper.Caption("Loading")} />
            )}
            {!loading && error ? (
                <ModalMessage
                    title={LanguagesHelper.Caption("Error")}
                    message={error}
                    closeLabel={LanguagesHelper.Caption("Close")}
                    onClose={() => setError(null)}
                />
            ) : null}
            <ModalDay
                session={session}
                day={dayModalDay}
                dayForecast={dayModalForecast}
                open={dayModalOpen}
                loading={dayModalLoading}
                error={dayModalError}
                onClose={() => setDayModalOpen(false)}
            />
            <section className={`details ${loading || error || cells.length === 0 ? "details-unloaded" : ""}`}>
                {!loading && !error && cells.length > 0 && (
                    <div className="container">
                        <h1 className="head">
                            <span className="label">
                                {LanguagesHelper.Caption("Calendar")}
                            </span>
                        </h1>
                        <div className="board">
                            <div className="weekdays">
                                {weekdayLabels.map((label) => (
                                    <div key={label} className="weekday">
                                        <span className="long">{label}</span>
                                        <span className="short">{label.slice(0, 3)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="days">
                                {cells.map((cell) =>
                                {
                                    if (!cell.date || cell.dayNumber == null)
                                    {
                                        return <div key={cell.key} className="day empty" aria-hidden />;
                                    }

                                    const isToday = cell.date === todayIso;
                                    const item = cell.forecast;
                                    const isPast = cell.date < todayIso;

                                    if (!item)
                                    {
                                        return (
                                            <div
                                                key={cell.key}
                                                className={`day bare${isPast ? " past" : ""}${isToday ? " today" : ""}`}
                                            >
                                                <span className="number">
                                                    <span className="day-number">{cell.dayNumber}</span>
                                                    <span className="month long">{FormattingHelper.Month(cell.date, locale)}</span>
                                                    <span className="month short">{FormattingHelper.Month(cell.date, locale).slice(0, 3)}</span>
                                                </span>
                                            </div>
                                        );
                                    }

                                    const dayContent = (
                                        <>
                                            <span className="number">
                                                <span className="day-number">{cell.dayNumber}</span>
                                                <span className="month long">{FormattingHelper.Month(cell.date, locale)}</span>
                                                <span className="month short">{FormattingHelper.Month(cell.date, locale).slice(0, 3)}</span>
                                            </span>
                                            <span className="icon">
                                                <img src={item.icon} alt={item.forecast} draggable={false} />
                                            </span>
                                            <span className="temperature">
                                                <span className="value">{Math.round(item.tempMax)}</span>
                                                <span className="symbol">°</span>
                                                <span className="unit">{tempUnitSuffix}</span>
                                            </span>
                                            <span className="blurb" title={item.forecast}>
                                                {item.forecast}
                                            </span>
                                        </>
                                    );

                                    const canOpenDay = cell.date <= clickableEndIso;

                                    if (!canOpenDay)
                                    {
                                        return (
                                            <div
                                                key={cell.key}
                                                className={`day locked${isToday ? " today" : ""}`}
                                            >
                                                {dayContent}
                                            </div>
                                        );
                                    }

                                    return (
                                        <button
                                            key={cell.key}
                                            type="button"
                                            className={`day${isToday ? " today" : ""}`}
                                            onClick={() => void OpenDayModal(item)}
                                        >
                                            {dayContent}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
