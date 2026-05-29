import React from "react";
import { Skeleton } from "antd";
import PresentationItem from "../components/PresentationItem";
import { get, isArray, startCase } from "lodash-es";
import { LinkTo } from "../router";

const getLivingTaxa = (metrics, rank) =>
  (get(metrics, `taxaByRankCount.${rank}`) || 0) -
  (get(metrics, `extinctTaxaByRankCount.${rank}`) || 0);
const getExtinctTaxa = (metrics, rank) =>
  get(metrics, `extinctTaxaByRankCount.${rank}`) || 0;

// Filter object passed to the `search` slot's onNavigate / hrefFor.
// The URL adapter knows how to turn this into a query string.
const baseFilters = (dataset) => {
  const f = dataset.key
    ? { SECTOR_DATASET_KEY: dataset.key }
    : { SECTOR_PUBLISHER_KEY: dataset.id };
  if (isArray(dataset.sectorModes)) f.sectorMode = dataset.sectorModes;
  return f;
};

export default ({ metrics, rank, style, dataset }) =>
  metrics && rank ? (
    <div style={style}>
      <React.Fragment>
        <PresentationItem label="Living species">
          {dataset ? (
            <LinkTo
              to="search"
              args={{
                ...baseFilters(dataset),
                rank: "species",
                extinct: ["false", "_NULL"],
              }}
            >
              {getLivingTaxa(metrics, "species").toLocaleString("en-GB")}
            </LinkTo>
          ) : (
            getLivingTaxa(metrics, "species").toLocaleString("en-GB")
          )}
        </PresentationItem>
        <PresentationItem label="Extinct species">
          {dataset ? (
            <LinkTo
              to="search"
              args={{
                ...baseFilters(dataset),
                rank: "species",
                extinct: "true",
              }}
            >
              {getExtinctTaxa(metrics, "species").toLocaleString("en-GB")}
            </LinkTo>
          ) : (
            getExtinctTaxa(metrics, "species").toLocaleString("en-GB")
          )}
        </PresentationItem>
      </React.Fragment>
      {metrics.taxaByRankCount &&
        Object.keys(metrics.taxaByRankCount)
          .sort((a, b) => rank.indexOf(b) - rank.indexOf(a))
          .map((k) => (
            <PresentationItem label={`${startCase(k)}`} key={k}>
              {dataset ? (
                <LinkTo
                  to="search"
                  args={{
                    ...baseFilters(dataset),
                    rank: k,
                    status: ["accepted", "provisionally accepted"],
                  }}
                >
                  {metrics.taxaByRankCount[k].toLocaleString("en-GB")}
                </LinkTo>
              ) : (
                metrics.taxaByRankCount[k].toLocaleString("en-GB")
              )}
            </PresentationItem>
          ))}
      <PresentationItem label="Synonyms" key="Synonyms">
        {dataset ? (
          <LinkTo
            to="search"
            args={{
              ...baseFilters(dataset),
              status: ["misapplied", "synonym", "ambiguous synonym"],
            }}
          >
            {(metrics.synonymCount || 0).toLocaleString("en-GB")}
          </LinkTo>
        ) : (
          (metrics.synonymCount || 0).toLocaleString("en-GB")
        )}
      </PresentationItem>
      <PresentationItem label="Common names" key="vernaculars">
        {(metrics.vernacularCount || 0).toLocaleString("en-GB")}
      </PresentationItem>
      <PresentationItem label="Total number of names" key="names">
        {dataset ? (
          <LinkTo to="search" args={baseFilters(dataset)}>
            {(metrics.nameCount || 0).toLocaleString("en-GB")}
          </LinkTo>
        ) : (
          (metrics.nameCount || 0).toLocaleString("en-GB")
        )}
      </PresentationItem>
    </div>
  ) : (
    <PresentationItem label="">
      <Skeleton active paragraph={{ rows: 4 }} />
    </PresentationItem>
  );
