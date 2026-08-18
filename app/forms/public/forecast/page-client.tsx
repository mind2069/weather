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
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { WindHelper } from "@/scripts/helpers/wind";
import { ForecastDaysFromRange } from "./resolve-route";

interface ClientProperties
{
    session: Session;
    dateStart: string;
    dateEnd: string;
    page: string;
}

interface ForecastChartRow
{
    label: string;
    date: string;
    weekdayLine: string;
    dateLine: string;
    icon: string;
    columnAnchor: number;
    tempMin: number;
    tempMax: number;
    tempRange: [number, number];
    windMin: number;
    windMax: number;
    windRange: [number, number];
    uvMin: number;
    uvMax: number;
    uvRange: [number, number];
    uvMinPlot: number;
    uvRangePlot: [number, number];
    precipitation: number;
    humidityMin: number;
    humidityMax: number;
    humidityRange: [number, number];
}

type ChartMetric = "temperature" | "precipitation" | "wind" | "humidity" | "uv";

type ForecastRangeMetric = "temperature" | "wind" | "humidity" | "uv";

interface ChartSpanYDomainOptions
{
    minClamp?: number;
    maxClamp?: number;
    iconBandFloor?: number;
    flatDisplayHeadroom?: number;
}

const ICON_BAND_TARGET_FRACTION = 0.18;

/** Raises the UV min line above the icon band (~219px plot height). */
const UV_MIN_LINE_RAISE = 0.13;

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

function IsRangeChartMetric(metric: ChartMetric): metric is ForecastRangeMetric
{
    return metric === "temperature" || metric === "wind" || metric === "humidity" || metric === "uv";
}

function ForecastRangeDataKey(metric: ForecastRangeMetric, part: "min" | "max" | "range"): keyof ForecastChartRow
{
    switch (metric)
    {
        case "temperature":
            return part === "min" ? "tempMin" : part === "max" ? "tempMax" : "tempRange";
        case "wind":
            return part === "min" ? "windMin" : part === "max" ? "windMax" : "windRange";
        case "humidity":
            return part === "min" ? "humidityMin" : part === "max" ? "humidityMax" : "humidityRange";
        case "uv":
            return part === "min" ? "uvMinPlot" : part === "max" ? "uvMax" : "uvRangePlot";
    }
}

function FormatForecastRangeLabel(metric: ForecastRangeMetric, value: number, tempUnitSuffix: string, windSpeedUnit: string): string
{
    switch (metric)
    {
        case "humidity":
            return `${Math.round(value)}%`;
        case "uv":
            return `${FormattingHelper.UvIndex(value)} ${LanguagesHelper.Caption("UV")}`;
        case "wind":
            return `${Math.round(value)} ${windSpeedUnit}`;
        default:
            return `${Math.round(value)}°${tempUnitSuffix}`;
    }
}

