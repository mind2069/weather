export interface OpenMeteoForecast
{
    latitude: number;
    longitude: number;
    timezone: string; 
    daily_units: 
    {
        time: string;
        temperature_2m_max: string;
        temperature_2m_min: string;
        uv_index_max: string;
        uv_index_clear_sky_max: string;
        wind_speed_10m_max: string;
        wind_speed_10m_min: string;
        wind_direction_10m_dominant?: string;
        weather_code: string;
        sunrise: string;
        sunset: string;
        precipitation_probability_max?: string;
        precipitation_sum?: string;
        relative_humidity_2m_mean?: string;
    };
    daily: 
    {
        time: string[];     
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        uv_index_max: number[];
        uv_index_clear_sky_max: number[];
        wind_speed_10m_max: number[];
        wind_speed_10m_min: number[];
        wind_direction_10m_dominant?: number[];
        weather_code: number[];
        sunrise: string[];
        sunset: string[];
        precipitation_probability_max?: number[];
        precipitation_sum?: number[];
        relative_humidity_2m_mean?: number[];
    };
    hourly_units?:
    {
        time: string;
        weather_code: string;
    };
    hourly?:
    {
        time: string[];
        weather_code: number[];
    };
}
export interface ForecastNormalized
{
    date: string;
    tempMin: number;
    tempMax: number;
    humidity: number;
    uvMin: number;
    uvMax: number;
    uvClearSkyMax: number;
    windMin: number;
    windMax: number;
    windDirection: number;
    rainProbability: number;
    precipitation: number;
    forecast: string;
    icon: string;
    severityForecast: string;
    severityIcon: string;
    sunrise: string;
    sunset: string;
}

export interface OpenMeteoDay
{
    latitude: number;
    longitude: number;
    timezone: string;
    hourly_units: 
    {
        time: string;
        temperature_2m: string;
        apparent_temperature: string;
        relative_humidity_2m: string;
        precipitation: string;
        precipitation_probability: string;
        wind_speed_10m: string;
        wind_direction_10m: string;
        uv_index: string;
        weather_code: string;
    };
    hourly: 
    {
        time: string[];
        temperature_2m: number[];
        apparent_temperature: number[];
        relative_humidity_2m: number[];
        precipitation: number[];
        precipitation_probability: number[];
        wind_speed_10m: number[];
        wind_direction_10m: number[];
        uv_index: number[];
        weather_code: number[];
    };
    daily_units?:
    {
        time?: string;
        sunrise?: string;
        sunset?: string;
        weather_code?: string;
    };
    daily:
    {
        time?: string[];
        sunrise: string[];
        sunset: string[];
        weather_code?: number[];
    };
}

export interface DayNormalized
{
    date: string; 
    sunrise: string;
    sunset: string;  
    tempMin: number;
    tempMax: number;
    windMin: number; 
    windMax: number; 
    windDirections: number[];
    uvMin: number;  
    uvMax: number;
    humidityMin: number;
    humidityMax: number;
    precipitationMin: number;
    precipitationMax: number;
    hourly: HourlyNormalized[];
    highlights: HourlyNormalized;
}

export interface HourlyNormalized
{
    time: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    precipitation: number;
    rainProbability: number;
    windSpeed: number;
    windDirection: number;
    uvIndex: number;
    forecast: string;  
    icon: string; 
}