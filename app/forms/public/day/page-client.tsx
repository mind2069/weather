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
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { EffectiveDayDate, type DayRouteKind } from "./resolve-route";
import { CookiesHelper } from "@/scripts/helpers/cookies";

interface DayHourlyChartRow
{
    label: string;
    time: string;
    hourTop: string;
    hourBottom: string;
    icon: string;
    isCurrent: boolean;
    columnAnchor: number;
    temperature: number;
    precipitation: number;
    windSpeed: number;
    humidity: number;
    uvIndex: number;
}

type ChartMetric = "temperature" | "precipitation" | "wind" | "humidity" | "uv";

type ChartMetricDataKey = "temperature" | "precipitation" | "windSpeed" | "humidity" | "uvIndex";

interface ChartSpanYDomainOptions
{
    minClamp?: number;
    maxClamp?: number;
    iconBandFloor?: number;
    flatDisplayHeadroom?: number;
}

const ICON_BAND_TARGET_FRACTION = 0.18;

function IconBandPadding(domainTop: number, minPadding: number, targetFraction = ICON_BAND_TARGET_FRACTION): number
{
    const safeTop = Math.max(domainTop, minPadding * 2);
    const scaled = (targetFraction * safeTop) / (1 - targetFraction);

    return Math.max(minPadding, scaled);
}

function ZeroBandYDomain(vals: number[]): [number, number]
{
    return ChartSpanYDomain(vals, 0.5, 0.5,
    {
        minClamp: 0,
        iconBandFloor: 1.25,
        flatDisplayHeadroom: 8,
    });
}

function HumidityYDomain(vals: number[]): [number, number]
{
    if (vals.length === 0)
    {
        return [0, 100];
    }

    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const epsilon = 0.001;
    const topHeadroom = 8;
    const minDisplaySpan = 30;

    if (hi - lo < epsilon)
    {
        const padding = IconBandPadding(20 + topHeadroom, 2.5);

        return [lo - padding, lo + 20 + topHeadroom];
    }

    const span = Math.max(8, hi - lo);
    const topPad = Math.max(topHeadroom, span * 0.08);
    const bottomPad = lo <= 0.5
        ? IconBandPadding(hi + topPad - lo, 2.5)
        : Math.min(20, Math.max(4, span * 0.2));

    let domainMin = lo <= 0.5 ? lo - bottomPad : Math.max(0, lo - bottomPad);
    let domainMax = hi + topPad;

    if (domainMax - domainMin < minDisplaySpan)
    {
        domainMin = domainMax - minDisplaySpan;
    }

    return [domainMin, domainMax];
}

function ChartSpanYDomain(
    vals: number[],
    flatSpan: number,
    minSpan: number,
    options?: ChartSpanYDomainOptions,
): [number, number]
{
    if (vals.length === 0)
    {
        return [0, 1];
    }

    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const epsilon = 0.001;
    const iconFloor = options?.iconBandFloor ?? 0;
    const flatHeadroom = options?.flatDisplayHeadroom ?? flatSpan;
    const minClamp = options?.minClamp;
    const touchesIconBand = minClamp != null && iconFloor > 0 && lo <= minClamp + 0.5;

    if (hi - lo < epsilon)
    {
        if (iconFloor > 0)
        {
            let domainMax = lo + flatHeadroom;

            if (options?.maxClamp != null)
            {
                domainMax = Math.min(options.maxClamp, domainMax);
            }

            const padding = IconBandPadding(domainMax - lo, iconFloor);

            return [lo - padding, domainMax];
        }

        const span = Math.max(flatSpan, minSpan);
        let domainMax = lo + span;

        if (options?.maxClamp != null)
        {
            domainMax = Math.min(options.maxClamp, domainMax);
        }

        return [lo, domainMax];
    }

    const span = Math.max(minSpan, hi - lo);
    const topPad = Math.max(flatSpan * 0.5, span * 0.12);
    let domainMax = hi + topPad;
    const bottomPad = touchesIconBand
        ? IconBandPadding(domainMax - lo, iconFloor)
        : lo > (minClamp ?? 0) + epsilon
            ? Math.min(lo * 0.12, span * 0.18)
            : 0;

    let domainMin = lo - bottomPad;

    if (options?.maxClamp != null)
    {
        domainMax = Math.min(options.maxClamp, domainMax);
    }

    if (domainMax <= domainMin)
    {
        domainMax = domainMin + flatSpan;
    }

    return [domainMin, domainMax];
}

