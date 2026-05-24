"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bar, ComposedChart, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BarShapeProps } from "recharts";
import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import { WeatherServiceClient } from "@/services/open-meteo/client";
import { OpenMeteoDayParameters, OpenMeteoDayResponse } from "@/services/open-meteo/types";
import { OpenMeteoDay, DayNormalized, HourlyNormalized } from "@/scripts/types/open-meteo";
import { OpenMeteoHelper } from "@/scripts/helpers/open-meteo";
import { FormattingHelper } from "@/scripts/helpers/formatting";
import { Session } from "@/scripts/types/session";
import ModalLoading from "@/components/modal-loading/modal-loading";
import ModalMessage from "@/components/modal-message/modal-message";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DayHourlyChartRow
{
    label: string;
    time: string;
    hourTop: string;
    hourBottom: string;
    icon: string;
    temperature: number;
    windSpeed: number;
    uvIndex: number;
}

type ChartMetric = "temperature" | "wind" | "uv";

function HourChartAxisLabels(iso: string, locale: string): { top: string; bottom: string }
{
    const d = new Date(iso);

    if (Number.isNaN(d.getTime()))
    {
        return { top: "—", bottom: "" };
    }

    const parts = new Intl.DateTimeFormat(locale, 
    {
        hour: "numeric",
        minute: "2-digit",
        hour12: undefined

    }).formatToParts(d);

    let hour = "";
    let minute = "";
    let dayPeriod = "";

    for (const p of parts)
    {
        if (p.type === "hour")
        {
            hour = p.value;
        }
        else if (p.type === "minute")
        {
            minute = p.value;
        }
        else if (p.type === "dayPeriod")
        {
            dayPeriod = p.value.toLocaleUpperCase(locale);
        }
    }

    const top =
        hour && minute
            ? `${hour}:${minute}`
            : hour || FormattingHelper.LocalTime(iso, locale);

    return { top, bottom: dayPeriod };
}

