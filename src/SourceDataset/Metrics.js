import React from "react";
import config from "../config";
import client from "../api/client";
import MetricsPresentation from "./MetricsPresentation"


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
    const { dataset, datasetKey } = this.props;
    client(
      `${config.dataApi}dataset/${datasetKey}/source/${dataset.key}/metrics`
    ).then((res) => {
      this.setState({ metrics: res.data });
    });
  };

  getRank = () => {
    client(`${config.dataApi}vocab/rank`).then((res) =>
      this.setState({ rank: res.data.map((r) => r.name) })
    );
  };
  render = () => <MetricsPresentation {...this.state} dataset={this.props.dataset} />
}

export default Metrics;