function ChartMetricDataKey(metric: ChartMetric): ChartMetricDataKey
{
    switch (metric)
    {
        case "precipitation": return "precipitation";
        case "wind": return "windSpeed";
        case "humidity": return "humidity";
        case "uv": return "uvIndex";
        default: return "temperature";
    }
}

function IsCurrentHourSlot(isoTime: string, dayIso: string): boolean
{
    const today = FormattingHelper.IsoDateLocal(new Date());

    if (dayIso !== today)
    {
        return false;
    }

    const slot = new Date(isoTime);
    const now = new Date();

    if (Number.isNaN(slot.getTime()))
    {
        return false;
    }

    return (
        slot.getFullYear() === now.getFullYear() &&
        slot.getMonth() === now.getMonth() &&
        slot.getDate() === now.getDate() &&
        slot.getHours() === now.getHours()
    );
}

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
        hour12: true,

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

    const top = hour && minute ? `${hour}:${minute}` : hour || FormattingHelper.LocalTime(iso, locale);

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
        <g className={row.isCurrent ? "chart-hourly-column current" : "chart-hourly-column"}>
            <rect
                x={innerX}
                y={pb.y}
                width={innerW}
                height={pb.height}
                rx={10}
                ry={10}
                fill={row.isCurrent ? "#efefef" : "url(#dayHourlyColumnWash)"}
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
    kind: DayRouteKind;
}

