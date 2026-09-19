export type RouteConfiguration =
{
    pattern: string | RegExp;
    rewrite: string;
};

export const ROUTES_PATHS: RouteConfiguration[] =
[
    { pattern: /^\/en-ca\/day\/([^/]+)$/, rewrite: "/forms/public/day" },
    { pattern: /^\/fr-ca\/journee\/([^/]+)$/, rewrite: "/forms/public/day" },
    { pattern: "/en-ca/forecast/3-days", rewrite: "/forms/public/forecast" },
    { pattern: "/fr-ca/prevision/3-jours", rewrite: "/forms/public/forecast" },
    { pattern: "/en-ca/forecast/7-days", rewrite: "/forms/public/forecast" },
    { pattern: "/fr-ca/prevision/7-jours", rewrite: "/forms/public/forecast" },
    { pattern: "/en-ca/forecast/14-days", rewrite: "/forms/public/forecast" },
    { pattern: "/fr-ca/prevision/14-jours", rewrite: "/forms/public/forecast" },
    { pattern: /^\/en-ca\/forecast\/([^/]+)$/, rewrite: "/forms/public/forecast" },
    { pattern: /^\/fr-ca\/prevision\/([^/]+)$/, rewrite: "/forms/public/forecast" },
    { pattern: "/en-ca/calendar", rewrite: "/forms/public/calendar" },
    { pattern: "/fr-ca/calendrier", rewrite: "/forms/public/calendar" },
];
