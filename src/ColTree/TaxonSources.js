import React from "react";
import { Popover, Spin, Row, Col } from "antd";
import { getDatasetsBatch } from "../api/dataset";
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
    const { sourceDatasetKeys, catalogueKey } = this.props;
    this.datasetLoader = new DataLoader((ids) =>
      getDatasetsBatch(ids, catalogueKey)
    );
    if (sourceDatasetKeys?.length < 4) {
      this.setState({ showInNode: true }, this.getData);
    }
  };

  getData = () => {
    this.setState({ loading: true });
    const { sourceDatasetKeys } = this.props;
    const promises = sourceDatasetKeys.map((s) =>
      this.datasetLoader.load(s).then((dataset) => dataset)
    );

    Promise.all(promises).then((data) => {
      this.setState({ data: _.sortBy(data, ["alias"]), loading: false });
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
                <span>Source databases: </span>{" "}
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