export default function Client({ session, date, kind }: ClientProperties)
{
    LanguagesHelper.Initialize(session.language.code);

    const pageReady = useRef(Boolean(false));        
    const locale = session.user.locale;
    const effectiveDate = useMemo(() => EffectiveDayDate(kind, date), [kind, date]);
    const windSpeedUnit = session.user.unit === "imperial" ? "mph" : "km/h";
    const windSpeedUnitDisplay = session.user.unit === "imperial" ? "MPH" : "KM/H";
    const tempUnitSuffix = session.user.unit === "imperial" ? "F" : "C";
    const [day, setDay] = useState<DayNormalized | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartMetric, setChartMetric] = useState<ChartMetric>("temperature");
    const [chartActionsOpen, setChartActionsOpen] = useState(false);
    const chartScrollRef = useRef<HTMLDivElement>(null);
    const [chartScrollNarrowLayout, setChartScrollNarrowLayout] = useState(false);
    const [chartNeedsHorizontalScroll, setChartNeedsHorizontalScroll] = useState(false);

    useEffect(() =>
    {
        if (pageReady.current === false)
        {
            pageReady.current = true;

            void Load();
        }
        
    }, [effectiveDate]);

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
    
    const Load = async () =>
    {
        setLoading(true);
        setError(null);

        console.log(session.user.location.name);

        const parametersDay: OpenMeteoDayParameters =
        {
            session: session,
            date: effectiveDate,
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

    const hourlyNormalized: HourlyNormalized[] = day?.hourly ?? [];

    const ChartMetricLabel = useMemo(() => 
    {
        switch (chartMetric)
        {
            case "temperature": return "Temperature";
            case "precipitation": return "Precipitation";
            case "wind": return "Wind";
            case "humidity": return "Humidity";
            case "uv": return "UVIndex";
            default: return "Temperature";
        }

    }, [chartMetric]);

    const selectChartMetric = useCallback((metric: ChartMetric) =>
    {
        setChartMetric(metric);
        setChartActionsOpen(false);
    }, []);

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
                    isCurrent: IsCurrentHourSlot(item.time, effectiveDate),
                    columnAnchor: 1,
                    temperature: item.temperature,
                    precipitation: item.precipitation,
                    windSpeed: item.windSpeed,
                    humidity: item.humidity,
                    uvIndex: item.uvIndex,
                };
            }),

        [hourlyNormalized, locale, effectiveDate],
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

    const precipitationYDomain = useMemo((): [number, number] =>
    {
        const vals = chartData.map((d) => d.precipitation);

        return ZeroBandYDomain(vals);

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

    const humidityYDomain = useMemo((): [number, number] =>
    {
        const vals = chartData.map((d) => d.humidity);

        return HumidityYDomain(vals);

    }, [chartData]);

    const uvYDomain = useMemo((): [number, number] =>
    {
        const vals = chartData.map((d) => d.uvIndex);

        return ZeroBandYDomain(vals);

    }, [chartData]);

    const chartYDomain = useMemo((): [number, number] =>
    {
        switch (chartMetric)
        {
            case "temperature": return temperatureYDomain;
            case "precipitation": return precipitationYDomain;
            case "wind": return windYDomain;
            case "humidity": return humidityYDomain;
            case "uv": return uvYDomain;
            default: return temperatureYDomain;
        }

    }, [chartMetric, temperatureYDomain, precipitationYDomain, windYDomain, humidityYDomain, uvYDomain]);

    const formatChartMetricLabel = useCallback((metric: ChartMetric, value: number): string =>
    {
        switch (metric)
        {
            case "precipitation":
                return `${value.toFixed(1)} mm`;
            case "wind":
                return `${Math.round(value)} ${windSpeedUnitDisplay}`;
            case "humidity":
                return `${Math.round(value)}%`;
            case "uv":
                return `${FormattingHelper.UvIndex(value)} ${LanguagesHelper.Caption("UV")}`;
            default:
                return `${Math.round(value)}°${tempUnitSuffix}`;
        }
    }, [tempUnitSuffix, windSpeedUnitDisplay]);

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
                                                <div className="item precipitation">
                                                    <span className="label">
                                                        {LanguagesHelper.Caption("Precipitation")}
                                                    </span>
                                                    <span className="value">
                                                        {day.highlights.precipitation.toFixed(1)} mm
                                                    </span>
                                                </div>
                                                <div className="item wind">
                                                    <span className="label">
                                                        {LanguagesHelper.Caption("Wind")}
                                                    </span>
                                                    <span className="value">
                                                        {Math.round(day.highlights.windSpeed)} {windSpeedUnit}
                                                    </span>
                                                </div>
                                                <div className="item humidity">
                                                    <span className="label">
                                                        {LanguagesHelper.Caption("Humidity")}
                                                    </span>
                                                    <span className="value">
                                                        {Math.round(day.highlights.humidity)}%
                                                    </span>
                                                </div>
                                                <div className="item uv">
                                                    <span className="label">
                                                        {LanguagesHelper.Caption("UV")}
                                                    </span>
                                                    <span className="value">
                                                        {FormattingHelper.UvIndex(day.highlights.uvIndex)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="summary">
                                    <div className="content">
                                        <div className="item">
                                            <div className="name">
                                                {LanguagesHelper.Caption("Temperature")}
                                            </div>
                                            <div className="values">
                                                <div className="row">
                                                    <span className="label">
                                                        {LanguagesHelper.Caption("Minimum")}
                                                    </span>
                                                    <span className="value">
                                                        {Math.round(day.tempMin)}°{tempUnitSuffix}
                                                    </span>
                                                </div>
                                                <div className="row">
                                                    <span className="label">
                                                        {LanguagesHelper.Caption("Maximum")}
                                                    </span>
                                                    <span className="value">
                                                        {Math.round(day.tempMax)}°{tempUnitSuffix}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item">
                                            <div className="name">
                                                {LanguagesHelper.Caption("Precipitation")}
                                            </div>
                                            <div className="values">
                                                <div className="row">
                                                    <span className="label">
                                                        {LanguagesHelper.Caption("Minimum")}
                                                    </span>
                                                    <span className="value">
                                                        {Math.round(day.precipitationMin)} mm
                                                    </span>
                                                </div>
                                                <div className="row">
                                                    <span className="label">
                                                        {LanguagesHelper.Caption("Maximum")}
                                                    </span>
                                                    <span className="value">
                                                        {Math.round(day.precipitationMax)} mm
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item">
                                            <div className="name">
                                                {LanguagesHelper.Caption("Wind")}
                                            </div>
                                            <div className="values">
                                                <div className="row">
                                                    <span className="label">
                                                        {LanguagesHelper.Caption("Minimum")}
                                                    </span>
                                                    <span className="value">
                                                    {Math.round(day.windMin)} {windSpeedUnitDisplay}
                                                    </span>
                                                </div>
                                                <div className="row">
                                                    <span className="label">
                                                        {LanguagesHelper.Caption("Maximum")}
                                                    </span>
                                                    <span className="value end">
                                                        {Math.round(day.windMax)}
                                                        {windSpeedUnitDisplay}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item">
                                            <div className="name">
                                                {LanguagesHelper.Caption("Humidity")}
                                            </div>
                                            <div className="values">
                                                <div className="row">
                                                    <span className="label">
                                                        {LanguagesHelper.Caption("Minimum")}
                                                    </span>
                                                    <span className="value">
                                                     {Math.round(day.humidityMin)} %
                                                    </span>
                                                </div>
                                                <div className="row">
                                                    <span className="label">
                                                        {LanguagesHelper.Caption("Maximum")}
                                                    </span>
                                                    <span className="value end">
                                                        {Math.round(day.humidityMax)} %
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item">
                                            <div className="name">
                                                {LanguagesHelper.Caption("UVIndex")}
                                            </div>
                                            <div className="values">
                                                <div className="row">
                                                    <span className="label">
                                                        {LanguagesHelper.Caption("Minimum")}
                                                    </span>
                                                    <span className="value">
                                                        {FormattingHelper.UvIndex(day.uvMin)}
                                                    </span>
                                                </div>
                                                <div className="row">
                                                    <span className="label">
                                                        {LanguagesHelper.Caption("Maximum")}
                                                    </span>
                                                    <span className="value end">
                                                        {FormattingHelper.UvIndex(day.uvMax)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item">
                                            <div className="name">
                                                {LanguagesHelper.Caption("Sun")}
                                            </div>
                                            <div className="values">
                                                <div className="row">
                                                    <span className="label">
                                                        {LanguagesHelper.Caption("Rise")}
                                                    </span>
                                                    <span className="value">
                                                        {day.sunrise ? FormattingHelper.LocalTime(day.sunrise, locale) : "-"}
                                                    </span>
                                                </div>
                                                <div className="row">
                                                    <span className="label">
                                                        {LanguagesHelper.Caption("Set")}
                                                    </span>
                                                    <span className="value">
                                                        {day.sunset ? FormattingHelper.LocalTime(day.sunset, locale) : "-"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="hours">
                                {hourlyNormalized.map((item) => (
                                    <article
                                        className={IsCurrentHourSlot(item.time, effectiveDate) ? "hour current" : "hour"}
                                        key={item.time}
                                    >
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
                                                        <span className="long">
                                                            {LanguagesHelper.Caption("Precipitation")}
                                                        </span>
                                                        <span className="short">
                                                            {LanguagesHelper.Caption("Precip")}
                                                        </span>
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
                                                bottom: chartMetric === "uv" || chartMetric === "precipitation" || chartMetric === "humidity" ? 17 : 4,
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
                                                dataKey="columnAnchor"
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
                                                domain={chartYDomain}
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
                                                                {(() =>
                                                                {
                                                                    const value = row[ChartMetricDataKey(chartMetric)];

                                                                    if (chartMetric === "precipitation")
                                                                    {
                                                                        return (
                                                                            <>
                                                                                <span className="chart-tooltip-strong">
                                                                                    {value.toFixed(1)}
                                                                                </span>
                                                                                <span className="chart-tooltip-muted">
                                                                                    {" "}
                                                                                    mm
                                                                                </span>
                                                                            </>
                                                                        );
                                                                    }

                                                                    if (chartMetric === "wind")
                                                                    {
                                                                        return (
                                                                            <>
                                                                                <span className="chart-tooltip-strong">
                                                                                    {Math.round(value)}
                                                                                </span>
                                                                                <span className="chart-tooltip-muted">
                                                                                    {" "}
                                                                                    {windSpeedUnitDisplay}
                                                                                </span>
                                                                            </>
                                                                        );
                                                                    }

                                                                    if (chartMetric === "humidity")
                                                                    {
                                                                        return (
                                                                            <>
                                                                                <span className="chart-tooltip-strong">
                                                                                    {Math.round(value)}
                                                                                </span>
                                                                                <span className="chart-tooltip-muted">
                                                                                    %
                                                                                </span>
                                                                            </>
                                                                        );
                                                                    }

                                                                    if (chartMetric === "uv")
                                                                    {
                                                                        return (
                                                                            <>
                                                                                <span className="chart-tooltip-strong">
                                                                                    {FormattingHelper.UvIndex(value)}
                                                                                </span>
                                                                                <span className="chart-tooltip-muted">
                                                                                    {" "}
                                                                                    {LanguagesHelper.Caption("UV")}
                                                                                </span>
                                                                            </>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <>
                                                                            <span className="chart-tooltip-strong">
                                                                                {Math.round(value)}
                                                                            </span>
                                                                            <span className="chart-tooltip-muted">
                                                                                °{tempUnitSuffix}
                                                                            </span>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </p>
                                                        </div>
                                                    );
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey={ChartMetricDataKey(chartMetric)}
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
                                                    dataKey={ChartMetricDataKey(chartMetric)}
                                                    position="top"
                                                    offset={8}
                                                    fill="#334155"
                                                    fontSize={11}
                                                    fontWeight={600}
                                                    formatter={(label) =>
                                                        formatChartMetricLabel(chartMetric, Number(label))
                                                    }
                                                />
                                            </Line>
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
                                <div className="toggle">
                                    <button
                                        type="button"
                                        className="btn"
                                        aria-expanded={chartActionsOpen}
                                        onClick={() => setChartActionsOpen((open) => !open)}
                                    >
                                        <span>
                                            {LanguagesHelper.Caption(ChartMetricLabel)}
                                        </span>
                                        <span className="icon">
                                            <ChevronDown aria-hidden size={20} strokeWidth={2} />
                                        </span>
                                    </button>
                                </div>
                                <div className={chartActionsOpen ? "grid show" : "grid"}>
                                    <div>
                                        <button
                                            type="button"
                                            className={chartMetric === "temperature"? "btn btn-brand": "btn"}
                                            onClick={() => selectChartMetric("temperature")}
                                        >
                                            {LanguagesHelper.Caption("Temperature")}
                                        </button>
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            className={chartMetric === "precipitation"? "btn btn-brand": "btn"}
                                            onClick={() => selectChartMetric("precipitation")}
                                        >
                                            {LanguagesHelper.Caption("Precipitation")}
                                        </button>
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            className={chartMetric === "wind"? "btn btn-brand": "btn"}
                                            onClick={() => selectChartMetric("wind")}
                                        >
                                            {LanguagesHelper.Caption("Wind")}
                                        </button>
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            className={chartMetric === "humidity"? "btn btn-brand": "btn"}
                                            onClick={() => selectChartMetric("humidity")}
                                        >
                                            {LanguagesHelper.Caption("Humidity")}
                                        </button>
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            className={chartMetric === "uv"? "btn btn-brand": "btn"}
                                            onClick={() => selectChartMetric("uv")}
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
