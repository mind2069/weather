import { Session } from "@/scripts/types/session";

export interface RainViewerRadarParameters
{
    session: Session;
}

export interface RainViewerRadarFrame
{
    time: number;
    path: string;
}

export interface RainViewerRadar
{
    host: string;
    frames: RainViewerRadarFrame[];
}

export interface RainViewerRadarResponse
{
    success: boolean;
    data: RainViewerRadar | null;
    codes: string[];
    message: string;
}
