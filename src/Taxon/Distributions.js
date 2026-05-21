import { useState, useEffect } from "react";
import { Radio } from "antd";
import _ from "lodash";
import ReferencePopover from "./ReferencePopover";
import config from "../config";
import axios from "axios";
import MergedDataBadge from "../components/MergedDataBadge";
import DistributionsMap, {
  BASEMAPS,
  DEFAULT_BASEMAP,
} from "./DistributionsMap";

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
  const [view, setView] = useState("map");
  const [basemap, setBasemap] = useState(DEFAULT_BASEMAP);
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
          gap: 8,
        }}
      >
        <Radio.Group
          size="small"
          value={view}
          onChange={(e) => setView(e.target.value)}
        >
          <Radio.Button value="map">Map</Radio.Button>
          <Radio.Button value="list">List</Radio.Button>
        </Radio.Group>
        {view === "map" && (
          <Radio.Group
            size="small"
            value={basemap}
            onChange={(e) => setBasemap(e.target.value)}
          >
            {BASEMAPS.map((b) => (
              <Radio.Button key={b.key} value={b.key}>
                {b.label}
              </Radio.Button>
            ))}
          </Radio.Group>
        )}
      </div>
      {view === "map" ? (
        <>
          <DistributionsMap
            records={mappable}
            onUnmappable={setFetchFailures}
            datasetKey={datasetKey}
            focalTaxon={focalTaxon}
            rankOrder={rankOrder}
            basemap={basemap}
            gbifChecklistKey={gbifChecklistKey}
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
