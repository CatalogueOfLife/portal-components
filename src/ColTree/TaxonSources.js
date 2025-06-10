import React from "react";
import { Popover, Spin, Row, Col } from "antd";
import { getDatasetsBatch, getPublishersBatch } from "../api/dataset";
import { CloseCircleOutlined } from "@ant-design/icons";
import _ from 'lodash'
import DataLoader from "dataloader";
import config from "../config";

class TaxonSources extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      showInNode: false,
      loading: false,
    };
  }

/*   componentDidMount = () => {
    const { datasetSectors, catalogueKey } = this.props;
    this.datasetLoader = new DataLoader((ids) =>
      getDatasetsBatch(ids, catalogueKey)
    );
    if (Object.keys(datasetSectors).length < 4) {
      this.setState({ showInNode: true }, this.getData);
    }
  };

  getData = () => {
    this.setState({ loading: true });
    const { datasetSectors } = this.props;
    const promises = Object.keys(datasetSectors).map((s) =>
      this.datasetLoader.load(s).then((dataset) => dataset)
    );

    Promise.all(promises).then((data) => {
      this.setState({ data:_.sortBy(data, ['alias']), loading: false });
    });
  }; */

  componentDidMount = () => {
    const { sourceDatasetKeys, publisherDatasetKeys, catalogueKey } = this.props;
    this.datasetLoader = new DataLoader((ids) =>
      getDatasetsBatch(ids, catalogueKey)
    );
    this.publisherLoader = new DataLoader((ids) =>
      getPublishersBatch(ids, catalogueKey)
    );
    if (sourceDatasetKeys?.length < 4) {
      this.setState({ showInNode: true }, this.getData);
    }
    if(publisherDatasetKeys) {
          this.getPublisherData();

    }
  };

  getData = () => {
    this.setState({ loading: true });
    const { sourceDatasetKeys, publisherDatasetKeys } = this.props;
    const promises = sourceDatasetKeys.map((s) =>
      this.datasetLoader.load(s).then((dataset) => dataset)
    );

    Promise.all(promises).then((data) => {
      this.setState({ data: _.sortBy(data, ["alias"]), loading: false });
    });


  };

   getPublisherData = () => {
    const {  publisherDatasetKeys } = this.props;
    const promises = Object.keys(publisherDatasetKeys).map((s) =>
      this.publisherLoader.load(s).then((publisher) => ({...publisher, datasets: publisherDatasetKeys[s] }))
    );

    Promise.all(promises).then((data) => {
      this.setState({ publishers: _.sortBy(data, ["alias"]) });
    });

    
  };

  render = () => {
    const { data, showInNode, popOverVisible, loading } = this.state;
    const { taxon, catalogueKey, pathToDataset } = this.props;

    return showInNode ? (
      data
        .filter((d) => !!d)
        .map((d, index) => (
          <a
            className="col-tree-data-source"
            key={d.key}
            href={`${pathToDataset}${d.key}`}
            onClick={() => {
              window.location.href = `${pathToDataset}${d.key}`;
            }}
          >
            {(index ? ", " : "") + (d.alias || d.key)}
          </a>
        ))
    ) : (
      <div style={{ display: "inline" }} id={`taxon_sources_${taxon.id}`}>
        <Popover
          getPopupContainer={() =>
            document.getElementById(`taxon_sources_${taxon.id}`)
          }
          content={
            loading ? (
              <Spin />
            ) : (
              <div style={{ maxWidth: "400px" }}>
               <div> <span>Source databases: </span>{" "}
                {data
                  .filter((d) => !!d)
                  .map((d, index) => (
                    <a
                      className="col-tree-data-source"
                      key={d.key}
                      href={`${pathToDataset}${d.key}`}
                      onClick={() => {
                        window.location.href = `${pathToDataset}${d.key}`;
                      }}
                    >
                      {(index ? ", " : "") + (d.alias || d.key)}
                    </a>
                  ))}
              </div>
              { this.state.publishers && this.state.publishers.length > 0 && <div>
                <div>Publishers: </div>{" "}
                {this.state.publishers
                  .filter((d) => !!d)
                  .map((d, index) => (
                    <Row
                      key={d.id}
                     
                    >
                      <Col span={4} style={{textAlign: "right"}}>{d.alias}:</Col>
                      <Col span={12} style={{paddingLeft: "20px"}}>{d.datasets.length.toLocaleString("en-GB")} datasets</Col>
                       
                    </Row>
                  ))}
              </div>}
              </div>
            )
            
          }
          title={
            <Row>
              <Col flex="auto">
                <span dangerouslySetInnerHTML={{ __html: taxon.name }} />
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
              if (visible && data.length === 0) {
                this.getData();
              }
            })
          }
          trigger="click"
          placement="rightTop"
        >
          <a className="col-tree-data-source"  href="">
            Multiple sources
          </a>
        </Popover>
      </div>
    );
  };
}

export default TaxonSources;
