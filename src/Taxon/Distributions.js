import React from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem"
import ReferencePopover from "./ReferencePopover"

const DistributionsTable = ({datasetKey, data, style }) => (
  
  <div style={style}>{data.map((s, i) => (
  <BorderedListItem key={i}  >
    {s.area} {" "}
              <ReferencePopover datasetKey={datasetKey} referenceId={s.referenceId} placement="bottom"/>
  </BorderedListItem>
))}</div>
)


export default DistributionsTable;
