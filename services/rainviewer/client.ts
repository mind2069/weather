import { ServiceClient } from "@/scripts/services/client";
import type { RainViewerRadarParameters, RainViewerRadarResponse } from "./types";

export class RainViewerServiceClient
{
    public static async Radar(parameters: RainViewerRadarParameters): Promise<RainViewerRadarResponse>
    {
        return ServiceClient.Execute<RainViewerRadarResponse>(
            "/api/rainviewer/radar",
            parameters,
            "Failed to get weather radar",
            "rvRadar1",
        );
    }
}
