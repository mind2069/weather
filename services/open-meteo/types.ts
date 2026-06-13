import { OpenMeteoForecast, OpenMeteoDay } from "@/scripts/types/open-meteo";
import { Session } from "@/scripts/types/session";

export interface OpenMeteoForecastParameters
{
    session: Session;
    days: number;
}

export interface OpenMeteoForecastResponse
{
    success: boolean;
    data: OpenMeteoForecast | null;
    codes: string[];
    message: string;
}

export interface OpenMeteoDayParameters
{
    session: Session;
    date: string;
}

export interface OpenMeteoDayResponse
{
    success: boolean;
    data: OpenMeteoDay | null;
    codes: string[];
    message: string;
    cached: boolean;
}