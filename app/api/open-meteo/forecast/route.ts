import { NextRequest } from 'next/server';
import { OpenMeteoForecastParameters, OpenMeteoForecastResponse } from '@/services/open-meteo/types';
import { OpenMeteoServiceServer } from '@/services/open-meteo/server';
import { ErrorHandler } from '@/scripts/errors/handler';

export async function POST(request: NextRequest) 
{
    return ErrorHandler.ApiRoute<OpenMeteoForecastResponse>(
        request,
        {
            category: 'OpenMeteoForecast',
            code: 'a3b5c8',
            title: 'Open meteo forecast failed API',
            message: 'An error occurred during open meteo forecast',
        },
        async (req) => 
        {
            const parameters: OpenMeteoForecastParameters = await req.json();

            return await OpenMeteoServiceServer.Forecast(parameters);
        }
    );
}
