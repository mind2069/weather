import * as OpenMeteoTypes from '@/services/open-meteo/types';
import { ServiceClient } from '@/scripts/services/client';

export class WeatherServiceClient
{
    public static async Forecast( parameters: OpenMeteoTypes.OpenMeteoForecastParameters ): Promise<OpenMeteoTypes.OpenMeteoForecastResponse>
    {
        return ServiceClient.Execute<OpenMeteoTypes.OpenMeteoForecastResponse>(
            '/api/open-meteo/forecast',
            parameters,
            'Failed to get open meteo forecast',
            'a3b5c8',
        );
    }

    public static async Day( parameters: OpenMeteoTypes.OpenMeteoDayParameters ): Promise<OpenMeteoTypes.OpenMeteoDayResponse>
    {
        return ServiceClient.Execute<OpenMeteoTypes.OpenMeteoDayResponse>(
            '/api/open-meteo/day',
            parameters,
            'Failed to get open meteo day',
            'tfg21W',
        );
    }
}

