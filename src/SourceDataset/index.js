import React from "react";
import config from "../config";
import client, { setAuth } from "../api/client";
import { Alert, Rate, Row, Col, Button, Tooltip } from "antd";
import ErrorMsg from "../components/ErrorMsg";
import DatasetlogoWithFallback from "../components/DatasetlogoWithFallback";
import Metrics from "./Metrics";
import { get, isArray, isEmpty } from "lodash-es";
import PresentationItem from "../components/PresentationItem";
import TaxonomicCoverage from "./TaxonomicCoverage";
import { RouterContext, buildRouter } from "../router";
import AgentPresentation from "./AgentPresentation";
import { getCountries } from "../api/enumeration";
import BibTex from "../components/BibTex";
import { LinkOutlined } from "@ant-design/icons";
import { marked } from "marked";
import DOMPurify from "dompurify";
// import ReferencePopover from "./ReferencePopover"
const IDENTIFIER_TYPES = {
  col: "https://www.checklistbank.org/dataset/",
  gbif: "https://www.gbif.org/dataset/",
  plazi: "http://publication.plazi.org/id/",
  doi: "https://doi.org/",
};
class SourceDatasetPage extends React.Component {
  constructor(props) {
    super(props);
    setAuth(this.props.auth);
    this.state = {
      datasetLoading: true,
      data: null,
      rank: null,
      countryAlpha2: {},
    };
  }

  componentDidMount = () => {
    this.getData();
    getCountries().then((res) => {
      const countryAlpha2 = {};
      res.forEach((c) => {
        countryAlpha2[c.alpha2] = c;
      });
      this.setState({ countryAlpha2 });
    });
  };

  componentDidUpdate(prevProps) {
    if (
      prevProps.sourceDatasetKey !== this.props.sourceDatasetKey ||
      prevProps.datasetKey !== this.props.datasetKey
    ) {
      this.getData();
    }
  }

  getData = () => {
    const { datasetKey, sourceDatasetKey, pageTitleTemplate } = this.props;
    if (!sourceDatasetKey) return;

    client(`${config.dataApi}dataset/${datasetKey}/source/${sourceDatasetKey}`)
      .then((dataset) => {
        if (pageTitleTemplate && get(dataset, "data.title")) {
          document.title = pageTitleTemplate.replace(
            "__dataset__",
            dataset.data.title
          );
        }
        this.setState({ data: dataset.data, datasetError: null });
      })
      .catch((err) => this.setState({ datasetError: err, data: null }));
  };

  getRank = () => {
    client(`${config.dataApi}vocab/rank`).then((res) =>
      this.setState({ rank: res.data.map((r) => r.name) })
    );
  };

