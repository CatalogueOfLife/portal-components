import React from "react";
import _ from "lodash";
import PresentationItem from "../components/PresentationItem";

const IncludesTable = ({ data, style, rank, pathToSearch, taxon }) => {
  const rankToPlural = rank.reduce(
    (acc, cur) => ((acc[cur.value] = cur.plural), acc),
    {}
  );
  return (
    <div style={style}>
      {" "}
      {data
        .filter((t) => t.value !== taxon.name.rank)
        .sort((a, b) => rank.indexOf(a.value) - rank.indexOf(b.value))
        .map((t) => (
          <PresentationItem
            md={6}
            label={_.startCase(rankToPlural[t.value] || t.value)}
            classes={{ formItem: { borderBottom: "none" } }}
            key={t.value}
          >
           {pathToSearch ? <a
              href={`${pathToSearch}?TAXON_ID=${taxon.id}&rank=${t.value}&status=accepted&status=provisionally%20accepted`}
              onClick={() => {
                window.location.href = `${pathToSearch}?TAXON_ID=${taxon.id}&rank=${t.value}&status=accepted&status=provisionally%20accepted`;
              }}
            >
              {t.count}
            </a> : t.count }
          </PresentationItem>
        ))}
    </div>
  );
};

export default IncludesTable;
