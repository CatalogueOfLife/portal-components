export default {
    dataApi: "https://api.checklistbank.org/",
    // Human-facing ChecklistBank portal. Used for outbound links to
    // dataset / publisher pages we don't host ourselves.
    clbPortal: "https://www.checklistbank.org",
    // GBIF API base (no trailing slash). Used for the occurrence count and
    // the v2 map tile endpoint.
    gbifApi: "https://api.gbif.org",
    // GBIF human-facing portal where the attribution link points. Stays on
    // demo.gbif.org until the multitaxonomy occurrence search ships on
    // www.gbif.org (expected mid-2026).
    gbifPortal: "https://demo.gbif.org",
};