  render() {
    const { datasetKey } = this.props;
    const { data, countryAlpha2, datasetError } = this.state;

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
              <Col flex="auto">
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
                {data && (
                  <React.Fragment>
                    <br />
                    <BibTex
                      style={{ marginLeft: "8px", height: "32px" }}
                      datasetKey={datasetKey}
                      sourceDatasetKey={
                        datasetKey !== data.key ? data.key : undefined
                      }
                    />
                  </React.Fragment>
                )}
              </Col>

              <Col style={{ textAlign: "right" }}>
                <DatasetlogoWithFallback
                  auth={this.props.auth}
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    marginRight: "8px",
                  }}
                  datasetKey={datasetKey}
                  sourceDatasetKey={data.key}
                />
              </Col>
            </Row>
          )}

          {data && (
            <React.Fragment>
              <PresentationItem label="Short name">
                {data.alias}
                <Tooltip
                  title="Visit in COL Checklistbank"
                  getPopupContainer={() =>
                    document.getElementsByClassName(`catalogue-of-life`)[0]
                  }
                >
                  <Button
                    type="link"
                    href={`https://www.checklistbank.org/dataset/${data.key}`}
                  >
                    <LinkOutlined />{" "}
                  </Button>
                </Tooltip>
              </PresentationItem>
              <PresentationItem label="Full name">
                {data.title}
              </PresentationItem>
              {(data.version || data.issued) && (
                <PresentationItem
                  label={`${data.version ? "Version" : ""}${
                    data.version && data.issued ? " / " : ""
                  }${data.issued ? "Issued" : ""}`}
                >
                  {(data.version || data.issued) &&
                    `${data.version ? data.version : ""}${
                      data.issued ? " / " + data.issued : ""
                    }`}
                </PresentationItem>
              )}
              <PresentationItem label="DOI">
                {data.doi ? (
                  <a href={`https://doi.org/${data.doi}`}>
                    <img
                      src="https://www.checklistbank.org/images/DOI_logo.png"
                      style={{ flex: "0 0 auto", height: "16px" }}
                      alt=""
                    ></img>
                    {data.doi}
                  </a>
                ) : (
                  "-"
                )}
              </PresentationItem>
              {data.contact && !isEmpty(data.contact) && (
                <PresentationItem label="Contact">
                  <AgentPresentation
                    countryAlpha2={countryAlpha2}
                    agent={data.contact}
                  />
                </PresentationItem>
              )}
              {data.publisher && !isEmpty(data.publisher) && (
                <PresentationItem label="Publisher">
                  <AgentPresentation
                    countryAlpha2={countryAlpha2}
                    agent={data.publisher}
                  />
                </PresentationItem>
              )}
              {data.creator && (
                <PresentationItem label="Creator">
                  <Row gutter={[8, 8]}>
                    {data.creator.map((a) => (
                      <Col span={8}>
                        <AgentPresentation
                          countryAlpha2={countryAlpha2}
                          agent={a}
                        />
                      </Col>
                    ))}
                  </Row>
                </PresentationItem>
              )}
              {data.editor && (
                <PresentationItem label="Editor">
                  <Row gutter={[8, 8]}>
                    {data.editor.map((a) => (
                      <Col span={8}>
                        <AgentPresentation
                          countryAlpha2={countryAlpha2}
                          agent={a}
                        />
                      </Col>
                    ))}
                  </Row>
                </PresentationItem>
              )}
              {data.contributor && (
                <PresentationItem label="Contributor">
                  <Row gutter={[8, 8]}>
                    {data.contributor.map((a) => (
                      <Col span={8}>
                        <AgentPresentation
                          countryAlpha2={countryAlpha2}
                          agent={a}
                        />
                      </Col>
                    ))}
                  </Row>
                </PresentationItem>
              )}
              <PresentationItem label="Taxonomic coverage">
                <TaxonomicCoverage
                  dataset={data}
                  datasetKey={datasetKey}
                />
              </PresentationItem>
              <Metrics
                datasetKey={datasetKey}
                dataset={data}
              />
              <PresentationItem label="Abstract">
              
                {data.description ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked.parse(data.description)),
                  }}
                ></span>
              ) : ""}
              </PresentationItem>
              <PresentationItem label="Taxonomic scope">
                {data.taxonomicScope || "-"}
              </PresentationItem>
              <PresentationItem label="Geographic scope">
                {data.geographicScope || "-"}
              </PresentationItem>
              <PresentationItem label="Temporal scope">
                {data.temporalScope || "-"}
              </PresentationItem>
              {/*             <PresentationItem label="Origin">
              {data.origin}
            </PresentationItem> */}
              {/*             <PresentationItem label="Type">{data.type}</PresentationItem>
               */}{" "}
              <PresentationItem label="License">
                {data.license || "-"}
              </PresentationItem>
              <PresentationItem label="Checklist Confidence">
                {<Rate value={data.confidence} disabled></Rate>}
              </PresentationItem>
              <PresentationItem label="Completeness">
                {data.completeness}
              </PresentationItem>
              <PresentationItem label="Website">
                {data.url ? (
                  <a href={data.url} target="_blank">
                    {data.url}
                  </a>
                ) : (
                  "-"
                )}
              </PresentationItem>
              {/* <PresentationItem label="Logo Url">
              {data.url && (
                <a href={data.logoUrl} target="_blank">
                  {data.logoUrl}
                </a>
              )}
            </PresentationItem> */}
              <PresentationItem label="ISSN">
                {data.issn ? (
                  <a
                    href={`https://portal.issn.org/resource/ISSN/${data.issn}`}
                  >
                    {data.issn}
                  </a>
                ) : (
                  "-"
                )}
              </PresentationItem>
              <PresentationItem label="GBIF key">
                {data.gbifKey ? (
                  <a href={`https://www.gbif.org/dataset/${data.gbifKey}`}>
                    {data.gbifKey}
                  </a>
                ) : (
                  "-"
                )}
              </PresentationItem>
              {/*             <PresentationItem label="GBIF publisher key">
              {data.gbifPublisherKey && (
                <a
                  href={`https://www.gbif.org/publisher/${data.gbifPublisherKey}`}
                >
                  {data.gbifPublisherKey}
                </a>
              )}
            </PresentationItem> */}
              <PresentationItem label="Identifiers">
                {data.identifier ? (
                  <ol
                    style={{
                      listStyle: "none",
                      paddingInlineStart: "0px",
                    }}
                  >
                    {Object.keys(data.identifier).map((i) => (
                      <li
                        style={{
                          float: "left",
                          marginRight: "8px",
                        }}
                      >
                        {`${i.toUpperCase()}: `}
                        {IDENTIFIER_TYPES[i] ? (
                          <a
                            href={`${IDENTIFIER_TYPES[i]}${data.identifier[i]}`}
                            target="_blank"
                          >
                            {data.identifier[i]}
                          </a>
                        ) : (
                          data.identifier[i]
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  "-"
                )}
              </PresentationItem>
              <PresentationItem label="Citation">
                {data.citation && (
                  <span
                    dangerouslySetInnerHTML={{ __html: data.citation }}
                  ></span>
                )}
              </PresentationItem>
              {/*             <PresentationItem label="Derived from (sourceKey)">
              {data.sourceKey}
            </PresentationItem> */}
              <PresentationItem label="Source">
                {data.source && isArray(data.source)
                  ? data.source.map(
                      (s) =>
                        !!s &&
                        (s.citation ? (
                          <div
                            style={{ display: "inline-block" }}
                            dangerouslySetInnerHTML={{ __html: s.citation }}
                          ></div>
                        ) : (
                          s.title
                        ))
                    )
                  : "-"}
              </PresentationItem>
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

export default function SourceDataset({
  sourceDatasetKey,
  datasetKey,
  pageTitleTemplate,
  auth,
  ...routerProps
}) {
  return (
    <RouterContext.Provider value={buildRouter(routerProps)}>
      <SourceDatasetPage
        sourceDatasetKey={sourceDatasetKey}
        datasetKey={datasetKey}
        pageTitleTemplate={pageTitleTemplate}
        auth={auth}
      />
    </RouterContext.Provider>
  );
}
