"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Area, Bar, ComposedChart, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BarShapeProps } from "recharts";
import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import { WeatherServiceClient } from "@/services/open-meteo/client";
import { OpenMeteoDayParameters, OpenMeteoDayResponse, OpenMeteoForecastParameters, OpenMeteoForecastResponse } from "@/services/open-meteo/types";
import { OpenMeteoHelper } from "@/scripts/helpers/open-meteo";
import { ForecastNormalized, DayNormalized, OpenMeteoDay, OpenMeteoForecast } from "@/scripts/types/open-meteo";
import { FormattingHelper } from "@/scripts/helpers/formatting";
import { Session } from "@/scripts/types/session";
import ModalDay from "@/components/modal-day/modal-day";
import ModalLoading from "@/components/modal-loading/modal-loading";
import ModalMessage from "@/components/modal-message/modal-message";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ClientProperties
{
    session: Session;
    days: number;
}

interface ForecastChartRow
{
    label: string;
    date: string;
    weekdayLine: string;
    dateLine: string;
    icon: string;
    tempMin: number;
    tempMax: number;
    tempRange: [number, number];
    windMin: number;
    windMax: number;
    windRange: [number, number];
    uvMin: number;
    uvMax: number;
    uvRange: [number, number];
}

type ChartMetric = "temperature" | "wind" | "uv";

