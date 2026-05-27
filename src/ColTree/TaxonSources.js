import React from "react";
import { Popover, Spin, Row, Col } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import _ from "lodash";
import { LinkTo } from "../router";
import { TreeCacheContext } from "./treeCache";

class TaxonSources extends React.Component {
  static contextType = TreeCacheContext;

  constructor(props) {
    super(props);
    this.state = {
      data: [],
      showInNode: false,
      loading: false,
    };
  }

  componentDidMount = () => {
    const { sourceDatasetKeys } = this.props;
    if (sourceDatasetKeys && sourceDatasetKeys.length < 4) {
      this.setState({ showInNode: true }, this.getData);
    }
  };

  getData = () => {
    const { sourceDatasetKeys } = this.props;
    const { datasetLoader } = this.context || {};
    if (!sourceDatasetKeys?.length || !datasetLoader) return;
    this.setState({ loading: true });
    Promise.all(sourceDatasetKeys.map((s) => datasetLoader.load(s))).then(
      (data) => {
        this.setState({ data: _.sortBy(data, ["alias"]), loading: false });
      }
    );
  };

  getPublisherData = () => {
    const { publisherDatasetKeys } = this.props;
    const { publisherLoader } = this.context || {};
    if (!publisherDatasetKeys || !publisherLoader) return;
    Promise.all(
      Object.keys(publisherDatasetKeys).map((s) =>
        publisherLoader
          .load(s)
          .then((publisher) => ({
            ...publisher,
            datasets: publisherDatasetKeys[s],
          }))
      )
    ).then((data) => {
      this.setState({ publishers: _.sortBy(data, ["alias"]) });
    });
  };

  render = () => {
    const { data, showInNode, popOverVisible, loading } = this.state;
    const { taxon } = this.props;
    const linkStyle = { color: "orange", fontSize: "11px" };

    if (showInNode) {
      return data
        .filter((d) => !!d)
        .map((d, index) => (
          <LinkTo
            to="source"
            args={d.key}
            key={d.key}
            className="col-tree-data-source"
            style={linkStyle}
          >
            {(index ? ", " : "") + (d.alias || d.key)}
          </LinkTo>
        ));
    }

    return (
      <div style={{ display: "inline" }} id={`taxon_sources_${taxon.id}`}>
        <Popover
          getPopupContainer={() =>
            document.getElementById(`taxon_sources_${taxon.id}`)
          }
          content={
            loading || data.length === 0 ? (
              <div
                style={{ minWidth: "200px", textAlign: "center", padding: "8px 0" }}
              >
                <Spin size="small" />
              </div>
            ) : (
              <div style={{ maxWidth: "500px" }}>
                {data.length > 0 && (
                  <div>
                    <strong>Source databases:</strong>{" "}
                    {data
                      .filter((d) => !!d)
                      .map((d, index) => (
                        <LinkTo
                          to="source"
                          args={d.key}
                          key={d.key}
                          className="col-tree-data-source"
                          style={linkStyle}
                        >
                          {(index ? ", " : "") + (d.alias || d.key)}
                        </LinkTo>
                      ))}
                  </div>
                )}
                {this.state.publishers && this.state.publishers.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <strong>Publishers:</strong>
                    {this.state.publishers
                      .filter((d) => !!d)
                      .map((d) => (
                        <Row key={d.id}>
                          <Col span={8} style={{ textAlign: "right" }}>
                            {d.alias}:
                          </Col>
                          <Col span={12} style={{ paddingLeft: "20px" }}>
                            {d.datasets.length.toLocaleString("en-GB")} datasets
                          </Col>
                        </Row>
                      ))}
                  </div>
                )}
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
              if (visible && this.state.data.length === 0) this.getData();
              if (
                visible &&
                this.props.publisherDatasetKeys &&
                !this.state.publishers
              ) {
                this.getPublisherData();
              }
            })
          }
          trigger="click"
          placement="rightTop"
        >
          <a
            className="col-tree-data-source"
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer", color: "orange", fontSize: "11px" }}
            onClick={(e) => e.preventDefault()}
          >
            Multiple sources
          </a>
        </Popover>
      </div>
    );
  };
}

export default TaxonSources;
