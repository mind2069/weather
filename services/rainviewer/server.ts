import { unstable_cache } from "next/cache";
import type {
    RainViewerRadar,
    RainViewerRadarFrame,
    RainViewerRadarParameters,
    RainViewerRadarResponse,
} from "./types";

interface RainViewerManifest
{
    host?: unknown;
    radar?: {
        past?: unknown;
    };
}

export class RainViewerServiceServer
{
    public static async Radar(parameters: RainViewerRadarParameters): Promise<RainViewerRadarResponse>
    {
        void parameters;

        return unstable_cache(
            async () => RainViewerServiceServer.RadarUncached(),
            ["rainviewer-radar-1.0"],
            { revalidate: 300 }
        )();
    }

    private static async RadarUncached(): Promise<RainViewerRadarResponse>
    {
        try
        {
            const response = await fetch(
                "https://api.rainviewer.com/public/weather-maps.json",
                { signal: AbortSignal.timeout(5000) }
            );

            if (!response.ok)
            {
                return {
                    success: false,
                    data: null,
                    codes: ["RainViewerError"],
                    message: response.statusText || "RainViewer request failed",
                };
            }

            const manifest = await response.json() as RainViewerManifest;
            const host = typeof manifest.host === "string" ? manifest.host : "";
            const past = Array.isArray(manifest.radar?.past) ? manifest.radar.past : [];
            const frames: RainViewerRadarFrame[] = past
                .filter((frame): frame is RainViewerRadarFrame =>
                    typeof frame === "object" &&
                    frame !== null &&
                    typeof (frame as RainViewerRadarFrame).time === "number" &&
                    typeof (frame as RainViewerRadarFrame).path === "string"
                )
                .map((frame) => ({ time: frame.time, path: frame.path }));

            if (!host.startsWith("https://") || frames.length === 0)
            {
                return {
                    success: false,
                    data: null,
                    codes: ["RainViewerInvalidData"],
                    message: "RainViewer returned no radar frames",
                };
            }

            const data: RainViewerRadar = { host, frames };

            return {
                success: true,
                data,
                codes: ["Success"],
                message: "RainViewer radar successful",
            };
        }
        catch (error)
        {
            return {
                success: false,
                data: null,
                codes: ["RainViewerError"],
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