const DayHourlyColumnShape = (props: BarShapeProps) =>
{
    const { x, width, payload, parentViewBox } = props;

    const pb = parentViewBox;

    if (pb == null || typeof x !== "number" || !payload)
    {
        return null;
    }

    const row = payload as DayHourlyChartRow;
    const pad = 0;
    const innerW = Math.max(0, width - pad * 2);
    const innerX = x + pad;
    const cx = innerX + innerW / 2;
    const hourTopY = pb.y + 20;
    const hourBottomY = pb.y + 38;
    const iconY = pb.y + pb.height - 24;

    return (
        <g className="chart-hourly-column">
            <rect
                x={innerX}
                y={pb.y}
                width={innerW}
                height={pb.height}
                rx={10}
                ry={10}
                fill="url(#dayHourlyColumnWash)"
                stroke="#e2e8f0"
                strokeWidth={1}
            />
            <text
                x={cx}
                y={hourTopY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#333333"
                fontSize={12}
                fontWeight={600}
            >
                {row.hourTop}
            </text>
            {row.hourBottom ? (
                <text
                    x={cx}
                    y={hourBottomY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#94a3b8"
                    fontSize={11}
                >
                    {row.hourBottom}
                </text>
            ) : null}
            <image
                href={row.icon}
                x={cx - 16}
                y={iconY - 16}
                width={28}
                height={28}
                preserveAspectRatio="xMidYMid meet"
            />
        </g>
    );
};

interface ClientProperties
{
    session: Session;
    date: string;
}

export default function Client({ session, date }: ClientProperties)
{
    LanguagesHelper.Initialize(session.language.code);

    const locale = session.user.locale;
    const windSpeedUnit = session.user.unit === "imperial" ? "mph" : "km/h";
    const windSpeedUnitDisplay = session.user.unit === "imperial" ? "MPH" : "KM/H";
    const tempUnitSuffix = session.user.unit === "imperial" ? "F" : "C";
    const [day, setDay] = useState<DayNormalized | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartMetric, setChartMetric] = useState<ChartMetric>("temperature");
    const pageLoadedRef = useRef(false);
    const chartScrollRef = useRef<HTMLDivElement>(null);
    const [chartScrollNarrowLayout, setChartScrollNarrowLayout] = useState(false);
    const [chartNeedsHorizontalScroll, setChartNeedsHorizontalScroll] = useState(false);

    const refreshChartScrollHints = useCallback(() =>
    {
        const el = chartScrollRef.current;

        if (!el)
        {
            setChartNeedsHorizontalScroll(false);

            return;
        }

        const { clientWidth, scrollWidth } = el;
        const epsilon = 2;

        setChartNeedsHorizontalScroll(scrollWidth > clientWidth + epsilon);

    }, []);

    useEffect(() =>
    {
        const mq = window.matchMedia("(max-width: 1299px)");

        const applyMq = () =>
        {
            setChartScrollNarrowLayout(mq.matches);
        };

        applyMq();

        mq.addEventListener("change", applyMq);

        return () =>
        {
            mq.removeEventListener("change", applyMq);
        };

    }, []);

    const chartScrollByPage = useCallback((direction: -1 | 1) =>
    {
        const el = chartScrollRef.current;

        if (!el)
        {
            return;
        }

        const instant =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const behavior: ScrollBehavior = instant ? "auto" : "smooth";
        const epsilon = 2;

        if (direction === -1 && el.scrollLeft <= epsilon)
        {
            el.scrollTo({
                left: el.scrollWidth - el.clientWidth,
                behavior,
            });

            return;
        }

        if (direction === 1 && el.scrollLeft + el.clientWidth >= el.scrollWidth - epsilon)
        {
            el.scrollTo({ left: 0, behavior });

            return;
        }

        const delta = Math.max(120, Math.round(el.clientWidth * 0.85)) * direction;

        el.scrollBy({ left: delta, behavior });
    }, []);

    useEffect(() =>
    {
        if (pageLoadedRef.current)
        {
            return;
        }

        pageLoadedRef.current = true;

        void Load();
        
    }, []);

    const Load = async () =>
    {
        setLoading(true);
        setError(null);

        const parametersDay: OpenMeteoDayParameters =
        {
            session: session,
            date: date,
        };

        const responseDay: OpenMeteoDayResponse = await WeatherServiceClient.Day(parametersDay);

        if (responseDay.success && responseDay.data)
        {
            const data: OpenMeteoDay = responseDay.data;

            const dayNormalize: DayNormalized | null = OpenMeteoHelper.DayNormalize(session, data);

            if (dayNormalize)
            {
                setDay(dayNormalize);
            }
            else
            {
                setDay(null);

                setError(LanguagesHelper.Caption("CouldNotLoadWeather"));
            }
        }
        else
        {
            setDay(null);

            const message = responseDay.message?.trim();

            setError(message ? message : LanguagesHelper.Caption("CouldNotLoadWeather"));
        }

        setLoading(false);
    }

    const hourlyNormalized: HourlyNormalized[] = day?.hourly ?? [];

    const chartData: DayHourlyChartRow[] = useMemo(
        () =>
            hourlyNormalized.map((item) =>
            {
                const { top, bottom } = HourChartAxisLabels(item.time, locale);

                return {
                    label: FormattingHelper.LocalTime(item.time, locale),
                    time: item.time,
                    hourTop: top,
                    hourBottom: bottom,
                    icon: item.icon,
                    temperature: item.temperature,
                    windSpeed: item.windSpeed,
                    uvIndex: item.uvIndex,
                };
            }),

        [hourlyNormalized, locale],
    );

    const temperatureYDomain = useMemo((): [number, number] =>
    {
        if (chartData.length === 0)
        {
            return [0, 1];
        }

        const vals = chartData.map((d) => d.temperature);
        const lo = Math.min(...vals);
        const hi = Math.max(...vals);
        const span = Math.max(4, hi - lo);
        const bottomPad = Math.min(14, 4 + span * 0.12);

        return [lo - bottomPad, hi + 2];

    }, [chartData]);

    const windYDomain = useMemo((): [number, number] =>
    {
        if (chartData.length === 0)
        {
            return [0, 1];
        }

        const vals = chartData.map((d) => d.windSpeed);
        const lo = Math.min(...vals);
        const hi = Math.max(...vals);
        const span = Math.max(2, hi - lo);
        const bottomPad = Math.min(16, 2.5 + span * 0.18);
        const topPad = Math.max(1, span * 0.06);

        return [lo - bottomPad, hi + topPad];

    }, [chartData]);

    const uvYDomain = useMemo((): [number, number] =>
    {
        if (chartData.length === 0)
        {
            return [0, 1];
        }

        const vals = chartData.map((d) => d.uvIndex);
        const hi = Math.max(...vals);
        const span = Math.max(0.5, hi);
        const topPad = Math.min(1.25, 0.25 + span * 0.12);
        const floorBelowZero = Math.min(2.5, 0.5 + span * 0.16);

        return [-floorBelowZero, hi + topPad];

    }, [chartData]);

    useEffect(() =>
    {
        const el = chartScrollRef.current;

        if (!el)
        {
            return;
        }

        refreshChartScrollHints();

        const onScroll = () =>
        {
            refreshChartScrollHints();
        };

        el.addEventListener("scroll", onScroll, { passive: true });

        const ro = new ResizeObserver(() =>
        {
            refreshChartScrollHints();
        });

        ro.observe(el);

        window.addEventListener("resize", refreshChartScrollHints);

        const t = window.requestAnimationFrame(refreshChartScrollHints);

        return () =>
        {
            el.removeEventListener("scroll", onScroll);
            ro.disconnect();
            window.removeEventListener("resize", refreshChartScrollHints);
            window.cancelAnimationFrame(t);
        };

    }, [chartData, chartMetric, refreshChartScrollHints]);

    return (
        <>
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
            <div className={"day"}>
                <section className={`details ${loading || error || !day ? "details-unloaded" : ""}`}>
                    {!loading && !error && day && (
                        <div className="container">
                            <div className="header">
                                <div className="title">
                                    <h1>
                                        <span className="forecast">
                                            {day.highlights.forecast}
                                        </span>
                                        <span className="weekday">
                                            {FormattingHelper.Weekday(day.date, locale)}
                                            {", "}
                                            {FormattingHelper.TextLong(day.date, locale)}
                                        </span>
                                    </h1>
                                </div>
                                <div className="highlights">
                                    <div className="wrapper">
                                        <div className="icon">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={day.highlights.icon}
                                                alt={day.highlights.forecast}
                                                draggable={false}
                                            />
                                        </div>
                                        <div className="temperature">
                                            <div>
                                                <span className="value">
                                                    {Math.round(day.highlights.temperature)}
                                                </span>
                                                <span className="unit">
                                                    °{tempUnitSuffix}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="overview">
                                            <div className="items">
                                                <div className="humidity">
                                                    {LanguagesHelper.Caption("Humidity")}: {Math.round(day.highlights.humidity)}%
                                                </div>
                                                <div className="wind">
                                                    {LanguagesHelper.Caption("Wind")}: {Math.round(day.highlights.windSpeed)} {windSpeedUnit}
                                                </div>
                                                <div className="uv">
                                                    {LanguagesHelper.Caption("UV")}: {FormattingHelper.UvIndex(day.highlights.uvIndex)}
                                                </div>
                                                <div className="precipitation">
                                                    {LanguagesHelper.Caption("Precipitation")}: {day.highlights.precipitation.toFixed(1)} mm
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="summary">
                                    <div className="content">
                                        <div className="item">
                                            <div className="row">
                                                <span className="label">
                                                    {LanguagesHelper.Caption("Low")}
                                                </span>
                                                <span className="value">
                                                    {Math.round(day.tempMin)}°{tempUnitSuffix}
                                                </span>
                                            </div>
                                            <div className="row">
                                                <span className="label">
                                                    {LanguagesHelper.Caption("High")}
                                                </span>
                                                <span className="value">
                                                    {Math.round(day.tempMax)}°{tempUnitSuffix}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="item">
                                            <div className="row">
                                                <span className="label">
                                                    {LanguagesHelper.Caption("WindMin")}
                                                </span>
                                                <span className="value">
                                                {Math.round(day.windMin)} {windSpeedUnitDisplay}
                                                </span>
                                            </div>
                                            <div className="row">
                                                <span className="label">
                                                    {LanguagesHelper.Caption("WindMax")}
                                                </span>
                                                <span className="value end">
                                                    {Math.round(day.windMax)}
                                                    {windSpeedUnitDisplay}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="item">
                                            <div className="row">
                                                <span className="label">
                                                    {LanguagesHelper.Caption("UVMin")} 
                                                </span>
                                                <span className="value">
                                                    {FormattingHelper.UvIndex(day.uvMin)}
                                                </span>
                                            </div>
                                            <div className="row">
                                                <span className="label">
                                                    {LanguagesHelper.Caption("UVMax")}
                                                </span>
                                                <span className="value end">
                                                    {FormattingHelper.UvIndex(day.uvMax)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="item">
                                            <div className="row">
                                                <span className="label">
                                                    {LanguagesHelper.Caption("Sunrise")}
                                                </span>
                                                <span className="value">
                                                    {day.sunrise
                                                        ? FormattingHelper.LocalTime(day.sunrise, locale)
                                                        : "—"}
                                                </span>
                                            </div>
                                            <div className="row">
                                                <span className="label">
                                                    {LanguagesHelper.Caption("Sunset")}
                                                </span>
                                                <span className="value">
                                                    {day.sunset
                                                        ? FormattingHelper.LocalTime(day.sunset, locale)
                                                        : "—"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="hours">
                                {hourlyNormalized.map((item) => (
                                    <article className="hour" key={item.time}>
                                        <div className="overview">
                                            <div className="grid">
                                                <div className="time">
                                                    {FormattingHelper.LocalTime(item.time, locale)}
                                                </div>
                                                <div className="icon">
                                                    <img src={item.icon} alt={item.forecast}draggable={false} />
                                                </div>
                                                <div className="temperature">
                                                    <div>
                                                        <span className="value">{Math.round(item.temperature)}</span>
                                                        <span className="symbol">°</span>
                                                        <span className="unit">{tempUnitSuffix}</span>
                                                    </div>
                                                </div>
                                                <div className="forecast">
                                                    {item.forecast}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="metas">
                                            <div className="grid">
                                                <div className="meta precipitation">
                                                    <div className="label">
                                                        {LanguagesHelper.Caption("Precip")}
                                                    </div>
                                                    <div className="value">
                                                        {item.precipitation.toFixed(1)} mm
                                                    </div>
                                                </div>
                                                <div className="meta wind">
                                                    <div className="label">
                                                        {LanguagesHelper.Caption("Wind")}
                                                    </div>
                                                    <div className="value">
                                                        {Math.round(item.windSpeed)} {windSpeedUnit}
                                                    </div>
                                                </div>
                                                <div className="meta humidity">
                                                    <div className="label">
                                                        {LanguagesHelper.Caption("Humidity")}
                                                    </div>
                                                    <div className="value">
                                                        {Math.round(item.humidity)}%
                                                    </div>
                                                </div>
                                                <div className="meta uv">
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
                        </div>
                    )}
                </section>
                {!loading && !error && chartData.length > 0 && (
                    <section className="chart">
                        <div className="container">
                            <div className="wrapper-1" ref={chartScrollRef}>
                                <div className="wrapper-2">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                        minWidth={0}
                                        minHeight={288}
                                        initialDimension={{ width: 400, height: 288 }}
                                    >
                                        <ComposedChart
                                            key={chartMetric}
                                            data={chartData}
                                            margin={{
                                                top: 52,
                                                right: 0,
                                                left: 0,
                                                bottom: chartMetric === "uv" ? 17 : 4,
                                            }}
                                            barCategoryGap={4}
                                            barGap={0}
                                        >
                                            <defs>
                                                <linearGradient
                                                    id="dayHourlyColumnWash"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="0%"
                                                        stopColor="#ffffff"
                                                        stopOpacity={1}
                                                    />
                                                    <stop
                                                        offset="55%"
                                                        stopColor="#ffffff"
                                                        stopOpacity={1}
                                                    />
                                                    <stop
                                                        offset="100%"
                                                        stopColor="#ffffff"
                                                        stopOpacity={1}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <Bar
                                                dataKey={
                                                    chartMetric === "temperature"
                                                        ? "temperature"
                                                        : chartMetric === "wind"
                                                            ? "windSpeed"
                                                            : "uvIndex"
                                                }
                                                fill="transparent"
                                                stroke="none"
                                                isAnimationActive={false}
                                                maxBarSize={999}
                                                shape={DayHourlyColumnShape}
                                                legendType="none"
                                                zIndex={25}
                                            />
                                            <XAxis
                                                dataKey="time"
                                                type="category"
                                                padding="no-gap"
                                                tickLine={false}
                                                axisLine={false}
                                                interval={0}
                                                tick={false}
                                                height={0}
                                            />
                                            <YAxis
                                                hide
                                                type="number"
                                                domain={
                                                    chartMetric === "temperature"
                                                        ? temperatureYDomain
                                                        : chartMetric === "wind"
                                                            ? windYDomain
                                                            : uvYDomain
                                                }
                                            />
                                            <Tooltip
                                                content={({ active, payload }) =>
                                                {
                                                    if (!active || !payload?.length)
                                                    {
                                                        return null;
                                                    }

                                                    const row = payload[0]?.payload as DayHourlyChartRow;

                                                    if (!row)
                                                    {
                                                        return null;
                                                    }

                                                    return (
                                                        <div className="chart-tooltip">
                                                            <p className="chart-tooltip-title">
                                                                {row.label}
                                                            </p>
                                                            <p className="chart-tooltip-line">
                                                                {chartMetric === "wind" ? (
                                                                    <>
                                                                        <span className="chart-tooltip-strong">
                                                                            {Math.round(row.windSpeed)}
                                                                        </span>
                                                                        <span className="chart-tooltip-muted">
                                                                            {" "}
                                                                            {windSpeedUnitDisplay}
                                                                        </span>
                                                                    </>
                                                                ) : chartMetric === "uv" ? (
                                                                    <>
                                                                        <span className="chart-tooltip-strong">
                                                                            {FormattingHelper.UvIndex(row.uvIndex)}
                                                                        </span>
                                                                        <span className="chart-tooltip-muted">
                                                                            {" "}
                                                                            {LanguagesHelper.Caption("UV")}
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="chart-tooltip-strong">
                                                                            {Math.round(row.temperature)}
                                                                        </span>
                                                                        <span className="chart-tooltip-muted">
                                                                            °{tempUnitSuffix}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </p>
                                                        </div>
                                                    );
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey={
                                                    chartMetric === "temperature"
                                                        ? "temperature"
                                                        : chartMetric === "wind"
                                                            ? "windSpeed"
                                                            : "uvIndex"
                                                }
                                                stroke="#0369a1"
                                                strokeWidth={2}
                                                dot={{
                                                    r: 3,
                                                    fill: "#0369a1",
                                                    strokeWidth: 0,
                                                }}
                                                activeDot={{ r: 5 }}
                                                isAnimationActive={true}
                                                zIndex={50}
                                            >
                                                <LabelList
                                                    dataKey={
                                                        chartMetric === "temperature"
                                                            ? "temperature"
                                                            : chartMetric === "wind"
                                                                ? "windSpeed"
                                                                : "uvIndex"
                                                    }
                                                    position="top"
                                                    offset={8}
                                                    fill="#334155"
                                                    fontSize={11}
                                                    fontWeight={600}
                                                    formatter={(label) =>
                                                        chartMetric === "uv"
                                                            ? `${FormattingHelper.UvIndex(Number(label))} ${LanguagesHelper.Caption("UV")}`
                                                            : chartMetric === "temperature"
                                                                ? `${Math.round(Number(label))}°${tempUnitSuffix}`
                                                                : `${Math.round(Number(label))} ${windSpeedUnitDisplay}`
                                                    }
                                                />
                                            </Line>
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            {chartScrollNarrowLayout && chartNeedsHorizontalScroll ? (
                                <div className="navigator">
                                    <button
                                        type="button"
                                        className="btn arrow"
                                        onClick={() => chartScrollByPage(-1)}
                                    >
                                        <ChevronLeft aria-hidden size={20} strokeWidth={2} />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn arrow"
                                        onClick={() => chartScrollByPage(1)}
                                    >
                                        <ChevronRight aria-hidden size={20} strokeWidth={2} />
                                    </button>
                                </div>
                            ) : null}
                            <div className="actions">
                                <div className="grid">
                                    <div>
                                        <button
                                            type="button"
                                            className={chartMetric === "temperature"? "btn btn-brand": "btn"}
                                            onClick={() => setChartMetric("temperature")}
                                        >
                                            {LanguagesHelper.Caption("Temperature")}
                                        </button>
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            className={chartMetric === "wind"? "btn btn-brand": "btn"}
                                            onClick={() => setChartMetric("wind")}
                                        >
                                            {LanguagesHelper.Caption("Wind")}
                                        </button>
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            className={chartMetric === "uv"? "btn btn-brand": "btn"}
                                            onClick={() => setChartMetric("uv")}
                                        >
                                            {LanguagesHelper.Caption("UvIndex")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}
