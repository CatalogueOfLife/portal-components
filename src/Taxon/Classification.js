import React from "react";
import _ from "lodash";

const rankStyle = {
  color: "rgba(0, 0, 0, 0.45)",
  fontSize: "11px",
};
const ClassificationTable = ({
  data,
  taxon,
  style,
  pathToTaxon,
  pathToTree,
}) => (
  <div style={style}>
    {" "}
    {_.reverse([...data]).map((t) => (
      <div style={{ float: "left", marginRight: "3px" }} key={t.rank}>
        <span style={rankStyle}>{t.rank}: </span>
        <a
          href={`${pathToTaxon}${t.id}`}
          onClick={() => {
            window.location.href = `${pathToTaxon}${t.id}`;
          }}
          dangerouslySetInnerHTML={{ __html: t.labelHtml }}
        />
        {" >"}
      </div>
    ))}
    <div style={{ float: "left" }}>
      {_.get(taxon, "name.rank") && (
        <span style={rankStyle}>{taxon.name.rank}: </span>
      )}
      {taxon && (
        <a
          onClick={() => {
            window.location.href = `${pathToTree}?taxonKey=${taxon.id}`;
          }}
          dangerouslySetInnerHTML={{ __html: taxon.labelHtml }}
        />
      )}
    </div>
  </div>
);

export default ClassificationTable;
