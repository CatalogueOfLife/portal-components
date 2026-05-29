import React from "react";
import { startCase } from "lodash-es";
import PresentationItem from "../components/PresentationItem";
import { LinkTo } from "../router";

const IncludesTable = ({ data, style, rank, taxon }) => {
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
            label={startCase(rankToPlural[t.value] || t.value)}
            classes={{ formItem: { borderBottom: "none" } }}
            key={t.value}
          >
            <LinkTo
              to="search"
              args={{
                TAXON_ID: taxon.id,
                rank: t.value,
                status: ["accepted", "provisionally accepted"],
              }}
            >
              {t.count}
            </LinkTo>
          </PresentationItem>
        ))}
    </div>
  );
};

export default IncludesTable;
