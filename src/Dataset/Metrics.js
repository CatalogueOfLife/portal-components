import React from "react";
import config from "../config";
import axios from "axios";
import {Skeleton} from "antd";
import PresentationItem from "../components/PresentationItem";
const _ = require("lodash");

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
      this.setState({metrics: res.data})
    });
  };

  getRank = () => {
    axios(
      `${config.dataApi}vocab/rank`
    ).then(res => this.setState({rank: res.data.map(r => r.name)}))
  }
  synonymCount
  render = () => {
    const { metrics, rank } = this.state;
    const { style, pathToTree } = this.props;
    return metrics && rank 
      ? <React.Fragment> {Object.keys(metrics.taxaByRankCount).sort((a, b) => rank.indexOf(b) - rank.indexOf(a)).map((k) => (
        <PresentationItem label={_.startCase(k)} key={k}>
        {metrics.taxaByRankCount[k]}
      </PresentationItem>  
        ))}
        <PresentationItem label={"Synonyms"} key={"Synonyms"}>
        {metrics.synonymCount}
      </PresentationItem> 
        </React.Fragment>
      : <PresentationItem>
        <Skeleton active paragraph={{ rows: 4 }} />
      </PresentationItem>;
  };
}

export default Metrics;
