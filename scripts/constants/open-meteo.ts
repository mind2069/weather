
export const WEATHER_MAP: Record<number, string> = 
{
    0: "Sunny",
    1: "Mostly Sunny",
    2: "Partly Cloudy",
    3: "Cloudy",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    56: "Light Freezing Drizzle",
    57: "Dense Freezing Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    66: "Light Freezing Rain",
    67: "Heavy Freezing Rain",
    71: "Slight Snow",
    73: "Moderate Snow",
    75: "Heavy Snow",
    77: "Snow Grains",
    80: "Slight Rain Showers",
    81: "Moderate Rain Showers",
    82: "Violent Rain Showers",
    85: "Slight Snow Showers",
    86: "Heavy Snow Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
};

export const WEATHER_ICONS_SVG_UNKNOWN = "/icons/weather/svg/unknown.svg";

export const WEATHER_ICONS_SVG: Record<number, string> = 
{
    0: "/icons/weather/svg/sun.svg",
    1: "/icons/weather/svg/sun-behind-small-cloud.svg",
    2: "/icons/weather/svg/sun-behind-large-cloud.svg",
    3: "/icons/weather/svg/cloud.svg",
    45: "/icons/weather/svg/fog.svg",
    48: "/icons/weather/svg/fog.svg",
    51: "/icons/weather/svg/sun-behind-rain-cloud.svg",
    53: "/icons/weather/svg/cloud-with-rain.svg",
    55: "/icons/weather/svg/cloud-with-rain.svg",
    56: "/icons/weather/svg/cloud-with-snow.svg",
    57: "/icons/weather/svg/cloud-with-snow.svg",
    61: "/icons/weather/svg/cloud-with-rain.svg",
    63: "/icons/weather/svg/cloud-with-rain.svg",
    65: "/icons/weather/svg/cloud-with-rain.svg",
    66: "/icons/weather/svg/cloud-with-snow.svg",
    67: "/icons/weather/svg/cloud-with-snow.svg",
    71: "/icons/weather/svg/cloud-with-snow.svg",
    73: "/icons/weather/svg/cloud-with-snow.svg",
    75: "/icons/weather/svg/cloud-with-snow.svg",
    77: "/icons/weather/svg/snowflake.svg",
    80: "/icons/weather/svg/sun-behind-rain-cloud.svg",
    81: "/icons/weather/svg/cloud-with-rain.svg",
    82: "/icons/weather/svg/cloud-with-rain.svg",
    85: "/icons/weather/svg/cloud-with-snow.svg",
    86: "/icons/weather/svg/cloud-with-snow.svg",
    95: "/icons/weather/svg/cloud-with-lightning.svg",
    96: "/icons/weather/svg/cloud-with-lightning-and-rain.svg",
    99: "/icons/weather/svg/cloud-with-lightning-and-rain.svg",
};

export const WEATHER_ICONS_PNG_UNKNOWN = "/icons/weather/png/unknown.png";

export const WEATHER_ICONS_PNG: Record<number, string> = 
{
    0: "/icons/weather/png/sun.png",
    1: "/icons/weather/png/sun-behind-small-cloud.png",
    2: "/icons/weather/png/sun-behind-large-cloud.png",
    3: "/icons/weather/png/cloud.png",
    45: "/icons/weather/png/fog.png",
    48: "/icons/weather/png/fog.png",
    51: "/icons/weather/png/sun-behind-rain-cloud.png",
    53: "/icons/weather/png/cloud-with-rain.png",
    55: "/icons/weather/png/cloud-with-rain.png",
    56: "/icons/weather/png/cloud-with-snow.png",
    57: "/icons/weather/png/cloud-with-snow.png",
    61: "/icons/weather/png/cloud-with-rain.png",
    63: "/icons/weather/png/cloud-with-rain.png",
    65: "/icons/weather/png/cloud-with-rain.png",
    66: "/icons/weather/png/cloud-with-snow.png",
    67: "/icons/weather/png/cloud-with-snow.png",
    71: "/icons/weather/png/cloud-with-snow.png",
    73: "/icons/weather/png/cloud-with-snow.png",
    75: "/icons/weather/png/cloud-with-snow.png",
    77: "/icons/weather/png/snowflake.png",
    80: "/icons/weather/png/sun-behind-rain-cloud.png",
    81: "/icons/weather/png/cloud-with-rain.png",
    82: "/icons/weather/png/cloud-with-rain.png",
    85: "/icons/weather/png/cloud-with-snow.png",
    86: "/icons/weather/png/cloud-with-snow.png",
    95: "/icons/weather/png/cloud-with-lightning.png",
    96: "/icons/weather/png/cloud-with-lightning-and-rain.png",
    99: "/icons/weather/png/cloud-with-lightning-and-rain.png",
};

export const WEATHER_ICONS_EMOJIS: Record<number, string> = 
{
    0: "☀️",   // Sunny
    1: "🌤️",  // Mostly Sunny
    2: "⛅",   // Partly Cloudy
    3: "☁️",   // Cloudy
    45: "🌫️",  // Fog
    48: "🌫️",  // Depositing rime fog
    51: "🌦️",  // Light Drizzle
    53: "🌧️",  // Moderate Drizzle
    55: "🌧️",  // Dense Drizzle
    56: "🌨️",  // Light Freezing Drizzle
    57: "🌨️",  // Dense Freezing Drizzle
    61: "🌧️",  // Slight Rain
    63: "🌧️",  // Moderate Rain
    65: "🌧️",  // Heavy Rain
    66: "🌨️",  // Light Freezing Rain
    67: "🌨️",  // Heavy Freezing Rain
    71: "🌨️",  // Slight Snow
    73: "🌨️",  // Moderate Snow
    75: "❄️",  // Heavy Snow
    77: "❄️",  // Snow Grains
    80: "🌦️",  // Slight Rain Showers
    81: "🌧️",  // Moderate Rain Showers
    82: "⛈️",  // Violent Rain Showers
    85: "🌨️",  // Slight Snow Showers
    86: "❄️",  // Heavy Snow Showers
    95: "⛈️",  // Thunderstorm
    96: "⛈️",  // Thunderstorm with slight hail
    99: "⛈️",  // Thunderstorm with heavy hail
};

export const WEATHER_ICONS_UNKNOWN = WEATHER_ICONS_PNG_UNKNOWN;

export const WEATHER_ICONS: Record<number, string> = WEATHER_ICONS_PNG