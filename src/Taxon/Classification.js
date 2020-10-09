import React from "react";
import _ from "lodash";
// import { NavLink } from "react-router-dom";
import PresentationItem from "../components/PresentationItem";

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
      <PresentationItem
        md={6}
        label={_.startCase(t.name.rank)}
        classes={{ formItem: { borderBottom: "none" } }}
        key={t.name.rank}
      >
        <a
          href={`${pathToTaxon}${t.id}`}
          onClick={() => {
            window.location.href = `${pathToTaxon}${t.id}`;
          }}
          dangerouslySetInnerHTML={{ __html: t.labelHtml }}
        />
      </PresentationItem>
    ))}
    <PresentationItem
      md={6}
      label={_.get(taxon, "name.rank") ? _.startCase(taxon.name.rank) : ""}
      classes={{ formItem: { borderBottom: "none" } }}
    >
      {taxon && (
        <a
          onClick={() => {
            window.location.href = `${pathToTree}?taxonKey=${taxon.id}`;
          }}
          dangerouslySetInnerHTML={{ __html: taxon.labelHtml }}
        />
      )}
    </PresentationItem>
  </div>
);

export default ClassificationTable;
