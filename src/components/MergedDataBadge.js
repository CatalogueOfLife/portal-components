import React, { useEffect, useState, useRef } from "react";
import { Tag, Popover } from "antd";
import client from "../api/client";
import config from "../config";
import { LinkTo } from "../router";

const createdByAlgorithm = {
  14: "The data was created by the homotypic grouping algorithm",
};

const MergedDataBadge = ({
  style = {},
  datasetKey,
  sourceDatasetKey,
  sourceId,
  popoverPlacement,
  verbatimSourceKey,
  sectorKey,
  createdBy,
}) => {
  const [sourceDataset, setSourceDataset] = useState(null);
  const [sourceDatasetLoading, setSourceDatasetLoading] = useState(false);
  const [verbatimRecord, setVerbatimRecord] = useState(null);
  const [verbatimRecordLoading, setVerbatimRecordLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // A merged record's provenance can arrive two ways: explicit props, or — for
  // merged usages, whose own sourceDatasetKey is null — only on the verbatim
  // source record. Resolve both so the popover can always name the source
  // dataset and link the source id when one exists.
  const effectiveSourceDatasetKey =
    sourceDatasetKey || verbatimRecord?.sourceDatasetKey;
  const effectiveSourceId = sourceId || verbatimRecord?.sourceId;

  // Fetch the verbatim record (carries sourceDatasetKey / sourceId / entity).
  useEffect(() => {
    if (open && verbatimSourceKey && !createdByAlgorithm[createdBy]) {
      getVerbatimRecord();
    }
  }, [verbatimSourceKey, open]);

  // Fetch the source dataset once its key is known — from the prop, or from the
  // verbatim record once that has loaded.
  useEffect(() => {
    if (open && effectiveSourceDatasetKey) {
      getSourceDataset(effectiveSourceDatasetKey);
    }
  }, [open, effectiveSourceDatasetKey]);

  const getSourceDataset = (key) => {
    setSourceDatasetLoading(true);
    client(`${config.dataApi}dataset/${key}`)
      .then((res) => {
        setSourceDatasetLoading(false);
        setSourceDataset(res.data);
      })
      .catch((err) => {
        console.error("Error fetching source dataset:", err);
        setSourceDatasetLoading(false);
        setSourceDataset(null);
      });
  };

  const getVerbatimRecord = () => {
    setVerbatimRecordLoading(true);
    setVerbatimRecord(null);
    client(
      `${config.dataApi}dataset/${datasetKey}/verbatimsource/${verbatimSourceKey}`
    )
      .then((res) => {
        setVerbatimRecordLoading(false);
        setVerbatimRecord(res.data);
      })
      .catch((err) => {
        console.error("Error fetching verbatim record:", err);
        setVerbatimRecordLoading(false);
        setVerbatimRecord(null);
      });
  };

  const idRef = useRef(Math.random().toString(36).substring(2, 15));

  // ChecklistBank link to the source record. References live under /reference;
  // everything else (the common name-usage case) under /taxon.
  const clbEntity = (verbatimRecord?.sourceEntity || "")
    .toLowerCase()
    .replace(/\s+/g, "");
  const clbPath = clbEntity === "reference" ? "reference" : "taxon";
  const sourceRecordHref =
    effectiveSourceId && effectiveSourceDatasetKey
      ? `https://www.checklistbank.org/dataset/${effectiveSourceDatasetKey}/${clbPath}/${encodeURIComponent(
          effectiveSourceId
        )}`
      : null;

  const loadingSource =
    sourceDatasetLoading || (!!verbatimSourceKey && verbatimRecordLoading);

  const content = (
    <div style={{ minWidth: "300px" }}>
      {!!createdByAlgorithm[createdBy] && (
        <div>{createdByAlgorithm[createdBy]}</div>
      )}
      <div>
        <strong>Source:</strong>{" "}
        {sourceDataset ? (
          <LinkTo to="source" args={sourceDataset.key}>
            {sourceDataset.title}
          </LinkTo>
        ) : loadingSource ? (
          "Loading..."
        ) : (
          "—"
        )}
      </div>
      {sourceRecordHref && (
        <div>
          <strong>ID:</strong>{" "}
          <a href={sourceRecordHref} target="_blank" rel="noreferrer">
            {effectiveSourceId}
          </a>
        </div>
      )}
      {verbatimRecord?.issues && verbatimRecord.issues.length > 0 && (
        <div>
          <span>Issues: </span>
          {verbatimRecord.issues.map((issue, index) => (
            <Tag key={index} style={{ margin: "2px" }}>
              {issue}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );

  const tagStyle = {
    cursor: "pointer",
    fontFamily: "monospace",
    fontSize: "8px",
    fontWeight: 900,
    padding: "2px",
    lineHeight: "8px",
    verticalAlign: "middle",
    marginRight: "2px",
    ...style,
  };

  return !!sourceDatasetKey || !!verbatimSourceKey ? (
    <div style={{ display: "inline" }} id={idRef.current}>
      <Popover
        getPopupContainer={() => document.getElementById(idRef.current)}
        content={content}
        trigger={"click"}
        placement={popoverPlacement || "right"}
        onOpenChange={setOpen}
      >
        <Tag color="purple" style={tagStyle}>
          XR
        </Tag>
      </Popover>
    </div>
  ) : (
    <div style={{ display: "inline" }}>
      <Tag color="purple" style={{ ...tagStyle, cursor: "default" }}>
        XR
      </Tag>
    </div>
  );
};

export default MergedDataBadge;
