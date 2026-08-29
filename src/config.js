export default {
    dataApi: "https://api.checklistbank.org/",
    // Human-facing ChecklistBank portal. Used for outbound links to
    // dataset / publisher pages we don't host ourselves.
    clbPortal: "https://www.checklistbank.org",
    // GBIF API base (no trailing slash). Used for the occurrence count and
    // the v2 map tile endpoint.
    gbifApi: "https://api.gbif.org",
    // GBIF human-facing portal where the attribution link points. The
    // multitaxonomy occurrence search now ships on the production portal.
    gbifPortal: "https://www.gbif.org",
    // MapLibre style URL for the distribution map's basemap. The default is
    // OpenFreeMap's Positron (same cartography as CARTO Positron, no API key,
    // no quota) so that embedders — who ship this bundle on their own sites —
    // never hit a key requirement or spend somebody else's tile allowance.
    // Override per deployment with the `basemapStyle` prop on Taxon /
    // TaxonDistribution, e.g. CARTO Positron with the deployment's own key:
    //   basemapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json?api_key=<key>"
    // (https://carto.com/basemaps/apikey/ — free within CARTO's fair use limit).
    basemapStyle: "https://tiles.openfreemap.org/styles/positron",
};