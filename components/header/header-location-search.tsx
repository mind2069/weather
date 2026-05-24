"use client";

import { useEffect, useRef, useState } from "react";
import * as LanguagesHelper from "@/scripts/languages/languages-helper";
import { CookiesHelper } from "@/scripts/helpers/cookies";
import { LocationsServiceClient } from "@/services/locations/client";
import type { LocationResults } from "@/scripts/types/location";
import type { Session } from "@/scripts/types/session";

interface HeaderLocationSearchProperties
{
    session: Session;
}

function SearchIcon()
{
    return (
        <svg
            className="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    );
}

export default function HeaderLocationSearch({ session }: HeaderLocationSearchProperties)
{
    const [query, setQuery] = useState(session.user.location.name);
    const [results, setResults] = useState<LocationResults[]>([]);
    const [searching, setSearching] = useState(false);

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchIndexRef = useRef(0);
    const anchorRef = useRef<HTMLDivElement>(null);

    const dropdownOpen = results.length > 0 || (searching && results.length === 0);

    useEffect(() =>
    {
        setQuery(session.user.location.name);

    }, [session.user.location.name]);

    useEffect(() =>
    {
        return () =>
        {
            if (timeoutRef.current)
            {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    useEffect(() =>
    {
        if (!dropdownOpen)
        {
            return;
        }

        const onPointerDown = (e: PointerEvent) =>
        {
            const t = e.target as Node;

            if (anchorRef.current?.contains(t))
            {
                return;
            }

            setResults([]);
            setSearching(false);
        };

        const onKeyDown = (e: KeyboardEvent) =>
        {
            if (e.key === "Escape")
            {
                setResults([]);
                setSearching(false);
            }
        };

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);

        return () =>
        {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [dropdownOpen]);

    const runSearch = async (keyword: string) =>
    {
        searchIndexRef.current++;

        const currentIndex = searchIndexRef.current;

        if (!keyword || keyword.length < 2)
        {
            setResults([]);

            return;
        }

        setSearching(true);

        try
        {
            const response = await LocationsServiceClient.Search(
                {
                    session,
                    keyword,
                    locations_countries_id: 0,
                    locations_provinces_id: 0,
                },
            );

            if (currentIndex !== searchIndexRef.current)
            {
                return;
            }

            if (response.success && response.data)
            {
                setResults(response.data);
            }
            else
            {
                setResults([]);
            }
        }
        finally
        {
            if (currentIndex === searchIndexRef.current)
            {
                setSearching(false);
            }
        }
    };

    const onQueryChange = (value: string) =>
    {
        setQuery(value);

        if (timeoutRef.current)
        {
            clearTimeout(timeoutRef.current);
        }

        if (value.length >= 2)
        {
            timeoutRef.current = setTimeout(() =>
            {
                void runSearch(value);
            }, 400);
        }
        else
        {
            setResults([]);
            setSearching(false);
        }
    };

    const onSelect = (item: LocationResults) =>
    {
        const location = item.name + ", " + item.locations_provinces_name + ", " + item.locations_countries_name;
        const latitude = item.latitude;
        const longitude = item.longitude;

        session.user.location.name = location;
        session.user.location.latitude = latitude;
        session.user.location.longitude = longitude;

        CookiesHelper.Set("location", location);
        CookiesHelper.Set("latitude", String(latitude));
        CookiesHelper.Set("longitude", String(longitude));

        setQuery(item.name);
        setResults([]);
        setSearching(false);

        window.location.reload();
    };

    return (
        <div ref={anchorRef} className="search">
            <input
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                value={query}
                placeholder={LanguagesHelper.Caption("Location")}
                onChange={(e) => onQueryChange(e.target.value)}
                className="input"
                aria-expanded={dropdownOpen}
                aria-haspopup="listbox"
            />
            <span className="icon" aria-hidden>
                <SearchIcon />
            </span>
            {dropdownOpen ? (
                <div className="results">
                    {results.length > 0 ? (
                        results.map((item) => (
                            <button
                                key={`${item.id}-${item.locations_provinces_id}-${item.name}-${item.latitude}`}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => onSelect(item)}
                            >
                                {item.name} &middot; {item.locations_provinces_name} &middot;{" "}
                                {item.locations_countries_name}
                            </button>
                        ))
                    ) : (
                        <div className="status">
                            {LanguagesHelper.Caption("Loading")}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
