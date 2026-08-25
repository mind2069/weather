import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BATCH_SIZE = 200;
const BATCH_PAUSE_MS = 50;

function LoadEnv(filePath)
{
    const text = fs.readFileSync(filePath, "utf8");
    const env = {};

    for (const line of text.split(/\r?\n/))
    {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith("#"))
        {
            continue;
        }

        const index = trimmed.indexOf("=");

        if (index < 0)
        {
            continue;
        }

        const key = trimmed.slice(0, index).trim();
        let value = trimmed.slice(index + 1).trim();

        if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'")))
        {
            value = value.slice(1, -1);
        }

        env[key] = value;
    }

    return env;
}

function Normalize(text)
{
    // Same as public.text_normalize: translate, lower, strip non [a-z0-9]
    const from = "àáâãäåèéêëìíîïòóôõöùúûüçñ";
    const to = "aaaaaaeeeeiiiiooooouuuucn";
    const coalesced = text ?? "";
    let translated = "";

    for (const ch of coalesced)
    {
        const idx = from.indexOf(ch);
        translated += idx < 0 ? ch : to[idx];
    }

    return translated.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function ParseTsv(filePath, skipComments)
{
    const text = fs.readFileSync(filePath, "utf8");
    const rows = [];

    for (const line of text.split(/\r?\n/))
    {
        if (!line)
        {
            continue;
        }

        if (skipComments && line.startsWith("#"))
        {
            continue;
        }

        rows.push(line.split("\t"));
    }

    return rows;
}

function Sleep(ms)
{
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function UpsertBatch(supabase, rows)
{
    let lastError = null;

    for (let attempt = 1; attempt <= 6; attempt++)
    {
        try
        {
            const { error } = await supabase.from("locations_full").upsert(rows, { onConflict: "id" });

            if (!error)
            {
                return;
            }

            lastError = new Error(error.message);
        }
        catch (error)
        {
            lastError = error instanceof Error ? error : new Error(String(error));
        }

        await Sleep(500 * attempt);
    }

    throw lastError ?? new Error("Upsert failed");
}

async function Main()
{
    const env = LoadEnv(path.join(ROOT, ".env.local"));
    const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key)
    {
        throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error: pingError } = await supabase.from("locations_full").select("id").limit(1);

    if (pingError)
    {
        throw new Error(`Cannot read locations_full: ${pingError.message}`);
    }

    const { error: deleteError } = await supabase.from("locations_full").delete().gte("id", 0);

    if (deleteError)
    {
        throw new Error(`Cannot clear locations_full: ${deleteError.message}`);
    }

    console.log("Cleared existing locations_full");

    const countries = new Map();

    for (const cols of ParseTsv(path.join(ROOT, "documentation", "countryInfo.txt"), true))
    {
        if (cols[0] && cols[4])
        {
            countries.set(cols[0], cols[4]);
        }
    }

    const admin1 = new Map();

    for (const cols of ParseTsv(path.join(ROOT, "documentation", "admin1CodesASCII.txt"), false))
    {
        if (cols[0] && cols[1])
        {
            admin1.set(cols[0], cols[1]);
        }
    }

    const cities = ParseTsv(path.join(ROOT, "documentation", "cities500.txt"), false);
    const unique = new Map();

    for (const cols of cities)
    {
        const id = Number(cols[0]);
        const city = cols[1];
        const latitude = Number(cols[4]);
        const longitude = Number(cols[5]);
        const countryCode = cols[8];
        const admin1Code = cols[10] || "";
        const population = Number(cols[14] || 0);
        const country = countries.get(countryCode);

        if (!id || !city || !country || Number.isNaN(latitude) || Number.isNaN(longitude))
        {
            continue;
        }

        const province = admin1.get(`${countryCode}.${admin1Code}`) || country;
        const cityNormalized = Normalize(city);
        const key = `${country}\t${province}\t${cityNormalized}`.toLowerCase();
        const previous = unique.get(key);

        if (previous && previous.population >= population)
        {
            continue;
        }

        unique.set(key, {
            id,
            country,
            province,
            city,
            city_normalized: cityNormalized,
            latitude,
            longitude,
            geom: `SRID=4326;POINT(${longitude} ${latitude})`,
            population,
        });
    }

    const payload = [...unique.values()].map(({ population, ...row }) => row);

    console.log(`Prepared ${payload.length} locations from ${cities.length} GeoNames rows (id = geonameid)`);

    let skippedGeom = false;

    for (let i = 0; i < payload.length; i += BATCH_SIZE)
    {
        const batch = payload.slice(i, i + BATCH_SIZE);

        try
        {
            await UpsertBatch(supabase, batch);
        }
        catch (error)
        {
            if (!skippedGeom && String(error.message).toLowerCase().includes("geom"))
            {
                skippedGeom = true;

                for (const row of payload)
                {
                    delete row.geom;
                }

                console.log("geom rejected; importing without geom");
                await UpsertBatch(supabase, batch);
            }
            else
            {
                throw new Error(`Batch at ${i} failed: ${error.message}`);
            }
        }

        await Sleep(BATCH_PAUSE_MS);

        if (i % 10000 === 0)
        {
            console.log(`Imported ${Math.min(i + BATCH_SIZE, payload.length)} / ${payload.length}`);
        }
    }

    console.log("Done");
}

Main().catch((error) =>
{
    console.error(error.message);
    process.exit(1);
});