export default function Client({ session, days }: ClientProperties)
{
    LanguagesHelper.Initialize(session.language.code);

    const locale = session.user.locale;
    const windSpeedUnit = session.user.unit === "imperial" ? "MPH" : "KM/H";
    const tempUnitSuffix = session.user.unit === "imperial" ? "F" : "C";
    const [forecast, setForecast] = useState<ForecastNormalized[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateStart, setDateStart] = useState<Date>(() => new Date());
    const [dateEnd, setDateEnd] = useState<Date>(() =>
    {
        const d = new Date();

        d.setDate(d.getDate() + days);

        return d;
    });
    const [dayModalOpen, setDayModalOpen] = useState(false);
    const [dayModalLoading, setDayModalLoading] = useState(false);
    const [dayModalError, setDayModalError] = useState<string | null>(null);
    const [dayModalDay, setDayModalDay] = useState<ForecastNormalized | null>(null);
    const [dayModalForecast, setDayModalForecast] = useState<DayNormalized | null>(null);
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
        const mq = window.matchMedia("(max-width: 1099px)");

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

        void ForecastLoad();
        
    }, []);
    
    const ForecastLoad = async () =>
    {
        setLoading(true);
        setError(null);

        const parametersForecast: OpenMeteoForecastParameters =
        {
            session: session,
            days: days,
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

            setError( message ? message : LanguagesHelper.Caption("CouldNotLoadForecast"));
        }

        setLoading(false);

    };

    const ForecastColumnShape = (props: BarShapeProps) =>
    {
        const { x, width, payload, parentViewBox } = props;

        const pb = parentViewBox;

        if (pb == null || typeof x !== "number" || !payload)
        {
            return null;
        }

        const row = payload as ForecastChartRow;
        const pad = 0;
        const innerW = Math.max(0, width - pad * 2);
        const innerX = x + pad;
        const cx = innerX + innerW / 2;
        const weekdayY = pb.y + 20;
        const dateY = pb.y + 38;
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
                    fill="url(#forecastColumnWash)"
                    stroke="#e2e8f0"
                    strokeWidth={1}
                />
                <text
                    x={cx}
                    y={weekdayY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#333333"
                    fontSize={12}
                    fontWeight={600}
                >
                    {row.weekdayLine}
                </text>
                <text
                    x={cx}
                    y={dateY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#94a3b8"
                    fontSize={11}
                >
                    {row.dateLine}
                </text>
                <image
                    href={row.icon}
                    x={cx - 16}
                    y={iconY - 16}
                    width={28}
                    height={28}
                    preserveAspectRatio="xMidYMid meet"
                    aria-hidden
                />
            </g>
        );
    }

    const forecastNormalized: ForecastNormalized[] = forecast ?? [];

    const chartData: ForecastChartRow[] = useMemo(
        () =>
            forecastNormalized.map((item) =>
            {
                const d = new Date(`${item.date}T12:00:00`);

                return {
                    label: d.toLocaleDateString(locale, 
                    {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                    }),
                    date: item.date,
                    weekdayLine: d
                        .toLocaleDateString(locale, { weekday: "short" })
                        .replace(/\.$/, "")
                        .toLocaleUpperCase(locale),
                    dateLine: d.toLocaleDateString(locale, 
                    {
                        month: "short",
                        day: "numeric",
                    }),
                    icon: item.icon,
                    tempMin: item.tempMin,
                    tempMax: item.tempMax,
                    tempRange: [item.tempMin, item.tempMax],
                    windMin: item.windMin,
                    windMax: item.windMax,
                    windRange: [item.windMin, item.windMax],
                    uvMin: item.uvMin,
                    uvMax: item.uvMax,
                    uvRange: [item.uvMin, item.uvMax] as [number, number],
                };
            }),

        [forecastNormalized, locale],
    );

    const temperatureYDomain = useMemo((): [number, number] =>
    {
        if (chartData.length === 0)
        {
            return [0, 1];
        }

        const lo = Math.min(...chartData.map((d) => d.tempMin));
        const hi = Math.max(...chartData.map((d) => d.tempMax));
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

        const lo = Math.min(...chartData.map((d) => d.windMin));
        const hi = Math.max(...chartData.map((d) => d.windMax));
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

        const hi = Math.max(...chartData.map((d) => d.uvMax));
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

    const OpenDayModal = async (item: ForecastNormalized) =>
    {
        const date = item.date;

        setDayModalOpen(true);
        setDayModalLoading(true);
        setDayModalError(null);
        setDayModalForecast(null);
        setDayModalDay(item);

        const parametersDay: OpenMeteoDayParameters =
        {
            session: session,
            date: date
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
    
    return (
        <div className="forecast">
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
            <section className={`details ${loading || error || forecastNormalized.length === 0 ? "details-unloaded" : ""}`}>
                {!loading && !error && forecastNormalized.length > 0 && (
                    <div className="container">
                        <h1 className="head">
                            <span className="label">
                                {LanguagesHelper.Caption("Forecast14Days")}
                            </span>
                            <span className="dates">
                                <span>
                                    {FormattingHelper.TextLong(FormattingHelper.IsoDateLocal(dateStart), locale)}
                                </span>
                                <span>
                                    {LanguagesHelper.Caption("To").toLocaleLowerCase()}{" "}
                                </span>
                                <span>
                                    {FormattingHelper.TextLong(FormattingHelper.IsoDateLocal(dateEnd), locale)}
                                </span>
                            </span>
                        </h1>
                        <div className="items">
                            {forecastNormalized.map((item) => (
                                <div key={item.date}>
                                    <button className="item" type="button" onClick={() => void OpenDayModal(item)}>
                                        <div className="title">
                                            <div className="weekday">
                                                {FormattingHelper.Weekday(item.date, locale)}
                                            </div>
                                            <div className="date">
                                                {FormattingHelper.TextLong(item.date, locale)}
                                            </div>
                                        </div>
                                        <div className="inner">
                                            <div className="overview">
                                                <div className="grid">
                                                    <div className="weekday">
                                                        {FormattingHelper.Weekday(item.date, locale)}
                                                    </div>
                                                    <div className="date">
                                                        {FormattingHelper.TextLong(item.date, locale)}
                                                    </div>
                                                    <div className="icon">
                                                        <img src={item.icon} alt={item.forecast} draggable={false}/>
                                                    </div>
                                                    <div className="temperature">
                                                        <div>
                                                            <span className="value">{Math.round(item.tempMax)}</span>
                                                            <span className="symbol">°</span>
                                                            <span className="unit">{tempUnitSuffix}</span>
                                                        </div>
                                                    </div>
                                                    <div className="blurb" title={item.forecast}>
                                                        {item.forecast}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="statistics">
                                                <div>
                                                    <div className="statistic high">
                                                        <div className="label">
                                                            {LanguagesHelper.Caption("High")}
                                                        </div>
                                                        <div className="value">
                                                            {Math.round(item.tempMax)}°{tempUnitSuffix}
                                                        </div>
                                                    </div>
                                                    <div className="statistic low">
                                                        <div className="label">
                                                            {LanguagesHelper.Caption("Low")}
                                                        </div>
                                                        <div className="value">
                                                            {Math.round(item.tempMin)}°{tempUnitSuffix}
                                                        </div>
                                                    </div>
                                                    <div className="statistic humidity">
                                                        <span className="label">
                                                            {LanguagesHelper.Caption("Humidity")}
                                                        </span>
                                                        <span className="value">
                                                            {Math.round(item.humidity)}%
                                                        </span>
                                                    </div>
                                                    <div className="rain">
                                                        <span>💧</span>{" "}{item.precipitation.toFixed(1)} mm / {item.rainProbability}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="metas">
                                                <div className="grid">
                                                    <div className="meta low">
                                                        <div className="label">
                                                            {LanguagesHelper.Caption("Low")}
                                                        </div>
                                                        <div className="value">
                                                            {Math.round(item.tempMin)}°{tempUnitSuffix}
                                                        </div>
                                                    </div>
                                                    <div className="meta high">
                                                        <div className="label">
                                                            {LanguagesHelper.Caption("High")}
                                                        </div>
                                                        <div className="value">
                                                            {Math.round(item.tempMax)}°{tempUnitSuffix}
                                                        </div>
                                                    </div>
                                                    <div className="meta precipitation">
                                                        <div className="label">
                                                            {LanguagesHelper.Caption("Precip")}
                                                        </div>
                                                        <div className="value">
                                                            {item.precipitation.toFixed(1)} mm, {item.rainProbability}%
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
                                                            {FormattingHelper.UvIndex(item.uvMax)}
                                                        </div>
                                                    </div>
                                                    <div className="meta wind">
                                                        <div className="label">
                                                            {LanguagesHelper.Caption("Wind")}
                                                        </div>
                                                        <div className="value">
                                                            {Math.round(item.windMax)}{" "}{windSpeedUnit}
                                                        </div>
                                                    </div>
                                                    <div className="meta sunrise">
                                                        <div className="label">
                                                            {LanguagesHelper.Caption("Sunrise")}
                                                        </div>
                                                        <div className="value">
                                                            {FormattingHelper.LocalTime(item.sunrise, locale)}
                                                        </div>
                                                    </div>
                                                    <div className="meta sunset">
                                                        <div className="label">
                                                            {LanguagesHelper.Caption("Sunset")}
                                                        </div>
                                                        <div className="value">
                                                            {FormattingHelper.LocalTime(item.sunset, locale)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
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
                                                bottom: chartMetric === "uv" ? 22 : 4,
                                        }}
                                        barCategoryGap={4}
                                        barGap={0}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="forecastTempBand"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#0369a1"
                                                    stopOpacity={0.35}
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor="#38bdf8"
                                                    stopOpacity={0.12}
                                                />
                                            </linearGradient>
                                            <linearGradient
                                                id="forecastColumnWash"
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
                                                    ? "tempMax"
                                                    : chartMetric === "wind"
                                                        ? "windMax"
                                                        : "uvMax"
                                            }
                                            fill="transparent"
                                            stroke="none"
                                            isAnimationActive={false}
                                            maxBarSize={999}
                                            shape={ForecastColumnShape}
                                            legendType="none"
                                            zIndex={25}
                                        />
                                        <XAxis
                                            dataKey="date"
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
                                            content={({ active, payload, label }) =>
                                            {
                                                if (!active || !payload?.length)
                                                {
                                                    return null;
                                                }

                                                const row = payload[0]?.payload as ForecastChartRow;

                                                if (!row)
                                                {
                                                    return null;
                                                }

                                                if (chartMetric === "wind")
                                                {
                                                    return (
                                                        <div className="chart-tooltip">
                                                            <p className="chart-tooltip-title">
                                                                {label}
                                                            </p>
                                                            <p className="chart-tooltip-metric chart-tooltip-metric--spaced">
                                                                {LanguagesHelper.Caption("High")}:{" "}
                                                                <span className="chart-tooltip-value">
                                                                    {Math.round(row.windMax)} {windSpeedUnit}
                                                                </span>
                                                            </p>
                                                            <p className="chart-tooltip-metric">
                                                                {LanguagesHelper.Caption("Low")}:{" "}
                                                                <span className="chart-tooltip-value">
                                                                    {Math.round(row.windMin)} {windSpeedUnit}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    );
                                                }

                                                if (chartMetric === "uv")
                                                {
                                                    return (
                                                        <div className="chart-tooltip">
                                                            <p className="chart-tooltip-title">
                                                                {label}
                                                            </p>
                                                            <p className="chart-tooltip-metric chart-tooltip-metric--spaced">
                                                                {LanguagesHelper.Caption("High")}:{" "}
                                                                <span className="chart-tooltip-value">
                                                                    {FormattingHelper.UvIndex(row.uvMax)}
                                                                </span>
                                                            </p>
                                                            <p className="chart-tooltip-metric">
                                                                {LanguagesHelper.Caption("Low")}:{" "}
                                                                <span className="chart-tooltip-value">
                                                                    {FormattingHelper.UvIndex(row.uvMin)}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="chart-tooltip">
                                                        <p className="chart-tooltip-title">
                                                            {label}
                                                        </p>
                                                        <p className="chart-tooltip-metric chart-tooltip-metric--spaced">
                                                            {LanguagesHelper.Caption("High")}:{" "}
                                                            <span className="chart-tooltip-value">
                                                                {Math.round(row.tempMax)}°{tempUnitSuffix}
                                                            </span>
                                                        </p>
                                                        <p className="chart-tooltip-metric">
                                                            {LanguagesHelper.Caption("Low")}:{" "}
                                                            <span className="chart-tooltip-value">
                                                                {Math.round(row.tempMin)}°{tempUnitSuffix}
                                                            </span>
                                                        </p>
                                                    </div>
                                                );
                                            }}
                                        />
                                        <>
                                            <Area
                                                type="monotone"
                                                dataKey={
                                                    chartMetric === "temperature"
                                                        ? "tempRange"
                                                        : chartMetric === "wind"
                                                            ? "windRange"
                                                            : "uvRange"
                                                }
                                                stroke="none"
                                                fill="url(#forecastTempBand)"
                                                isAnimationActive={true}
                                                legendType="none"
                                                zIndex={40}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey={
                                                    chartMetric === "temperature"
                                                        ? "tempMax"
                                                        : chartMetric === "wind"
                                                            ? "windMax"
                                                            : "uvMax"
                                                }
                                                name={LanguagesHelper.Caption("High")}
                                                stroke="#0369a1"
                                                strokeWidth={2}
                                                dot={{
                                                    r: 3,
                                                    fill: "#0369a1",
                                                    strokeWidth: 0,
                                                }}
                                                activeDot={{ r: 5 }}
                                                zIndex={50}
                                            >
                                                <LabelList
                                                    dataKey={
                                                        chartMetric === "temperature"
                                                            ? "tempMax"
                                                            : chartMetric === "wind"
                                                                ? "windMax"
                                                                : "uvMax"
                                                    }
                                                    position="top"
                                                    offset={6}
                                                    fill="#334155"
                                                    fontSize={11}
                                                    fontWeight={600}
                                                    formatter={(label) =>
                                                        chartMetric === "uv"
                                                            ? `${FormattingHelper.UvIndex(Number(label))} ${LanguagesHelper.Caption("UV")}`
                                                            : chartMetric === "temperature"
                                                                ? `${Math.round(Number(label))}°${tempUnitSuffix}`
                                                                : `${Math.round(Number(label))} ${windSpeedUnit}`
                                                    }
                                                />
                                            </Line>
                                            <Line
                                                type="monotone"
                                                dataKey={
                                                    chartMetric === "temperature"
                                                        ? "tempMin"
                                                        : chartMetric === "wind"
                                                            ? "windMin"
                                                            : "uvMin"
                                                }
                                                name={LanguagesHelper.Caption("Low")}
                                                stroke="#0ea5e9"
                                                strokeWidth={2}
                                                dot={{
                                                    r: 3,
                                                    fill: "#0ea5e9",
                                                    strokeWidth: 0,
                                                }}
                                                activeDot={{ r: 5 }}
                                                zIndex={50}
                                            >
                                                <LabelList
                                                    dataKey={
                                                        chartMetric === "temperature"
                                                            ? "tempMin"
                                                            : chartMetric === "wind"
                                                                ? "windMin"
                                                                : "uvMin"
                                                    }
                                                    position="bottom"
                                                    offset={8}
                                                    fill="#475569"
                                                    fontSize={11}
                                                    fontWeight={600}
                                                    formatter={(label) =>
                                                        chartMetric === "uv"
                                                            ? `${FormattingHelper.UvIndex(Number(label))} ${LanguagesHelper.Caption("UV")}`
                                                            : chartMetric === "temperature"
                                                                ? `${Math.round(Number(label))}°${tempUnitSuffix}`
                                                                : `${Math.round(Number(label))} ${windSpeedUnit}`
                                                    }
                                                />
                                            </Line>
                                        </>
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        {chartScrollNarrowLayout && chartNeedsHorizontalScroll ? (
                            <div className="navigator">
                                <div className="grid">
                                    <div>
                                        <button
                                            type="button"
                                            className="btn arrow"
                                            onClick={() => chartScrollByPage(-1)}
                                        >
                                            <ChevronLeft aria-hidden size={20} strokeWidth={2} />
                                        </button>
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            className="btn arrow"
                                            onClick={() => chartScrollByPage(1)}
                                        >
                                            <ChevronRight aria-hidden size={20} strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>
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
    );
}
