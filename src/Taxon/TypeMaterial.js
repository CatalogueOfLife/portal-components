import React from "react";
import config from "../config";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem";
import linkify from "linkify-html";
import { Tag, Space, Tooltip } from "antd";
import {LinkOutlined} from "@ant-design/icons";

import MergedDataBadge from "../components/MergedDataBadge";

export const getTypeColor = (status) => {
  const typeStatus = status ? status.toUpperCase() : "";

  if (["HOLOTYPE", "LECTOTYPE", "NEOTYPE"].includes(typeStatus)) {
    return "#e2614a";
  }
  if (["PARATYPE", "PARALECTOTYPE", "SYNTYPE"].includes(typeStatus)) {
    return "#f1eb0b";
  }
  if (["ALLOTYPE"].includes(typeStatus)) {
    return "#7edaff";
  }
  return null;
};

const getLinks = (dataset, s) => {
  let gbifOccLink =
    dataset?.gbifKey &&
    dataset?.gbifPublisherKey === config?.plaziGbifPublisherKey
      ? `https://www.gbif.org/occurrence/${dataset?.gbifKey}/${s.id}`
      : "";
  if (!gbifOccLink && s?.link?.startsWith("https://www.gbif.org/occurrence/")) {
    gbifOccLink = s?.link;
  }
  const ncbiLink =
    s?.associatedSequences && s?.associatedSequences.indexOf("ncbi.") > -1
      ? s?.associatedSequences
      : "";
  return (
    (gbifOccLink || ncbiLink) && (
      <span id={`${s.id}-type-material-links`}>
        <Space>
          {gbifOccLink && (
            <Tooltip title="Occurrence in GBIF" getPopupContainer={() => document.getElementById(`${s.id}-type-material-links`) || document.body}>
              <a style={{marginLeft: 4}} href={gbifOccLink} target="_blank" rel="noreferrer">
                GBIF <LinkOutlined />
              </a>
            </Tooltip>
          )}
          {ncbiLink && (
            <Tooltip title="DNA sequence in GenBank">
              <a href={ncbiLink} target="_blank" rel="noreferrer">
                GenBank <LinkOutlined />
              </a>
            </Tooltip>
          )}
        </Space>
      </span>
    )
  );
};

const TypeMaterial = ({ dataset, data, nameID, style }) => {
  return data[nameID] ? (
    <div style={style}>
      {data[nameID].map((s) => (
        <BorderedListItem key={s.id}>
          <Tag color={getTypeColor(s?.status)}>{s?.status}</Tag>{" "}
          {s.merged && (
            <MergedDataBadge
              createdBy={s?.createdBy}
              datasetKey={s?.datasetKey}
              verbatimSourceKey={s?.verbatimSourceKey}
              sourceDatasetKey={s?.sourceDatasetKey}
            />
          )}
          {getLinks(dataset, s)}{" "}
          {s?.citation && (
            <span
              dangerouslySetInnerHTML={{ __html: linkify(s?.citation || "") }}
            ></span>
          )}
        </BorderedListItem>
      ))}
    </div>
  ) : null;
};



export default TypeMaterial;
