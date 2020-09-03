import React from "react";
import _ from "lodash";
import PresentationItem from "../components/PresentationItem";

const IncludesTable = ({ data, style, rank, pathToSearch, taxon }) => (
  <div style={style}>
    {" "}
    {data
      .filter((t) => t.value !== taxon.name.rank)
      .sort((a, b) => rank.indexOf(a.value) - rank.indexOf(b.value))
      .map((t) => (
        <PresentationItem
          md={6}
          label={_.startCase(t.value)}
          classes={{ formItem: { borderBottom: "none" } }}
          key={t.value}
        >
          <a
            href={`${pathToSearch}?TAXON_ID=${taxon.id}&rank=${t.value}&status=accepted&status=provisionally%20accepted`}
            onClick={() => {
              window.location.href = `${pathToSearch}?TAXON_ID=${taxon.id}&rank=${t.value}&status=accepted&status=provisionally%20accepted`;
            }}
          >
            {t.count}
          </a>
        </PresentationItem>
      ))}
  </div>
);

export default IncludesTable;
