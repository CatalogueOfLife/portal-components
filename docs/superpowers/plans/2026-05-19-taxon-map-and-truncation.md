# Taxon Map + Truncation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5-row truncation to Synonyms + Vernacular Names sections of `<Taxon>`, add an opt-in Leaflet distribution map (peer-dep), and wire the demo to Poa annua (6W3C4) showing the map.

**Architecture:** Three independent feature streams in one component. (1) `ShowMoreToggle` ported from `clb-master`, used by `Synonyms.js` and `VernacularNames.js`. (2) `DistributionsMap.js` ported from `clb-master`; `Distributions.js` rewritten to switch between map view and the existing concatenated-text list when a new `showDistributionMap` prop is set. (3) Vite configs externalize `leaflet`; consumers load Leaflet JS+CSS themselves.

**Tech Stack:** React 16 (class + function components, no JSX-runtime), Ant Design 4.6.1, Vite 6 library mode (ES + UMD), Leaflet 1.9.4 (peer dep).

**Spec:** `docs/superpowers/specs/2026-05-19-taxon-map-and-truncation-design.md`

**Reference source files (read-only) in `~/code/col/clb-master/src/pages/Taxon/`:**
- `ShowMoreToggle.js`
- `DistributionsMap.js`
- `Distributions.js` (the rewrite pattern we're following)

---

### Task 1: Port `ShowMoreToggle` component

**Files:**
- Create: `src/Taxon/ShowMoreToggle.js`

- [ ] **Step 1: Create the file**

```jsx
import React from "react";

const ShowMoreToggle = ({ total, visible, showAll, onChange }) => {
  if (total <= visible && !showAll) return null;
  return (
    <a onClick={() => onChange(!showAll)} style={{ cursor: "pointer" }}>
      {showAll ? "Show less" : `Show all (${total})`}
    </a>
  );
};

export default ShowMoreToggle;
```

- [ ] **Step 2: Commit**

```bash
git add src/Taxon/ShowMoreToggle.js
git commit -m "Add ShowMoreToggle helper for Taxon section truncation"
```

---

### Task 2: Truncate Vernacular Names to 5 rows

**Files:**
- Modify: `src/Taxon/VernacularNames.js`

- [ ] **Step 1: Add ShowMoreToggle import**

In `src/Taxon/VernacularNames.js`, after the existing imports, add:

```js
import ShowMoreToggle from "./ShowMoreToggle";
```

- [ ] **Step 2: Add `showAll` to constructor state**

Find the `this.state = { ... }` block in the constructor. Add `showAll: false,` near the top of the state object (between `data:` and `countryAlpha3:`).

- [ ] **Step 3: Slice the data in render and append the toggle**

Replace the entire `render()` method with:

```jsx
render() {
    const { style } = this.props;
    const { data, columns, showAll } = this.state;
    const visible = showAll ? data : data.slice(0, 5);

    return (
      <>
        <Table
          style={style}
          className="colplus-taxon-page-list"
          columns={columns}
          dataSource={visible}
          rowKey="id"
          pagination={false}
          size="middle"
        />
        <ShowMoreToggle
          total={data.length}
          visible={5}
          showAll={showAll}
          onChange={(v) => this.setState({ showAll: v })}
        />
      </>
    );
  }
```

- [ ] **Step 4: Manually verify in the demo**

Run `npm run dev` and navigate to `/data/taxon/6W3C4`. Confirm the Vernacular Names section shows 5 rows + a "Show all (N)" link, that clicking it expands to all rows + "Show less", and that the link is absent when there are ≤5 vernacular names (try another taxon if needed).

- [ ] **Step 5: Commit**

```bash
git add src/Taxon/VernacularNames.js
git commit -m "Truncate vernacular names to 5 rows with show-more toggle"
```

---

### Task 3: Refactor Synonyms to flat render order + 5-row truncation

**Files:**
- Modify: `src/Taxon/Synonyms.js`

Walking the existing nested structure (homotypic flat list + heterotypicGroups with leader + nested members) and counting rendered lines is the goal. The cleanest way is to flatten render order into a single list of items first, then slice. Convert the component from a class-shaped function (it already uses hooks but with an empty effect and unused Button) into a tidier function component with `useState` for `showAll`.

- [ ] **Step 1: Replace the file contents**

Overwrite `src/Taxon/Synonyms.js` with:

```jsx
import React, { useState } from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem";
import ReferencePopover from "./ReferencePopover";
import MergedDataBadge from "../components/MergedDataBadge";
import DecisionBadge from "../components/DecisionBadge";
import TypeMaterialPopover from "./TypeMaterialPopover";
import ShowMoreToggle from "./ShowMoreToggle";

const TOP_N = 5;

const SynonymsTable = ({
  datasetKey,
  data,
  style,
  nomStatus,
  references,
  decisions,
  typeMaterial,
  referenceIndexMap,
  primarySource,
  pathToDataset,
}) => {
  const [showAll, setShowAll] = useState(false);

  const getNomStatus = (taxon) =>
    !nomStatus
      ? _.get(taxon, "name.nomStatus")
      : nomStatus[_.get(taxon, "name.nomStatus")][
          (_.get(taxon, "name.code"), "zoological")
        ];

  const sorter = (a, b) => {
    if (
      _.get(a, "name.combinationAuthorship.year") &&
      _.get(b, "name.combinationAuthorship.year")
    ) {
      return (
        _.get(b, "name.combinationAuthorship.year") -
        _.get(a, "name.combinationAuthorship.year")
      );
    } else {
      if (_.get(a, "name.scientificName") < _.get(b, "name.scientificName")) {
        return -1;
      } else {
        return 1;
      }
    }
  };

  // Flatten render order so truncation can count rendered lines exactly.
  // Each item is one BorderedListItem. Heterotypic groups become a leader
  // (homotypic=false, "=") followed by their nested homotypic members
  // (homotypic=true + indent, "≡").
  const items = [];
  if (data.homotypic) {
    [...data.homotypic].sort(sorter).forEach((s) => {
      items.push({ syn: s, homotypic: true, indent: false });
    });
  }
  if (data.heterotypicGroups) {
    [...data.heterotypicGroups]
      .sort((a, b) => sorter(a[0], b[0]))
      .forEach((group) => {
        group.forEach((s, i) => {
          items.push({ syn: s, homotypic: i > 0, indent: i > 0 });
        });
      });
  }

  const total = items.length;
  const visible = showAll ? items : items.slice(0, TOP_N);

  const renderItem = ({ syn: s, homotypic, indent }) => (
    <BorderedListItem key={_.get(s, "name.id")}>
      <span style={indent ? { marginLeft: "10px" } : null}>
        {homotypic === true ? "≡ " : "= "}{" "}
        <span
          dangerouslySetInnerHTML={{
            __html: _.get(
              s,
              "labelHtml",
              `${_.get(s, "name.scientificName")} ${_.get(
                s,
                "name.authorship",
                ""
              )}`
            ),
          }}
        />
      </span>{" "}
      {s?.sourceDatasetKey &&
        _.get(primarySource, "key") !== s?.sourceDatasetKey && (
          <MergedDataBadge
            createdBy={s?.createdBy}
            datasetKey={s.datasetKey}
            sourceDatasetKey={s?.sourceDatasetKey}
            pathToDataset={pathToDataset}
            verbatimSourceKey={s.verbatimSourceKey}
          />
        )}{" "}
      {decisions?.[s?.id] && <DecisionBadge decision={decisions?.[s?.id]} />}
      <TypeMaterialPopover
        datasetKey={datasetKey}
        typeMaterial={typeMaterial}
        nameId={_.get(s, "name.id")}
        placement="top"
      />{" "}
      {_.get(s, "name.nomStatus") ? `(${getNomStatus(s)})` : ""}{" "}
      {_.get(s, "status") === "misapplied" && _.get(s, "accordingTo")
        ? _.get(s, "accordingTo")
        : ""}
      {_.get(s, "status") === "ambiguous synonym" && "(Ambiguous)"}
      <ReferencePopover
        datasetKey={datasetKey}
        references={references}
        referenceIndexMap={referenceIndexMap}
        referenceId={
          _.get(s, "name.publishedInId")
            ? [_.get(s, "name.publishedInId"), ...(s.referenceIds || [])]
            : s.referenceIds
        }
        placement="top"
        style={{ display: "inline-block" }}
      />
    </BorderedListItem>
  );

  return (
    <div style={style}>
      {visible.map(renderItem)}
      <ShowMoreToggle
        total={total}
        visible={TOP_N}
        showAll={showAll}
        onChange={setShowAll}
      />
    </div>
  );
};

export default SynonymsTable;
```

Changes vs the old file: removed unused `Button` import, removed the empty `useEffect`, removed the nested `renderSynonym`-with-recursion in favour of a flat `items` array with `renderItem`. Render order and visuals are unchanged.

- [ ] **Step 2: Manually verify in the demo**

Run `npm run dev` and navigate to `/data/taxon/6W3C4`. Confirm Synonyms shows ≤5 lines + a "Show all (N)" link, that expanding shows the rest with the same `≡`/`=` markers and indentation as before, that a heterotypic group whose leader falls at line 5 renders only the leader (its nested homotypic members hidden until expansion).

- [ ] **Step 3: Commit**

```bash
git add src/Taxon/Synonyms.js
git commit -m "Truncate synonym list to 5 rendered lines with show-more toggle"
```

---

### Task 4: Add Leaflet as peer + dev dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Edit `package.json`**

Find the `"peerDependencies"` block:

```json
"peerDependencies": {
    "react": "16.x"
  },
```

Replace with:

```json
"peerDependencies": {
    "react": "16.x",
    "leaflet": "^1.9.4"
  },
```

Find the `"devDependencies"` block and add `"leaflet": "^1.9.4",` (alphabetical, after `jsdom`):

```json
"devDependencies": {
    "jsdom": "^28.1.0",
    "leaflet": "^1.9.4",
    "less": "^4.2.0",
    ...
```

- [ ] **Step 2: Install**

```bash
npm install
```

Expected: `package-lock.json` updated, `node_modules/leaflet/` exists.

- [ ] **Step 3: Verify install**

```bash
ls node_modules/leaflet/dist/leaflet.css node_modules/leaflet/dist/leaflet.js
```

Expected: both files exist.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add leaflet as peer + dev dependency for Taxon map"
```

---

### Task 5: Externalize Leaflet in both Vite library builds

**Files:**
- Modify: `vite.config.js`
- Modify: `vite.config.umd.js`

- [ ] **Step 1: ES build — externalize leaflet**

In `vite.config.js`, locate the `rollupOptions.external` array (lines 41–48). Add `/^leaflet/` at the end:

```js
rollupOptions: {
      external: [
        'react', 'react-dom', 'react-router-dom',
        /^antd/, /^axios/, /^lodash/, /^history/,
        /^highcharts/, /^marked/, /^query-string/,
        /^react-jss/, /^react-highlight-words/,
        /^dompurify/, /^linkify/, /^dataloader/, /^btoa/,
        /^leaflet/,
      ],
    },
```

- [ ] **Step 2: UMD build — externalize leaflet and map to global `L`**

In `vite.config.umd.js`, locate the `rollupOptions` block. Replace:

```js
rollupOptions: {
      external: ['react'],
      output: {
        globals: { react: 'React' },
```

with:

```js
rollupOptions: {
      external: ['react', 'leaflet'],
      output: {
        globals: { react: 'React', leaflet: 'L' },
```

- [ ] **Step 3: Verify the ES build still works**

```bash
npm run build
```

Expected: build succeeds; no Leaflet-related warnings. (Leaflet isn't yet imported in any source file — this just confirms we haven't broken the existing build.)

- [ ] **Step 4: Commit**

```bash
git add vite.config.js vite.config.umd.js
git commit -m "Externalize leaflet from ES and UMD library builds"
```

---

### Task 6: Port `DistributionsMap` component

**Files:**
- Create: `src/Taxon/DistributionsMap.js`

This is the file from `~/code/col/clb-master/src/pages/Taxon/DistributionsMap.js` with two changes from the reference: the `config` import path becomes `../config` (one less `..`), and the `leaflet/dist/leaflet.css` import is removed (consumers and the demo load the CSS).

- [ ] **Step 1: Create the file**

```jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { Radio } from "antd";
import axios from "axios";
import config from "../config";

const POPUP_FIELDS = [
  "establishmentMeans",
  "degreeOfEstablishment",
  "pathway",
  "threatStatus",
  "year",
  "lifeStage",
];

const ESTABLISHMENT_MEANS = [
  { key: "nativeendemic", label: "Native endemic", color: "#0F8554" },
  { key: "native", label: "Native", color: "#87C55F" },
  { key: "nativereintroduced", label: "Native reintroduced", color: "#C9DB74" },
  { key: "introduced", label: "Introduced", color: "#FE88B1" },
  {
    key: "introducedassistedcolonisation",
    label: "Introduced assisted colonisation",
    color: "#DCB0F2",
  },
  { key: "vagrant", label: "Vagrant", color: "#F6CF71" },
  { key: "uncertain", label: "Uncertain", color: "#66C5CC" },
];

const ESTABLISHMENT_COLORS = Object.fromEntries(
  ESTABLISHMENT_MEANS.map((m) => [m.key, m.color])
);
const DEFAULT_KEY = "uncertain";

const normalizeKey = (v) =>
  String(v || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const resolveKey = (record) => {
  const k = normalizeKey(record?.establishmentMeans);
  return ESTABLISHMENT_COLORS[k] ? k : DEFAULT_KEY;
};

const colorFor = (record) => ESTABLISHMENT_COLORS[resolveKey(record)];

const polygonStyleFor = (color) => ({
  color,
  weight: 1,
  fillColor: color,
  fillOpacity: 0.75,
});
const polygonHoverStyle = {
  weight: 2,
  fillOpacity: 0.95,
};

const BASEMAPS = [
  {
    key: "carto",
    label: "Carto",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    options: {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      subdomains: "abcd",
    },
  },
  {
    key: "osm",
    label: "OSM",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    },
  },
  {
    key: "esri",
    label: "Esri",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
    options: {
      attribution:
        "Tiles &copy; Esri &mdash; Source: US National Park Service",
      maxZoom: 8,
    },
  },
];
const DEFAULT_BASEMAP = "carto";

const cache = new Map();

const fetchShape = (gazetteer, id) => {
  const key = `${gazetteer}:${id}`;
  if (cache.has(key)) return cache.get(key);
  const url = `${config.dataApi}vocab/area/${key}`;
  const p = axios(url, {
    headers: { Accept: "application/geo+json" },
  }).then(
    (r) => r.data,
    () => null
  );
  cache.set(key, p);
  return p;
};

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const popupHtml = (record) => {
  const title = record?.area?.name || record?.area?.globalId || "";
  const rows = POPUP_FIELDS.map((f) => [f, record?.[f]])
    .filter(([, v]) => v != null && v !== "")
    .map(
      ([k, v]) =>
        `<div><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</div>`
    )
    .join("");
  return `<div style="min-width:180px"><div style="font-weight:600;margin-bottom:4px">${escapeHtml(
    title
  )}</div>${rows}</div>`;
};

const DistributionsMap = ({ records, onUnmappable }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const [basemap, setBasemap] = useState(DEFAULT_BASEMAP);

  const presentMeans = useMemo(() => {
    if (!records?.length) return [];
    const seen = new Set(records.map(resolveKey));
    return ESTABLISHMENT_MEANS.filter((m) => seen.has(m.key));
  }, [records]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      worldCopyJump: true,
      minZoom: 1,
    }).setView([20, 0], 2);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const def = BASEMAPS.find((b) => b.key === basemap) || BASEMAPS[0];
    const newLayer = L.tileLayer(def.url, def.options).addTo(map);
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    tileLayerRef.current = newLayer;
    const max = def.options?.maxZoom;
    if (typeof max === "number" && map.getZoom() > max) {
      map.setZoom(max);
    }
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !records?.length) return;
    let cancelled = false;
    const group = L.featureGroup().addTo(map);
    let failures = 0;

    Promise.allSettled(
      records.map((r) =>
        fetchShape(r.area.gazetteer, r.area.id).then((geojson) => ({
          record: r,
          geojson,
        }))
      )
    ).then((results) => {
      if (cancelled) return;
      results.forEach((res) => {
        if (res.status !== "fulfilled" || !res.value.geojson) {
          failures += 1;
          return;
        }
        const { record, geojson } = res.value;
        const baseStyle = polygonStyleFor(colorFor(record));
        const layer = L.geoJSON(geojson, {
          style: () => baseStyle,
          onEachFeature: (_feature, lyr) => {
            lyr.bindPopup(popupHtml(record));
            lyr.on("mouseover", () => lyr.setStyle(polygonHoverStyle));
            lyr.on("mouseout", () => lyr.setStyle(baseStyle));
          },
        });
        layer.addTo(group);
      });
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [10, 10] });
      }
      if (typeof onUnmappable === "function") {
        onUnmappable(failures);
      }
    });

    return () => {
      cancelled = true;
      group.remove();
    };
  }, [records, onUnmappable]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={containerRef}
        style={{ height: 360, width: "100%", background: "#f5f5f5" }}
      />
      <Radio.Group
        size="small"
        value={basemap}
        onChange={(e) => setBasemap(e.target.value)}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 1000,
          background: "#fff",
          borderRadius: 4,
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}
      >
        {BASEMAPS.map((b) => (
          <Radio.Button key={b.key} value={b.key}>
            {b.label}
          </Radio.Button>
        ))}
      </Radio.Group>
      {presentMeans.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            zIndex: 1000,
            background: "#fff",
            borderRadius: 4,
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            padding: "6px 8px",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {presentMeans.map((m) => (
            <div
              key={m.key}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  background: m.color,
                  border: "1px solid rgba(0,0,0,0.15)",
                  borderRadius: 2,
                }}
              />
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DistributionsMap;
```

- [ ] **Step 2: Commit (file is unused until Task 7 wires it in)**

```bash
git add src/Taxon/DistributionsMap.js
git commit -m "Port DistributionsMap component from clb-master"
```

---

### Task 7: Rewrite `Distributions.js` with map/list toggle

**Files:**
- Modify: `src/Taxon/Distributions.js`

The existing concatenated-text list logic (with `iso3Map` country-name lookup and `MergedDataBadge`) becomes the inner `ListView` component, used as both the fallback and the "List" radio target.

- [ ] **Step 1: Replace the file contents**

```jsx
import React, { useState, useEffect } from "react";
import { Radio } from "antd";
import _ from "lodash";
import ReferencePopover from "./ReferencePopover";
import config from "../config";
import axios from "axios";
import MergedDataBadge from "../components/MergedDataBadge";
import DistributionsMap from "./DistributionsMap";

const isMappable = (r) =>
  r?.area?.gazetteer !== "text" && !!r?.area?.globalId;

const ListView = ({ datasetKey, data, pathToDataset }) => {
  const [iso3Map, setIso3Map] = useState({});

  useEffect(() => {
    let isIso = false;
    for (let i = 0; i < data.length; i++) {
      if (data[i].gazetteer === "iso") {
        isIso = true;
        break;
      }
    }
    if (isIso) {
      axios(`${config.dataApi}vocab/country`).then((res) => {
        setIso3Map(_.keyBy(res.data, "alpha3"));
      });
    }
  }, []);

  return (
    <div>
      {data.map((s, i) => (
        <span key={i}>
          {s?.merged && (
            <MergedDataBadge
              createdBy={s?.createdBy}
              datasetKey={s.datasetKey}
              sourceDatasetKey={s?.sourceDatasetKey}
              verbatimSourceKey={s?.verbatimSourceKey}
              pathToDataset={pathToDataset}
              style={{ marginRight: "4px" }}
            />
          )}
          {(_.get(iso3Map, `[${_.get(s, "area.name")}].name`)
            ? _.startCase(_.get(iso3Map, `[${_.get(s, "area.name")}].name`))
            : null) ||
            _.get(s, "area.name") ||
            _.get(s, "area.globalId")}{" "}
          {s.referenceId && (
            <ReferencePopover
              datasetKey={datasetKey}
              referenceId={s.referenceId}
              placement="bottom"
            />
          )}
          {i < data.length - 1 && ", "}
        </span>
      ))}
    </div>
  );
};

const DistributionsTable = ({
  datasetKey,
  data,
  style,
  pathToDataset,
  showDistributionMap,
}) => {
  const mappable = data.filter(isMappable);
  const baseUnmappable = data.length - mappable.length;
  const [view, setView] = useState("map");
  const [fetchFailures, setFetchFailures] = useState(0);

  const allMappableFailed =
    mappable.length > 0 && fetchFailures >= mappable.length;

  if (!showDistributionMap || mappable.length === 0 || allMappableFailed) {
    return (
      <div style={style}>
        <ListView
          datasetKey={datasetKey}
          data={data}
          pathToDataset={pathToDataset}
        />
      </div>
    );
  }

  const unmappable = baseUnmappable + fetchFailures;

  return (
    <div style={style}>
      <Radio.Group
        size="small"
        value={view}
        onChange={(e) => setView(e.target.value)}
        style={{ marginBottom: 8 }}
      >
        <Radio.Button value="map">Map</Radio.Button>
        <Radio.Button value="list">List</Radio.Button>
      </Radio.Group>
      {view === "map" ? (
        <>
          <DistributionsMap
            records={mappable}
            onUnmappable={setFetchFailures}
          />
          {unmappable > 0 && (
            <div style={{ marginTop: 6 }}>
              <a onClick={() => setView("list")} style={{ cursor: "pointer" }}>
                +{unmappable} distribution{unmappable === 1 ? "" : "s"} not on
                map
              </a>
            </div>
          )}
        </>
      ) : (
        <ListView
          datasetKey={datasetKey}
          data={data}
          pathToDataset={pathToDataset}
        />
      )}
    </div>
  );
};

export default DistributionsTable;
```

Changes vs the old file: dropped the now-unused `BorderedListItem` import; added `Radio` and `DistributionsMap` imports; existing list rendering moved verbatim into `ListView`; new `DistributionsTable` chooses between `ListView` and the map.

- [ ] **Step 2: Commit (component is wired but `<Taxon>` doesn't pass the prop yet — list view remains the only behaviour)**

```bash
git add src/Taxon/Distributions.js
git commit -m "Rewrite Distributions with optional map view + list fallback"
```

---

### Task 8: Plumb `showDistributionMap` through `<Taxon>`

**Files:**
- Modify: `src/Taxon/index.js`

- [ ] **Step 1: Pull the prop in the render destructure**

Find this block in `render()` (around lines 388–394):

```js
    const {
      datasetKey,
      pathToTaxon,
      pathToSearch,
      pathToDataset,
      pathToTree,
    } = this.props;
```

Replace with:

```js
    const {
      datasetKey,
      pathToTaxon,
      pathToSearch,
      pathToDataset,
      pathToTree,
      showDistributionMap,
    } = this.props;
```

- [ ] **Step 2: Pass the prop into `<Distributions>`**

Find the existing `<Distributions ... />` JSX (around lines 718–727) and add `showDistributionMap={showDistributionMap}`:

```jsx
{_.get(info, "distributions") && (
            <PresentationItem md={md} label="Distributions">
              <Distributions
                pathToDataset={pathToDataset}
                style={{ marginTop: "-3px" }}
                data={info.distributions}
                datasetKey={datasetKey}
                showDistributionMap={showDistributionMap}
              />
            </PresentationItem>
          )}
```

- [ ] **Step 3: Commit**

```bash
git add src/Taxon/index.js
git commit -m "Plumb showDistributionMap prop through Taxon component"
```

---

### Task 9: Wire the demo to Poa annua + map

**Files:**
- Modify: `demo/src/index.js`

- [ ] **Step 1: Import Leaflet CSS for the dev server**

At the top of `demo/src/index.js`, immediately after `import { render } from "react-dom";`, add:

```js
import "leaflet/dist/leaflet.css";
```

(This is demo-only. The library does not import the CSS; consumers load it themselves.)

- [ ] **Step 2: Change the Taxon route to Poa annua**

Find this entry in the `routes` array:

```js
{ path: "/data/taxon/622TP", label: "Taxon" },
```

Replace with:

```js
{ path: "/data/taxon/6W3C4", label: "Taxon" },
```

- [ ] **Step 3: Enable the map on the demo's `<Taxon>`**

Find the demo's `<Taxon>` JSX (around lines 125–135) and add `showDistributionMap`:

```jsx
{pathname.indexOf("/data/taxon/") === 0 && (
          <Taxon
            datasetKey={datasetKey}
            pathToTree="/data/tree"
            pathToSearch="/data/search"
            pathToDataset="/data/source/"
            pathToTaxon="/data/taxon/"
            pageTitleTemplate="COL | __taxon__"
            identifierLabel="COL identifier"
            showDistributionMap
          />
        )}
```

- [ ] **Step 4: Manually verify**

Run `npm run dev`, navigate to `/data/taxon/6W3C4`. Confirm:
- The map renders with multiple coloured polygons (Poa annua is widespread; expect dozens of regions).
- The basemap selector (top-right of map) switches tile layers.
- The Map | List radio toggle (above the map) switches to the existing concatenated-text list and back.
- If unmappable distributions exist, the `+N distributions not on map` link appears and clicking it switches to List.
- The Synonyms section truncates to 5 lines and expands on "Show all".
- The Vernacular Names table truncates to 5 rows and expands on "Show all".

- [ ] **Step 5: Commit**

```bash
git add demo/src/index.js
git commit -m "Demo: point Taxon route at Poa annua and enable distribution map"
```

---

### Task 10: Document the peer dep in README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a new property to the Taxon prop list**

Find the `### ColBrowser.Taxon` section (around line 127). After property #7 (`identifierLabel`), add #8:

```markdown
8. `showDistributionMap` - (Optional) When `true`, render an interactive Leaflet map for distributions whose areas have a known geometry, with a toggle to switch to the plain text list view. **Requires the consumer to load Leaflet 1.9+ and its CSS** (peer dependency).
```

- [ ] **Step 2: Add a Leaflet snippet directly below that paragraph (before the code block)**

Add this paragraph between property #8 and the opening fence of the example code block:

```markdown
To use the map, include Leaflet alongside React in your page:

\`\`\`
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
\`\`\`

ES module consumers: `npm install leaflet` and `import "leaflet/dist/leaflet.css"` in your bundle entry.
```

(Use real backticks in the file — escape syntax shown above is only for this plan document.)

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Document showDistributionMap prop and Leaflet peer dep in README"
```

---

### Task 11: Verify the published library still externalises Leaflet

**Files:** none (verification only)

- [ ] **Step 1: Build both bundles**

```bash
npm run build:all
```

Expected: both `es/index.js` and `umd/col-browser.js` (+ `.min.js`) produced; no errors.

- [ ] **Step 2: Confirm Leaflet is externalised, not bundled**

```bash
grep -c "leaflet" es/index.js
grep -c "leaflet" umd/col-browser.js
```

Expected: low counts (matches are `import` / `require` / `global.L` references, not bundled source). Specifically: ES build should contain `from "leaflet"` (or equivalent import token). UMD build should reference `global.L` / `globalThis.L`. Neither should contain Leaflet's source (`L.Map` class definition etc).

Spot-check with:

```bash
grep -l "Leaflet 1.9" es/index.js umd/col-browser.js 2>/dev/null
```

Expected: no matches (Leaflet's source banner is absent).

- [ ] **Step 3: Confirm bundle size hasn't grown materially**

```bash
ls -la es/index.js umd/col-browser.js
```

Compare against the prior release (`git show HEAD~10:package.json` or just sanity-check that the file isn't ~150KB larger than before).

- [ ] **Step 4: Final sanity check in demo, then we're done**

Run `npm run dev` once more and walk through all the manual verifications from Task 9 Step 4. If everything still works, the feature is complete.

No commit for this task — it is verification only.

---

## Done criteria

- Synonyms and Vernacular Names show 5 rows by default with working "Show all (N)" / "Show less" toggles.
- `<Taxon showDistributionMap />` shows a Leaflet map for mappable distributions, with Map/List toggle and an "+N not on map" link when applicable.
- `<Taxon>` without `showDistributionMap` is byte-identical in behaviour to the current code path (concatenated-text list only).
- Published `es/` and `umd/` bundles do not include Leaflet source; `package.json` declares the peer-dep.
- Demo route is `/data/taxon/6W3C4`; opening it in `npm run dev` shows the map.
- README documents the new prop + Leaflet requirement.
