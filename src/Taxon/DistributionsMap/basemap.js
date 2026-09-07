import config from "../../config";

/**
 * The MapLibre style spec the distribution map should render on.
 *
 * A per-instance `basemapStyle` prop wins over the global `configure()`
 * default. Either may be a style URL or an inline style object — whatever
 * MapLibre accepts as `style`.
 */
export const resolveBasemapStyle = (prop) => prop ?? config.basemapStyle;
