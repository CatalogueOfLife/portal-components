import React, { useEffect, useState, useRef } from "react";
import { Tag, Popover } from "antd";
import btoa from "btoa";
import axios from "axios";
import config from "../config";
const MergedDataBadge = ({
  style = {},
  sourceDatasetKey,
  sourceId,
  popoverPlacement,
  pathToDataset
}) => {
  const [sourceDataset, setSourceDataset] = useState(null);
  const [sourceDatasetLoading, setSourceDatasetLoading] = useState(false);
  const [sourceTaxon, setSourceTaxon] = useState(null);
  const [sourceTaxonLoading, setSourceTaxonLoading] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open && sourceDatasetKey && sourceId) {
      getSourceTaxon()
    }
    if (open && sourceDatasetKey) {
      getSourceDataset()
    }
  }, [sourceDatasetKey, sourceId, open]);

  

  const getSourceTaxon = () => {
    setSourceTaxonLoading(true);
    setSourceTaxon(null);
    axios(`${config.dataApi}dataset/${sourceDatasetKey}/taxon/${sourceId}`)
      .then((res) => {
        setSourceTaxonLoading(false);
        setSourceTaxon(res.data);
      })
      .catch((err) => {
        console.error("Error fetching source  taxon:", err);
        setSourceTaxonLoading(false);
        setSourceTaxon(null);
      });
  };

  const getSourceDataset = () => {
    setSourceDatasetLoading(true);
    setSourceDataset(null);
    axios(`${config.dataApi}dataset/${sourceDatasetKey}`)
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

  const idRef = useRef(Math.random().toString(36).substring(2, 15));

  return !!sourceDatasetKey ? (
    <div style={{ display: "inline" }} id={idRef.current}>
      <Popover
                 getPopupContainer={() => document.getElementById(idRef.current)}
          content={
          <>
            {sourceDatasetKey && <div>
              <strong>Source Dataset:</strong>{" "}
              {sourceDatasetLoading
                ? "Loading..."
                : <a href={`${pathToDataset}${sourceDataset?.key}`} onClick={() => {window.location.href =  `${pathToDataset}${sourceDataset?.key}`}}  >{sourceDataset?.title}</a> }
            </div>}
            {sourceDatasetKey && sourceId && <div>
              <strong>Source Taxon:</strong>{" "}
              {sourceTaxonLoading
                ? "Loading..."
                : <a
                      href={`https://www.checklistbank.org/dataset/${sourceDatasetKey}/taxon/${sourceId}`}
                      dangerouslySetInnerHTML={ { __html: sourceTaxon?.labelHtml } }
                      onClick={() => {
                        window.location.href = `https://www.checklistbank.org/dataset/${sourceDatasetKey}/taxon/${sourceId}`;
                      }}
                    ></a> }
            </div>}
          </>
        }
        trigger={"click"}
        placement={popoverPlacement || "right"}
      >
        <Tag
          color="purple"
           onClick={(e) => {
            getSourceDataset();
            getSourceTaxon();
          }} 
          style={{
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: "8px",
            fontWeight: 900,
            padding: "2px",
            lineHeight: "8px",
            verticalAlign: "middle",
            marginRight: "2px",
            ...style,
          }}
        >
          XR
        </Tag>
      </Popover>
    </div>
  ) : (
    <Tag
      color="purple"
      style={{
        fontFamily: "monospace",
        fontSize: "8px",
        fontWeight: 900,
        padding: "2px",
        lineHeight: "8px",
        verticalAlign: "middle",
        marginRight: "2px",
        ...style,
      }}
    >
      XR
    </Tag>
  );
};

export default MergedDataBadge;
