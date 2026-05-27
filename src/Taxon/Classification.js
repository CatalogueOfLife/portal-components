import React from "react";
import { LinkTo } from "../router";

const rankStyle = {
  color: "rgba(0, 0, 0, 0.45)",
  fontSize: "11px",
};

const ClassificationTable = ({ data, style }) => (
  <div style={style}>
    {" "}
    {data.map((t, i) => (
      <div style={{ float: "left", marginRight: "3px" }} key={t.rank}>
        <span style={rankStyle}>{t.rank}: </span>
        <LinkTo to="taxon" args={t.id}>
          <span dangerouslySetInnerHTML={{ __html: t.labelHtml }} />
        </LinkTo>
        {i < data.length - 1 && " >"}
      </div>
    ))}
  </div>
);

export default ClassificationTable;
