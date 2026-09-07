import config from "../../config";

/**
 * The MapLibre style spec the distribution map should render on.
 *
 * A per-instance `basemapStyle` prop wins over the global `configure()`
 * default. Either may be a style URL or an inline style object — whatever
 * MapLibre accepts as `style`.
 */
export const resolveBasemapStyle = (prop) => prop ?? config.basemapStyle;

// CARTO serves the style from basemaps.cartocdn.com and the tiles, glyphs and
// sprites from tiles*.basemaps.cartocdn.com.
const CARTO_HOST = /(^|\.)cartocdn\.com$/i;

/**
 * A MapLibre `transformRequest` that authenticates CARTO basemap traffic.
 *
 * CARTO's published styles are static files whose `glyphs`, `sprite` and
 * vector-source URLs are absolute and key-free, so baking `?key=` into the
 * style URL authenticates that one request and nothing else. CARTO meters
 * *tile* requests, so the key has to ride on all of them — this appends it to
 * every cartocdn.com request the map makes and leaves other hosts (GBIF
 * occurrence tiles, ChecklistBank) untouched.
 *
 * Returns undefined when no key is set, so MapLibre keeps its own default.
 */
export const cartoTransformRequest = (key = config.cartoKey) => {
    if (!key) return undefined;
    return (url) => {
        let parsed;
        try {
            parsed = new URL(url);
        } catch {
            return { url };
        }
        // Leave a key already baked into the style URL alone.
        if (!CARTO_HOST.test(parsed.hostname) || parsed.searchParams.has("key")) {
            return { url };
        }
        parsed.searchParams.set("key", key);
        return { url: parsed.toString() };
    };
};
