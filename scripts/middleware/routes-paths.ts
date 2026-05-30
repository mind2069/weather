export type RouteConfiguration =
{
    pattern: string | RegExp;
    rewrite: string;
};

export const ROUTES_PATHS: RouteConfiguration[] =
[
    { pattern: /^\/en-ca\/day\/([^/]+)$/, rewrite: "/forms/public/day" },
    { pattern: /^\/fr-ca\/journee\/([^/]+)$/, rewrite: "/forms/public/day" },
    { pattern: "/en-ca/day", rewrite: "/forms/public/day" },
    { pattern: "/fr-ca/journee", rewrite: "/forms/public/day" },
    { pattern: "/en-ca/today", rewrite: "/forms/public/day" },
    { pattern: "/fr-ca/aujourdhui", rewrite: "/forms/public/day" },
    { pattern: "/en-ca/tomorrow", rewrite: "/forms/public/day" },
    { pattern: "/fr-ca/demain", rewrite: "/forms/public/day" },
    { pattern: "/en-ca/after-tomorrow", rewrite: "/forms/public/day" },
    { pattern: "/fr-ca/apres-demain", rewrite: "/forms/public/day" },
    { pattern: "/en-ca/forecast-7-days", rewrite: "/forms/public/forecast" },
    { pattern: "/fr-ca/prevision-7-jours", rewrite: "/forms/public/forecast" },
    { pattern: "/en-ca/forecast-14-days", rewrite: "/forms/public/forecast" },
    { pattern: "/fr-ca/prevision-14-jours", rewrite: "/forms/public/forecast" },
];
