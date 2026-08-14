import { NextRequest } from "next/server";
import { ErrorHandler } from "@/scripts/errors/handler";
import { RainViewerServiceServer } from "@/services/rainviewer/server";
import type { RainViewerRadarParameters, RainViewerRadarResponse } from "@/services/rainviewer/types";

export async function POST(request: NextRequest)
{
    return ErrorHandler.ApiRoute<RainViewerRadarResponse>(
        request,
        {
            category: "RainViewerRadar",
            code: "rvRadarApi1",
            title: "RainViewer radar failed API",
            message: "An error occurred while loading weather radar",
        },
        async (req) =>
        {
            const parameters: RainViewerRadarParameters = await req.json();

            return RainViewerServiceServer.Radar(parameters);
        }
    );
}
