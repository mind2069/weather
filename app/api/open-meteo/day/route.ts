import { NextRequest } from 'next/server';
import { OpenMeteoDayParameters, OpenMeteoDayResponse } from '@/services/open-meteo/types';
import { OpenMeteoServiceServer } from '@/services/open-meteo/server';
import { ErrorHandler } from '@/scripts/errors/handler';

export async function POST(request: NextRequest) 
{
    return ErrorHandler.ApiRoute<OpenMeteoDayResponse>(
        request,
        {
            category: 'OpenMeteoDay',
            code: 'tfg654',
            title: 'Open meteo day failed API',
            message: 'An error occurred during open meteo day',
        },
        async (req) => 
        {
            const parameters: OpenMeteoDayParameters = await req.json();

            return await OpenMeteoServiceServer.Day(parameters);
        }
    );
}
