import { useState, useEffect } from "react";
import { Radio } from "antd";
import { get, keyBy, startCase } from "lodash-es";
import ReferencePopover from "./ReferencePopover";
import config from "../config";
// publicClient (no CoL auth) for the third-party GBIF occurrence API below.
import client, { publicClient } from "../api/client";
import MergedDataBadge from "../components/MergedDataBadge";
import PresentationItem from "../components/PresentationItem";
import DistributionsMap from "./DistributionsMap";

const isMappable = (r) =>
  r?.area?.gazetteer !== "text" && !!r?.area?.globalId;

const ListView = ({ datasetKey, data }) => {
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
      client(`${config.dataApi}vocab/country`).then((res) => {
        setIso3Map(keyBy(res.data, "alpha3"));
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
              style={{ marginRight: "4px" }}
            />
          )}
          {(get(iso3Map, `[${get(s, "area.name")}].name`)
            ? startCase(get(iso3Map, `[${get(s, "area.name")}].name`))
            : null) ||
            get(s, "area.name") ||
            get(s, "area.globalId")}{" "}
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
  showDistributionMap,
  focalTaxon,
  rankOrder,
  gbifChecklistKey,
  label,
  md,
}) => {
  const mappable = data.filter(isMappable);
  const baseUnmappable = data.length - mappable.length;
  const hasGbifConfigured = !!gbifChecklistKey;
  const hasAnyRecords = data.length > 0;
  const [view, setView] = useState("map");
  const [fetchFailures, setFetchFailures] = useState(0);

  // null = unknown (loading or unconfigured), number = occurrence count.
  const [gbifCount, setGbifCount] = useState(null);
  useEffect(() => {
    if (!gbifChecklistKey || !focalTaxon?.id) {
      setGbifCount(null);
      return undefined;
    }
    setGbifCount(null);
    let cancelled = false;
    publicClient
      .get(`${config.gbifApi}/v1/occurrence/search`, {
        params: {
          checklistKey: gbifChecklistKey,
          taxonKey: focalTaxon.id,
          hasCoordinate: true,
          hasGeospatialIssue: false,
          occurrenceStatus: 'PRESENT',
          limit: 0,
        },
      })
      .then(
        (res) => {
          if (!cancelled) setGbifCount(res?.data?.count ?? 0);
        },
        () => {
          // On API failure, treat as "unknown" — leave the toggle enabled
          // rather than greying it out for an outage.
          if (!cancelled) setGbifCount(null);
        }
      );
    return () => {
      cancelled = true;
    };
  }, [gbifChecklistKey, focalTaxon?.id]);

  // true  → GBIF has occurrences (or unknown — still loading or API failed)
  // false → GBIF returned count = 0
  const gbifAvailable = !hasGbifConfigured
    ? false
    : gbifCount === null || gbifCount > 0;

  const allMappableFailed =
    mappable.length > 0 && fetchFailures >= mappable.length;
  const showMap =
    showDistributionMap &&
    (mappable.length > 0 || gbifAvailable) &&
    !(mappable.length > 0 && allMappableFailed && !gbifAvailable);

  // Nothing to show — no map (no mappable records and no GBIF occurrences) and
  // no records to list. Hide the whole block, like other empty content blocks.
  if (!showMap && !hasAnyRecords) return null;

  const unmappable = baseUnmappable + fetchFailures;
  const showToggle = hasAnyRecords;

  let body;
  if (!showMap) {
    // No map to show — just the plain text list.
    body = <ListView datasetKey={datasetKey} data={data} />;
  } else {
    // Map available. The Map/List toggle is rendered above the view switch so
    // it stays visible in BOTH sub-views — the user can always go back to the
    // map after looking at the list.
    const activeView = showToggle ? view : "map";
    body = (
      <>
        {showToggle ? (
          <Radio.Group
            size="small"
            value={activeView}
            onChange={(e) => setView(e.target.value)}
            style={{ marginBottom: 8 }}
          >
            <Radio.Button value="map">Map</Radio.Button>
            <Radio.Button value="list">List</Radio.Button>
          </Radio.Group>
        ) : (
          // Reserve the vertical space the Map/List toggle would occupy so the
          // map's top edge lines up with the "Distributions" label.
          <div style={{ height: 24, marginBottom: 8 }} />
        )}
        {activeView === "map" ? (
          <>
            <DistributionsMap
              records={mappable}
              onUnmappable={setFetchFailures}
              datasetKey={datasetKey}
              focalTaxon={focalTaxon}
              rankOrder={rankOrder}
              gbifChecklistKey={gbifChecklistKey}
              gbifAvailable={gbifAvailable}
            />
            {showToggle && unmappable > 0 && (
              <div style={{ marginTop: 6 }}>
                <a onClick={() => setView("list")} style={{ cursor: "pointer" }}>
                  +{unmappable} distribution{unmappable === 1 ? "" : "s"} not on
                  map
                </a>
              </div>
            )}
          </>
        ) : (
          <ListView datasetKey={datasetKey} data={data} />
        )}
      </>
    );
  }

  // No negative top nudge: the map block's top element (the Map/List toggle, or
  // the spacer reserving its height) lines up with the "Distributions" label
  // the same way every other content row does. The plain text-only list aligns
  // naturally too.
  const content = <div style={style}>{body}</div>;

  // When a `label` is given (the Taxon page), own the labelled block so it
  // disappears entirely when empty (returning null above). Standalone embeds
  // pass no label and just get the bare block.
  return label ? (
    <PresentationItem md={md} label={label}>
      {content}
    </PresentationItem>
  ) : (
    content
  );
};

export default DistributionsTable;
