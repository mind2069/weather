const WIND_DIRECTION_CAPTIONS =
[
    "North",
    "NorthEast",
    "East",
    "SouthEast",
    "South",
    "SouthWest",
    "West",
    "NorthWest",
    
] as const;

export type WindDirectionCaption = typeof WIND_DIRECTION_CAPTIONS[number] | "Unknown";

export class WindHelper
{
    public static Caption(degrees: number): string
    {
        if (!Number.isFinite(degrees))
        {
            return "Unknown";
        }

        const normalized = ((Math.round(degrees) % 360) + 360) % 360;
        const index = Math.round(normalized / 45) % 8;

        return WIND_DIRECTION_CAPTIONS[index];
    }
}
