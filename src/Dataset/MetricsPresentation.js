import React from "react";
import { Skeleton } from "antd";
import PresentationItem from "../components/PresentationItem";
const _ = require("lodash");

const getLivingTaxa = (metrics, rank) =>
  (_.get(metrics, `taxaByRankCount.${rank}`) || 0) -
  (_.get(metrics, `extinctTaxaByRankCount.${rank}`) || 0);
const getExtinctTaxa = (metrics, rank) =>
  _.get(metrics, `extinctTaxaByRankCount.${rank}`) || 0;

  export default ({ metrics, rank, style }) => metrics && rank ? (
      <div style={style}>
        <React.Fragment>
          <PresentationItem label={`Living species`}>
            {getLivingTaxa(metrics, "species").toLocaleString("en-GB")}
          </PresentationItem>
          <PresentationItem label={`Extinct species`}>
            {getExtinctTaxa(metrics, "species").toLocaleString("en-GB")}
          </PresentationItem>
        </React.Fragment>
        {metrics.taxaByRankCount && Object.keys(metrics.taxaByRankCount)
          .filter((r) => rank.indexOf(r) < rank.indexOf("species"))
          .sort((a, b) => rank.indexOf(b) - rank.indexOf(a))
          .map((k) => (
            <PresentationItem label={`${_.startCase(k)}`} key={k}>
              {metrics.taxaByRankCount[k].toLocaleString("en-GB")}
            </PresentationItem>
          ))}
        <PresentationItem label={"Synonyms"} key={"Synonyms"}>
          {(metrics.synonymCount || 0).toLocaleString("en-GB")}
        </PresentationItem>
        <PresentationItem label={"Common names"} key={"vernaculars"}>
          {(metrics.vernacularCount || 0).toLocaleString("en-GB")}
        </PresentationItem>
        <PresentationItem label={"Total number of names"} key={"names"}>
          {(metrics.nameCount || 0).toLocaleString("en-GB")}
        </PresentationItem>
      </div>
    ) : (
      <PresentationItem label="">
        <Skeleton active paragraph={{ rows: 4 }} />
      </PresentationItem>
    );
 