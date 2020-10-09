import React from "react";
import config from "../config";

import axios from "axios";
import { Alert, Rate, Row, Col } from "antd";
import ErrorMsg from "../components/ErrorMsg";
import DatasetlogoWithFallback from "../components/DatasetlogoWithFallback";
import Metrics from "./Metrics";
import _ from "lodash";
import PresentationItem from "../components/PresentationItem";
import history from "../history";
import TaxonomicCoverage from "./TaxonomicCoverage";
// import ReferencePopover from "./ReferencePopover"

class DatasetPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      datasetLoading: true,
      data: null,
      rank: null,
    };
  }

  componentDidMount = () => {
    this.getData();
  };

  getData = () => {
    const { catalogueKey } = this.props;

    const { location: path } = history;
    const pathParts = path.pathname.split("/");
    const datasetKey = pathParts[pathParts.length - 1];

    axios(`${config.dataApi}dataset/${catalogueKey}/source/${datasetKey}`)
      .then((dataset) => {
        this.setState({ data: dataset.data, datasetError: null });
      })
      .catch((err) => this.setState({ datasetError: err, data: null }));
  };

  getRank = () => {
    axios(`${config.dataApi}vocab/rank`).then((res) =>
      this.setState({ rank: res.data.map((r) => r.name) })
    );
  };

  render() {
    const { pathToTree, catalogueKey } = this.props;
    const {
      data,

      datasetError,
    } = this.state;

    return (
      <React.Fragment>
        <div
          className="catalogue-of-life"
          style={{
            background: "#fff",
            padding: 24,
            minHeight: 280,
            margin: "16px 0",
            fontSize: "12px",
          }}
        >
          {datasetError && (
            <Alert message={<ErrorMsg error={datasetError} />} type="error" />
          )}
          {data && (
            <Row>
              <Col span={12}>
                {/*                 <h1
                  style={{ fontSize: "30px", fontWeight: '400', paddingLeft: "10px" , display: 'inline-block', textTransform: 'none'}}
                  
                    >Database details</h1> */}
                <h1
                  style={{
                    fontSize: "30px",
                    fontWeight: "400",
                    paddingLeft: "10px",
                    display: "inline-block",
                    textTransform: "none",
                  }}
                >
                  {data.title}
                </h1>
              </Col>

              <Col span={12} style={{ textAlign: "right" }}>
                <DatasetlogoWithFallback
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    marginRight: "8px",
                  }}
                  datasetKey={data.key}
                />
              </Col>
            </Row>
          )}

          {data && (
            <React.Fragment>
              <PresentationItem label="Short name">
                {data.alias}
              </PresentationItem>
              <PresentationItem label="Full name">
                {data.title}
              </PresentationItem>
              <PresentationItem label="Version">
                {(data.version || data.released) &&
                  `${data.version ? data.version : ""}${
                    data.released ? " Received by CoL: " + data.released : ""
                  }`}
              </PresentationItem>
              {data.author && _.isArray(data.authors) && (
                <PresentationItem label="Authors">
                  {data.authors.map((a) => a.name).join(", ")}
                </PresentationItem>
              )}
              {data.editors && _.isArray(data.editors) && (
                <PresentationItem label="Editors">
                  {data.editors.map((a) => a.name).join(", ")}
                </PresentationItem>
              )}
              <PresentationItem label="Taxonomic coverage">
                <TaxonomicCoverage
                  dataset={data}
                  catalogueKey={catalogueKey}
                  pathToTree={pathToTree}
                />
              </PresentationItem>
              <PresentationItem label="English name of the Group">
                {data.group}
              </PresentationItem>
              <Metrics catalogueKey={catalogueKey} dataset={data} />
              <PresentationItem label="Abstract">
                {data.description}
              </PresentationItem>

              <PresentationItem label="Organisation">
                {data.organisations && data.organisations.join(", ")}
              </PresentationItem>
              <PresentationItem label="Website">
                {data.website && (
                  <a href={data.website} target="_blank">
                    {data.website}
                  </a>
                )}
              </PresentationItem>
              {/*  
          <PresentationItem label="Contact">
            {data.contact}
          </PresentationItem>


           <PresentationItem label="Type">
            {data.type}
          </PresentationItem> */}

              <PresentationItem label="Geographic scope">
                {data.geographicScope || "-"}
              </PresentationItem>
              <PresentationItem label="Completeness">
                {data.completeness}
              </PresentationItem>
              <PresentationItem label="Checklist Confidence">
                {<Rate defaultValue={data.confidence} disabled></Rate>}
              </PresentationItem>

              <PresentationItem label="Citation">
                {data.citation || "-"}
              </PresentationItem>

              <PresentationItem label="License">
                {data.license || "-"}
              </PresentationItem>

              {data.gbifKey && (
                <PresentationItem label="GBIF">
                  <a
                    href={`https://www.gbif.org/dataset/${data.gbifKey}`}
                    target="_blank"
                  >
                    Browse in GBIF
                  </a>
                </PresentationItem>
              )}

              {/*           <PresentationItem label="Created">
          {`${data.created} by ${data.createdByUser}`}
          </PresentationItem>
          <PresentationItem label="Modified">
          {`${data.modified} by ${data.modifiedByUser}`}
          </PresentationItem> */}
              {/*           <section className="code-box" style={{marginTop: '32px'}}>
          <div className="code-box-title">Settings</div>
        </section> */}
            </React.Fragment>
          )}
        </div>
      </React.Fragment>
    );
  }
}

export default DatasetPage;
