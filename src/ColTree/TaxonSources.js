import React from "react";
import { Popover, Spin, Row, Col } from "antd";
import { getDatasetsBatch, getPublishersBatch } from "../api/dataset";
import { CloseCircleOutlined } from "@ant-design/icons";
import _ from "lodash";
import DataLoader from "dataloader";
import { LinkTo } from "../router";

class TaxonSources extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      showInNode: false,
      loading: false,
    };
  }

  componentDidMount = () => {
    const { sourceDatasetKeys, publisherDatasetKeys, datasetKey } = this.props;
    this.datasetLoader = new DataLoader((ids) =>
      getDatasetsBatch(ids, datasetKey)
    );
    this.publisherLoader = new DataLoader((ids) =>
      getPublishersBatch(ids, datasetKey)
    );
    if (sourceDatasetKeys?.length < 4) {
      this.setState({ showInNode: true });
    }
    // Eagerly fetch the source-dataset details so the popover content is
    // ready before the user opens it. Otherwise the popover appears empty
    // on first click and only fills in after a network round-trip.
    if (sourceDatasetKeys?.length) {
      this.getData();
    }
    if (publisherDatasetKeys) {
      this.getPublisherData();
    }
  };

  getData = () => {
    const { sourceDatasetKeys } = this.props;
    if (!sourceDatasetKeys?.length) return;
    this.setState({ loading: true });
    const promises = sourceDatasetKeys.map((s) =>
      this.datasetLoader.load(s).then((dataset) => dataset)
    );
    Promise.all(promises).then((data) => {
      this.setState({ data: _.sortBy(data, ["alias"]), loading: false });
    });
  };

  getPublisherData = () => {
    const { publisherDatasetKeys } = this.props;
    const promises = Object.keys(publisherDatasetKeys).map((s) =>
      this.publisherLoader
        .load(s)
        .then((publisher) => ({ ...publisher, datasets: publisherDatasetKeys[s] }))
    );
    Promise.all(promises).then((data) => {
      this.setState({ publishers: _.sortBy(data, ["alias"]) });
    });
  };

  render = () => {
    const { data, showInNode, popOverVisible, loading } = this.state;
    const { taxon } = this.props;

    // Small orange link styling for the source list — matches the prod
    // CoL portal look. Defined inline so the popover content (rendered in
    // a portal that may sit outside the .catalogue-of-life wrapper) still
    // picks it up.
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
            loading && data.length === 0 ? (
              <Spin />
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
                {this.state.publishers &&
                  this.state.publishers.length > 0 && (
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
            this.setState({ popOverVisible: visible })
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
