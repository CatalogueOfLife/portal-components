import React, { useEffect, useState, useRef } from "react";

import { Tag, Popover } from "antd";

const DecisionBadge = ({ style = {}, decision, popoverPlacement }) => {
  const idRef = useRef(Math.random().toString(36).substring(2, 15));

  const {
    subject, 
    originalSubjectId, 
    subjectDatasetKey, 
    datasetKey, 
    created, 
    createdBy, 
    modified,
    modifiedBy,
    ...rest} = decision;
  return (<div style={{ display: "inline" }} id={idRef.current}>
     <Popover
                      getPopupContainer={() => document.getElementById(idRef.current)}
    title={"Editorial decision"}
    content={
     <div style={{overflow: "scroll"}}> <pre
        style={{ fontSize: "10px", fontFamily: "monospace", width: "400px" }}
      >
        {JSON.stringify(rest, null, 2)}
      </pre></div>
    }
    placement={popoverPlacement || "right"}

    trigger="click"
  >
    <Tag
      color="gold"
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
      DC
    </Tag>
  </Popover>
  </div>
 
)};

export default DecisionBadge;
