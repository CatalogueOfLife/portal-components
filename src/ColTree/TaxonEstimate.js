import React from "react";
import { Popover, Spin, Row, Col } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import axios from 'axios'
import config from "../config";

class TaxonEstimate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      loading: false,
    };
  }

  

  getData = () => {
    this.setState({ loading: true });
    const { estimate } = this.props;

    return axios(
        `${config.dataApi}dataset/${estimate.datasetKey}/reference/${estimate.referenceId}`
      ).then( ({data}) => this.setState({data, loading: false}))
  };

  render = () => {
    const { data, popOverVisible, loading } = this.state;
    const { taxon } = this.props;

    return  <div style={{ display: "inline" }} id={`taxon_estimates_${taxon.id}`}>
        <Popover
          getPopupContainer={() =>
            document.getElementById(`taxon_estimates_${taxon.id}`)
          }
          content={
            (loading || !data) ? (
              <Spin />
            ) : (
              <div style={{ maxWidth: "400px" }}>
                {data.citation}
              </div>
            )
          }
          title={
            <Row>
              <Col flex="auto">
              {taxon.estimate.toLocaleString("en-GB")} est. spp. of <span dangerouslySetInnerHTML={{ __html: taxon.name }} />
              </Col>
              <Col>
                <span>
                  <CloseCircleOutlined
                    onClick={() => {
                      this.setState({ popOverVisible: false });
                    }}
                  />
                </span>
              </Col>
            </Row>
          }
          visible={popOverVisible}
          onVisibleChange={(visible) =>
            this.setState({ popOverVisible: visible }, () => {
              if (visible && !data) {
                this.getData();
              }
            })
          }
          trigger="click"
          placement="rightTop"
        >
          <a style={{ fontSize: "11px" }} href="">
          {taxon.estimate.toLocaleString("en-GB")} <span> est. spp.</span>
          </a>
        </Popover>
      </div>
   
  };
}

export default TaxonEstimate;
