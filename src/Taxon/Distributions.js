import { useState, useEffect } from "react";
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
  focalTaxon,
  rankOrder,
  gbifChecklistKey,
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
    axios
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

  // GBIF configured but found 0 occurrences AND nothing else mappable → say so.
  if (
    !showMap &&
    hasGbifConfigured &&
    mappable.length === 0 &&
    gbifCount === 0
  ) {
    return (
      <div style={style}>
        <span style={{ color: "#888" }}>
          No occurrence data on GBIF for this taxon.
        </span>
      </div>
    );
  }

  // Fall back to the plain list when there's no map to show.
  if (!showMap) {
    if (!hasAnyRecords) return null;
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
  const showToggle = hasAnyRecords;
  const activeView = showToggle ? view : "map";

  return (
    <div style={style}>
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
