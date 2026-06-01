import { Country } from "@/scripts/types/location";

export const COUNTRIES: readonly Country[] = 
[
    {
        id: 1,
        name: "Unknown",
        name_normalized: "unknown",
        code: "-",
        latitude: 0,
        longitude: 0,
    },
    {
        id: 2,
        name: "United States",
        name_normalized: "unitedstates",
        code: "US",
        latitude: 39.8283,
        longitude: -98.5795,
    },
    {
        id: 3,
        name: "Canada",
        name_normalized: "canada",
        code: "CA",
        latitude: 56.130366,
        longitude: -106.346771,
    },
    {
        id: 4,
        name: "Russia",
        name_normalized: "russia",
        code: "RU",
        latitude: 61.5240,
        longitude: 105.3188,
    },
    {
        id: 5,
        name: "Singapore",
        name_normalized: "singapore",
        code: "SG",
        latitude: 1.3521,
        longitude: 103.8198,
    },
    {
        id: 6,
        name: "China",
        name_normalized: "china",
        code: "CN",
        latitude: 35.8617,
        longitude: 104.1954,
    },
    {
        id: 7,
        name: "Bahamas",
        name_normalized: "bahamas",
        code: "BS",
        latitude: 24.25,
        longitude: -76.00,
    },

] as const;