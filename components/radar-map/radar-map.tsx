"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type * as Leaflet from "leaflet";
import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import type { Session } from "@/scripts/types/session";
import { RainViewerServiceClient } from "@/services/rainviewer/client";
import type { RainViewerRadar } from "@/services/rainviewer/types";
import "leaflet/dist/leaflet.css";
import "./styles.css";
import "./styles-responsive.css";

interface ComponentProperties
{
    session: Session;
}

export default function RadarMap({ session }: ComponentProperties)
{
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<Leaflet.Map | null>(null);
    const radarLayerRef = useRef<Leaflet.TileLayer | null>(null);
    const leafletRef = useRef<typeof Leaflet | null>(null);
    const [radar, setRadar] = useState<RainViewerRadar | null>(null);
    const [frameIndex, setFrameIndex] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const latitude = session.weather.location.latitude;
    const longitude = session.weather.location.longitude;
    const locale = session.user.locale;

    useEffect(() =>
    {
        let active = true;

        const load = async () =>
        {
            setLoading(true);
            setError("");

            const response = await RainViewerServiceClient.Radar({ session });

            if (!active)
            {
                return;
            }

            if (response.success && response.data?.frames.length)
            {
                setRadar(response.data);
                setFrameIndex(response.data.frames.length - 1);
            }
            else
            {
                setError(LanguagesHelper.Caption("CouldNotLoadRadar"));
            }

            setLoading(false);
        };

        void load();

        return () =>
        {
            active = false;
        };
    }, [session]);

    useEffect(() =>
    {
        let active = true;

        const initialize = async () =>
        {
            if (!containerRef.current || mapRef.current)
            {
                return;
            }

            const L = await import("leaflet");

            if (!active || !containerRef.current)
            {
                return;
            }

            leafletRef.current = L;

            const map = L.map(containerRef.current, {
                center: [latitude, longitude],
                zoom: 7,
                minZoom: 2,
                maxZoom: 7,
                zoomControl: true,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
                maxZoom: 19,
            }).addTo(map);

            L.circleMarker([latitude, longitude], {
                radius: 6,
                color: "#ffffff",
                weight: 2,
                fillColor: "#0369a1",
                fillOpacity: 1,
            }).addTo(map);

            mapRef.current = map;
            setMapReady(true);

            requestAnimationFrame(() => map.invalidateSize());
        };

        void initialize();

        return () =>
        {
            active = false;
            radarLayerRef.current = null;
            mapRef.current?.remove();
            mapRef.current = null;
            leafletRef.current = null;
        };
    }, [latitude, longitude]);

    useEffect(() =>
    {
        const map = mapRef.current;
        const L = leafletRef.current;
        const frame = radar?.frames[frameIndex];

        if (!mapReady || !map || !L || !radar || !frame)
        {
            return;
        }

        if (radarLayerRef.current)
        {
            map.removeLayer(radarLayerRef.current);
        }

        const tileUrl = `${radar.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
        const layer = L.tileLayer(tileUrl, {
            attribution: "Radar &copy; RainViewer",
            opacity: 0.72,
            maxZoom: 7,
            tileSize: 256,
        });

        layer.addTo(map);
        radarLayerRef.current = layer;
    }, [radar, frameIndex, mapReady]);

    useEffect(() =>
    {
        if (!playing || !radar || radar.frames.length < 2)
        {
            return;
        }

        const interval = window.setInterval(() =>
        {
            setFrameIndex((index) => (index + 1) % radar.frames.length);
        }, 700);

        return () => window.clearInterval(interval);
    }, [playing, radar]);

    const frame = radar?.frames[frameIndex];
    const frameTime = frame
        ? new Date(frame.time * 1000).toLocaleTimeString(locale, {
            hour: "numeric",
            minute: "2-digit",
        })
        : "";

    return (
        <section className="radar">
            <div className="container">
                <div className="radar-head">
                    <h2>{LanguagesHelper.Caption("Radar")}</h2>
                    <span className="radar-time">{frameTime}</span>
                </div>
                <div className="radar-map-shell">
                    <div ref={containerRef} className="radar-map" />
                    {loading ? (
                        <div className="radar-status">{LanguagesHelper.Caption("Loading")}</div>
                    ) : null}
                    {error ? <div className="radar-status">{error}</div> : null}
                </div>
                {radar && radar.frames.length > 1 ? (
                    <div className="radar-controls">
                        <button
                            type="button"
                            className="btn radar-play"
                            aria-label={playing
                                ? LanguagesHelper.Caption("Pause")
                                : LanguagesHelper.Caption("Play")}
                            onClick={() => setPlaying((value) => !value)}
                        >
                            {playing
                                ? <Pause aria-hidden size={18} />
                                : <Play aria-hidden size={18} />}
                        </button>
                        <input
                            type="range"
                            min={0}
                            max={radar.frames.length - 1}
                            step={1}
                            value={frameIndex}
                            aria-label={LanguagesHelper.Caption("RadarTime")}
                            onChange={(event) =>
                            {
                                setPlaying(false);
                                setFrameIndex(Number(event.target.value));
                            }}
                        />
                    </div>
                ) : null}
                <p className="radar-credit">
                    {LanguagesHelper.Caption("RadarData")}{" "}
                    <a href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">
                        RainViewer
                    </a>
                </p>
            </div>
        </section>
    );
}
