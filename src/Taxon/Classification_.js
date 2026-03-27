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
    {data.map((t) => (
      <PresentationItem
        md={6}
        label={_.startCase(t.rank)}
        classes={{ formItem: { borderBottom: "none" } }}
        key={t.rank}
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
  </div>
);

export default ClassificationTable;
