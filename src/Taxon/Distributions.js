import React from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem"
import ReferencePopover from "./ReferencePopover"

const DistributionsTable = ({datasetKey, data, style }) => (
  
  <div style={style}>{data.map((s, i) => (
  <BorderedListItem key={i}  >
    {_.get(s, 'area.name') || _.get(s, 'area.globalId')}{" "}
        {s.referenceId && (
          <ReferencePopover
            datasetKey={datasetKey}
            referenceId={s.referenceId}
            placement="bottom"
          />
        )}
  </BorderedListItem>
))}</div>
)


export default DistributionsTable;