export default function Client({ session, dateStart, dateEnd, page }: ClientProperties)
{
    LanguagesHelper.Initialize(session.language.code);

    const locale = session.user.locale;
    const windSpeedUnit = session.user.unit === "imperial" ? "MPH" : "KM/H";
    const tempUnitSuffix = session.user.unit === "imperial" ? "F" : "C";
    const forecastDays = ForecastDaysFromRange(dateStart, dateEnd);
    const forecastTitleCaption =
        page === "7-days" || page === "7-jours" || forecastDays <= 7
            ? "Forecast7Days"
            : "Forecast14Days";
    const [forecast, setForecast] = useState<ForecastNormalized[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dayModalOpen, setDayModalOpen] = useState(false);
    const [dayModalLoading, setDayModalLoading] = useState(false);
    const [dayModalError, setDayModalError] = useState<string | null>(null);
    const [dayModalDay, setDayModalDay] = useState<ForecastNormalized | null>(null);
    const [dayModalForecast, setDayModalForecast] = useState<DayNormalized | null>(null);
    const [chartMetric, setChartMetric] = useState<ChartMetric>("temperature");
    const [chartActionsOpen, setChartActionsOpen] = useState(false);
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
            dateStart: dateStart,
            dateEnd: dateEnd,
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

    const forecastNormalized: ForecastNormalized[] = useMemo(() =>
    {
        const items = forecast ?? [];

        return items.filter((item) => item.date >= dateStart && item.date <= dateEnd);
    }, [forecast, dateStart, dateEnd]);

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
                    columnAnchor: 1,
                    tempMin: item.tempMin,
                    tempMax: item.tempMax,
                    tempRange: [item.tempMin, item.tempMax],
                    windMin: item.windMin,
                    windMax: item.windMax,
                    windRange: [item.windMin, item.windMax],
                    uvMin: item.uvMin,
                    uvMax: item.uvMax,
                    uvRange: [item.uvMin, item.uvMax] as [number, number],
                    uvMinPlot: item.uvMin + UV_MIN_LINE_RAISE,
                    uvRangePlot: [item.uvMin + UV_MIN_LINE_RAISE, item.uvMax] as [number, number],
                    precipitation: item.precipitation,
                    humidityMin: item.humidityMin,
                    humidityMax: item.humidityMax,
                    humidityRange: [item.humidityMin, item.humidityMax],
                };
            }),

        [forecastNormalized, locale],
    );

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

    const precipitationYDomain = useMemo((): [number, number] =>
    {
        const vals = chartData.map((d) => d.precipitation);

        return ZeroBandYDomain(vals);
    }, [chartData]);

    const humidityYDomain = useMemo((): [number, number] =>
    {
        const vals = chartData.flatMap((d) => [d.humidityMin, d.humidityMax]);

        return HumidityYDomain(vals);
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
                return `${Math.round(value)} ${windSpeedUnit}`;
            case "humidity":
                return `${Math.round(value)}%`;
            case "uv":
                return `${FormattingHelper.UvIndex(value)} ${LanguagesHelper.Caption("UV")}`;
            default:
                return `${Math.round(value)}°${tempUnitSuffix}`;
        }
    }, [tempUnitSuffix, windSpeedUnit]);

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
                                {LanguagesHelper.Caption(forecastTitleCaption)}
                            </span>
                            <span className="dates">
                                <span>
                                    {FormattingHelper.TextLong(dateStart, locale)}
                                </span>
                                <span>
                                    {LanguagesHelper.Caption("To").toLocaleLowerCase()}{" "}
                                </span>
                                <span>
                                    {FormattingHelper.TextLong(dateEnd, locale)}
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
                                                    <div className="statistic low">
                                                        <div className="label">
                                                            {LanguagesHelper.Caption("Low")}
                                                        </div>
                                                        <div className="value">
                                                            {Math.round(item.tempMin)}°{tempUnitSuffix}
                                                        </div>
                                                    </div>
                                                    <div className="statistic high">
                                                        <div className="label">
                                                            {LanguagesHelper.Caption("High")}
                                                        </div>
                                                        <div className="value">
                                                            {Math.round(item.tempMax)}°{tempUnitSuffix}
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
                                                    <div className="meta rain">
                                                        <div className="label">
                                                            <span className="long">
                                                                {LanguagesHelper.Caption("RainProbability")}
                                                            </span>
                                                            <span className="short">
                                                                {LanguagesHelper.Caption("RainProb")}
                                                            </span>
                                                        </div>
                                                        <div className="value">
                                                            {item.rainProbability}%
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
                                                    <div className="meta wind">
                                                        <div className="label">
                                                            {LanguagesHelper.Caption("Wind")}
                                                        </div>
                                                        <div className="value">
                                                            {Math.round(item.windMax)}{" "}{windSpeedUnit}
                                                        </div>
                                                    </div>
                                                    <div className="meta direction">
                                                        <div className="label">
                                                            <span className="long">
                                                                {LanguagesHelper.Caption("Direction")}
                                                            </span>
                                                            <span className="short">
                                                                {LanguagesHelper.Caption("Dir")}
                                                            </span>
                                                        </div>
                                                        <div className="value">
                                                            {LanguagesHelper.Caption(WindHelper.Caption(item.windDirection))}
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
                                            bottom: chartMetric === "uv" || chartMetric === "precipitation" ? 17 : 4,
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
                                            dataKey="columnAnchor"
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
                                            domain={chartYDomain}
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

                                                if (chartMetric === "precipitation")
                                                {
                                                    return (
                                                        <div className="chart-tooltip">
                                                            <p className="chart-tooltip-title">
                                                                {label}
                                                            </p>
                                                            <p className="chart-tooltip-metric chart-tooltip-metric--spaced">
                                                                <span className="chart-tooltip-value">
                                                                    {row.precipitation.toFixed(1)} mm
                                                                </span>
                                                            </p>
                                                        </div>
                                                    );
                                                }

                                                if (chartMetric === "humidity")
                                                {
                                                    return (
                                                        <div className="chart-tooltip">
                                                            <p className="chart-tooltip-title">
                                                                {label}
                                                            </p>
                                                            <p className="chart-tooltip-metric chart-tooltip-metric--spaced">
                                                                {LanguagesHelper.Caption("High")}:{" "}
                                                                <span className="chart-tooltip-value">
                                                                    {Math.round(row.humidityMax)}%
                                                                </span>
                                                            </p>
                                                            <p className="chart-tooltip-metric">
                                                                {LanguagesHelper.Caption("Low")}:{" "}
                                                                <span className="chart-tooltip-value">
                                                                    {Math.round(row.humidityMin)}%
                                                                </span>
                                                            </p>
                                                        </div>
                                                    );
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
                                        {IsRangeChartMetric(chartMetric) ? (
                                            <>
                                                <Area
                                                    type="monotone"
                                                    dataKey={ForecastRangeDataKey(chartMetric, "range")}
                                                    stroke="none"
                                                    fill="url(#forecastTempBand)"
                                                    isAnimationActive={true}
                                                    legendType="none"
                                                    zIndex={40}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey={ForecastRangeDataKey(chartMetric, "max")}
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
                                                        dataKey={ForecastRangeDataKey(chartMetric, "max")}
                                                        position="top"
                                                        offset={6}
                                                        fill="#334155"
                                                        fontSize={11}
                                                        fontWeight={600}
                                                        formatter={(label) =>
                                                            FormatForecastRangeLabel(chartMetric, Number(label), tempUnitSuffix, windSpeedUnit)
                                                        }
                                                    />
                                                </Line>
                                                <Line
                                                    type="monotone"
                                                    dataKey={ForecastRangeDataKey(chartMetric, "min")}
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
                                                        dataKey={ForecastRangeDataKey(chartMetric, "min")}
                                                        position="bottom"
                                                        offset={chartMetric === "uv" ? 8 : 8}
                                                        fill="#475569"
                                                        fontSize={11}
                                                        fontWeight={600}
                                                        formatter={(label) =>
                                                        {
                                                            const value = chartMetric === "uv"
                                                                ? Number(label) - UV_MIN_LINE_RAISE
                                                                : Number(label);

                                                            return FormatForecastRangeLabel(chartMetric, value, tempUnitSuffix, windSpeedUnit);
                                                        }}
                                                    />
                                                </Line>
                                            </>
                                        ) : (
                                            <Line
                                                type="monotone"
                                                dataKey="precipitation"
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
                                                    dataKey="precipitation"
                                                    position="top"
                                                    offset={8}
                                                    fill="#334155"
                                                    fontSize={11}
                                                    fontWeight={600}
                                                    formatter={(label) =>
                                                        formatChartMetricLabel("precipitation", Number(label))
                                                    }
                                                />
                                            </Line>
                                        )}
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
                            <div className={chartActionsOpen ? "metrics show" : "metrics"}>
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
    );
}
