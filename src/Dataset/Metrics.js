import React from "react";
import config from "../config";
import axios from "axios";
import { Skeleton } from "antd";
import PresentationItem from "../components/PresentationItem";
import MetricsPresentation from "./MetricsPresentation"
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
      rank: null,
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
  render = () => <MetricsPresentation {...this.state}/>
}

export default Metrics;
