import React from "react";
import config from "../config";
import axios from "axios";
import { Skeleton } from "antd";
import PresentationItem from "../components/PresentationItem";
const _ = require("lodash");

const getLivingTaxa = (metrics, rank) =>
  (_.get(metrics, `taxaByRankCount.${rank}`) || 0) -
  (_.get(metrics, `extinctTaxaByRankCount.${rank}`) || 0);
const getExtinctTaxa = (metrics, rank) =>
  _.get(metrics, `extinctTaxaByRankCount.${rank}`) || 0;

class Metrics extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      metrics: null,
      loading: true,
    };
  }

  componentDidMount() {
    this.getData();
    this.getRank();
  }

  getData = () => {
    const { dataset, catalogueKey } = this.props;
    axios(
      `${config.dataApi}dataset/${catalogueKey}/source/${dataset.key}/metrics`
    ).then((res) => {
      this.setState({ metrics: res.data });
    });
  };

  getRank = () => {
    axios(`${config.dataApi}vocab/rank`).then((res) =>
      this.setState({ rank: res.data.map((r) => r.name) })
    );
  };
  synonymCount;
  render = () => {
    const { metrics, rank } = this.state;
    const { style, pathToTree } = this.props;
    return metrics && rank ? (
      <React.Fragment>
        <React.Fragment>
          <PresentationItem label={`Living species`}>
            {getLivingTaxa(metrics, "species").toLocaleString("en-GB")}
          </PresentationItem>
          <PresentationItem label={`Extinct species`}>
            {getExtinctTaxa(metrics, "species").toLocaleString("en-GB")}
          </PresentationItem>
        </React.Fragment>
        {Object.keys(metrics.taxaByRankCount)
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
      </React.Fragment>
    ) : (
      <PresentationItem label="">
        <Skeleton active paragraph={{ rows: 4 }} />
      </PresentationItem>
    );
  };
}

export default Metrics;
