import React from "react";
import config from "../config";
import axios from "axios";
import MetricsPresentation from "./MetricsPresentation"
const _ = require("lodash");


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
  render = () => <MetricsPresentation {...this.state} dataset={this.props.dataset} pathToSearch={this.props.pathToSearch}/>
}

export default Metrics;
