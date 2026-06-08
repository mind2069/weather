export class LocationHelper
{
    public static LatitudeNormalize(value: number): number
    {
        return Number.isFinite(value) && value >= -90 && value <= 90 ? value : -999999;
    }

    public static LongitudeNormalize(value: number): number
    {
        return Number.isFinite(value) && value >= -180 && value <= 180 ? value : -999999;
    }
}
