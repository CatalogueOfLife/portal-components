import React from "react";
import config from "../config";

import axios from "axios";
import { LinkOutlined } from "@ant-design/icons";
import { Alert, Tag, Row, Col, Button, Rate } from "antd";
import SynonymTable from "./Synonyms";
import VernacularNames from "./VernacularNames";
import Distributions from "./Distributions";
import Classification from "./Classification";
import NameRelations from "./NameRelations";
import References from "./References";
import ErrorMsg from "../components/ErrorMsg";
import _, { includes } from "lodash";
import PresentationItem from "../components/PresentationItem";
import moment from "moment";
import history from "../history";
import BooleanValue from "../components/BooleanValue";
// import ReferencePopover from "./ReferencePopover"
import IncludesTable from "./Includes";
import DatasetlogoWithFallback from "../components/DatasetlogoWithFallback";

const md = 5;

class TaxonPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      taxon: null,
      info: null,
      taxonLoading: true,
      datasetLoading: true,
      infoLoading: true,
      classificationLoading: true,
      infoError: null,
      taxonError: null,
      classificationError: null,
      verbatimLoading: true,
      verbatimError: null,
      verbatim: null,
      logoUrl: null,
      sourceDataset: null,
      includes: [],
      rank: null,
    };
  }

  componentDidMount = () => {
    this.getTaxon();
    this.getInfo();
    this.getClassification();
    this.getRank();
    this.getIncludes();
  };

  getTaxon = () => {
    const { catalogueKey: datasetKey } = this.props;
    const { location: path } = history;
    const taxonKey = path.pathname.split("/taxon/")[1];
    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${datasetKey}/taxon/${taxonKey}`)
      .then((res) => {
        let promises = [res];
        if (_.get(res, "data.name.publishedInId")) {
          promises.push(
            axios(
              `${config.dataApi}dataset/${datasetKey}/reference/${_.get(
                res,
                "data.name.publishedInId"
              )}`
            ).then((publishedIn) => {
              res.data.name.publishedIn = publishedIn.data;
              return res;
            })
          );
        }

        if (_.get(res, "data.name")) {
          promises.push(
            axios(
              `${config.dataApi}dataset/${datasetKey}/name/${_.get(
                res,
                "data.name.id"
              )}/relations`
            ).then((relations) => {
              res.data.name.relations = relations.data;
              return Promise.all(
                relations.data.map((r) => {
                  return axios(
                    `${config.dataApi}dataset/${datasetKey}/name/${r.relatedNameId}`
                  ).then((n) => {
                    r.relatedName = n.data;
                  });
                })
              );
            })
          );
        }
        // sector keys are only present if its a catalogue
        if (_.get(res, "data.sectorKey")) {
          axios(
            `${config.dataApi}/dataset/${datasetKey}/sector/${_.get(
              res,
              "data.sectorKey"
            )}`
          ).then((sector) => {
            axios(
              `${config.dataApi}dataset/${_.get(
                sector,
                "data.subjectDatasetKey"
              )}/logo`
            )
              .then(() => {
                this.setState({
                  logoUrl: `${config.dataApi}dataset/${_.get(
                    sector,
                    "data.subjectDatasetKey"
                  )}/logo?size=MEDIUM`,
                });
              })
              .catch(() => {
                // ignore, there is no logo
              });

            axios(
              `${config.dataApi}dataset/${_.get(
                sector,
                "data.subjectDatasetKey"
              )}`
            ).then((dataset) => {
              this.setState({ sourceDataset: dataset.data });
            });
          });
        }

        return Promise.all(promises);
      })
      .then((res) => {
        this.setState({
          taxonLoading: false,
          taxon: res[0].data,
          taxonError: null,
        });
      })
      .catch((err) => {
        this.setState({ taxonLoading: false, taxonError: err, taxon: null });
      });
  };

  getInfo = () => {
    const { catalogueKey: datasetKey } = this.props;
    const { location: path } = history;
    const taxonKey = path.pathname.split("/taxon/")[1];

    axios(`${config.dataApi}dataset/${datasetKey}/taxon/${taxonKey}/info`)
      .then((res) => {
        this.setState({ infoLoading: false, info: res.data, infoError: null });
      })
      .catch((err) => {
        this.setState({ infoLoading: false, infoError: err, info: null });
      });
  };

  getRank = () => {
    axios(`${config.dataApi}vocab/rank`).then((res) =>
      this.setState({ rank: res.data.map((r) => r.name) })
    );
  };
  getClassification = () => {
    const { catalogueKey: datasetKey } = this.props;
    const { location: path } = history;
    const taxonKey = path.pathname.split("/taxon/")[1];
    axios(
      `${config.dataApi}dataset/${datasetKey}/taxon/${taxonKey}/classification`
    )
      .then((res) => {
        this.setState({
          classificationLoading: false,
          classification: res.data,
          classificationError: null,
        });
      })
      .catch((err) => {
        this.setState({
          classificationLoading: false,
          classificationError: err,
          classification: null,
        });
      });
  };

  getIncludes = () => {
    const { catalogueKey: datasetKey } = this.props;
    const { location: path } = history;
    const taxonKey = path.pathname.split("/taxon/")[1];

    axios(
      `${config.dataApi}dataset/${datasetKey}/nameusage/search?TAXON_ID=${taxonKey}&facet=rank&status=accepted&status=provisionally%20accepted&limit=0`
    )
      .then((res) => {
        this.setState({
          includesLoading: false,
          includes: _.get(res, "data.facets.rank") || [],
        });
      })
      .catch((err) => {
        this.setState({
          includesLoading: false,
          includes: [],
        });
      });
  };

  render() {
    const {
      catalogueKey,
      pathToTree,
      pathToSearch,
      pathToDataset,
    } = this.props;
    const {
      taxon,
      info,
      classification,
      sourceDataset,
      includes,
      rank,
      taxonError,
      synonymsError,
      classificationError,
      infoError,
    } = this.state;

    const synonyms =
      info && info.synonyms && info.synonyms.length > 0
        ? info.synonyms.filter((s) => s.status !== "misapplied")
        : [];
    const misapplied =
      info && info.synonyms && info.synonyms.length > 0
        ? info.synonyms.filter((s) => s.status === "misapplied")
        : [];

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
          {taxonError && (
            <Alert message={<ErrorMsg error={taxonError} />} type="error" />
          )}
          {taxon && (
            <Row>
              <Col span={sourceDataset ? 18 : 23}>
{/*                 <h1
                  style={{
                    fontSize: "30px",
                    fontWeight: "400",
                    paddingLeft: "10px",
                    display: "inline-block",
                    textTransform: "none",
                  }}
                >
                  Taxon Details
                </h1> */}
                <h1
                  style={{
                    fontSize: "30px",
                    fontWeight: "400",
                    paddingLeft: "10px",
                    display: "inline-block",
                    textTransform: "none",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: taxon.labelHtml,
                  }}
                />
                  
               
              </Col>
              <Col span={1}>
                {taxon.provisional && <Tag color="red">Provisional</Tag>}
              </Col>
              {sourceDataset && (
                <Col span={5} style={{ textAlign: "right" }}>
                  <DatasetlogoWithFallback
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                      marginRight: "8px",
                    }}
                    datasetKey={sourceDataset.key}
                  />
                </Col>
              )}
            </Row>
          )}

          {_.get(taxon, "labelHtml") && (
            <PresentationItem md={md} label="Name">
              <span
                dangerouslySetInnerHTML={{
                  __html: taxon.labelHtml,
                }}
              />
            </PresentationItem>
          )}
          {_.get(taxon, "name.publishedIn.citation") && (
            <PresentationItem md={md} label="Published in">
              {_.get(taxon, "name.publishedIn.citation")}
            </PresentationItem>
          )}
          {_.get(taxon, "status") && (
            <PresentationItem md={md} label="Status">
              {`${_.get(taxon, "status")} ${_.get(taxon, "name.rank")}`}
            </PresentationItem>
          )}

          {_.get(taxon, "name.nomStatus") && (
            <PresentationItem md={md} label="Nomenclatural Status">
              {_.get(taxon, "name.nomStatus")}
            </PresentationItem>
          )}
          {/*           <PresentationItem md={md} label="Extinct">
            <BooleanValue value={_.get(taxon, "extinct")} />
          </PresentationItem> */}
          {/* 
          <PresentationItem md={md} label="Fossil">
            <BooleanValue value={_.get(taxon, "fossil")} />
          </PresentationItem>
          <PresentationItem md={md} label="Recent">
            <BooleanValue value={_.get(taxon, "recent")} />
          </PresentationItem> */}

          {_.get(taxon, "name.relations") && taxon.name.relations.length > 0 && (
            <PresentationItem
              md={md}
              label="Relations"
              helpText={
                <a href="https://github.com/Sp2000/colplus/blob/master/docs/NAMES.md#name-relations">
                  Name relations are explained here
                </a>
              }
            >
              <NameRelations
                style={{ marginTop: "-3px" }}
                data={taxon.name.relations}
              />
            </PresentationItem>
          )}
          {infoError && (
            <Alert message={<ErrorMsg error={infoError} />} type="error" />
          )}

          {synonyms && synonyms.length > 0 && (
            <PresentationItem md={md} label="Synonyms">
              <SynonymTable
                data={synonyms}
                style={{ marginTop: "-3px" }}
                catalogueKey={catalogueKey}
              />
            </PresentationItem>
          )}

          {misapplied && misapplied.length > 0 && (
            <PresentationItem md={md} label="Misapplied names">
              <SynonymTable
                data={misapplied}
                style={{ marginBottom: 16, marginTop: "-3px" }}
                catalogueKey={catalogueKey}
              />
            </PresentationItem>
          )}
          {synonymsError && (
            <Alert message={<ErrorMsg error={synonymsError} />} type="error" />
          )}
          {classificationError && (
            <Alert
              message={<ErrorMsg error={classificationError} />}
              type="error"
            />
          )}
          {classification && (
            <PresentationItem md={md} label="Classification">
              <Classification
                style={{ marginTop: "-3px", marginLeft: "-3px" }}
                data={classification}
                taxon={taxon}
                catalogueKey={catalogueKey}
                pathToTree={pathToTree}
              />
            </PresentationItem>
          )}
          {includes.length > 1 && rank && taxon && (
            <PresentationItem md={md} label="Includes">
              <IncludesTable
                style={{ marginTop: "-3px", marginLeft: "-3px" }}
                data={includes}
                rank={rank}
                taxon={taxon}
                pathToSearch={pathToSearch}
              />
            </PresentationItem>
          )}
          {_.get(info, "vernacularNames") && taxon && (
            <PresentationItem md={md} label="Vernacular names">
              <VernacularNames
                style={{ marginTop: "-3px", marginLeft: "-3px" }}
                data={info.vernacularNames}
                datasetKey={taxon.datasetKey}
                catalogueKey={catalogueKey}
              />
            </PresentationItem>
          )}
          {_.get(info, "distributions") && (
            <PresentationItem md={md} label="Distributions">
              <Distributions
                style={{ marginTop: "-3px" }}
                data={info.distributions}
                datasetKey={catalogueKey}
              />
            </PresentationItem>
          )}
          {_.get(taxon, "environments") && (
            <PresentationItem md={md} label="Environment(s)">
              {_.get(taxon, "environments").join(", ")}
            </PresentationItem>
          )}

          {/*_.get(info, "references") && (
            <PresentationItem md={md} label="References">
             <CslReferences references={info.references}></CslReferences>

            </PresentationItem>
          ) */}

          {_.get(taxon, "remarks") && (
            <PresentationItem md={md} label="Additional Data">
              {taxon.remarks}
            </PresentationItem>
          )}

          {_.get(info, "references") && !_.isEmpty(_.get(info, "references")) && (
            <PresentationItem md={md} label="References">
              <References
                data={Object.keys(_.get(info, "references")).map((k) =>
                  _.get(info, `references[${k}]`)
                )}
                style={{ marginTop: "-3px" }}
              />
            </PresentationItem>
          )}
          <Row>
            {_.get(taxon, "accordingTo") && (
              <Col span={12}>
                <PresentationItem md={md * 2} label="According to">
                  {`${_.get(taxon, "accordingTo")}`}
                  {_.get(taxon, "accordingToDate") &&
                    `, ${moment(_.get(taxon, "accordingToDate")).format("LL")}`}
                </PresentationItem>
              </Col>
            )}
            {/*           <Col span={12}>
          {_.get(taxon, "origin") && (
            <PresentationItem md={md * 2} label="Origin">
              {_.get(taxon, "origin")}
            </PresentationItem>
          )}
          </Col>   */}
          </Row>

          {_.get(sourceDataset, "title") && (
            <PresentationItem md={md} label="Source database">
              <div style={{ display: "inline-block" }}>
                {" "}
                <a
                  href={`${pathToDataset}${_.get(sourceDataset, "key")}`}
                  onClick={() => {
                    window.location = `${pathToDataset}${_.get(
                      sourceDataset,
                      "key"
                    )}`;
                  }}
                >
                  {`${_.get(sourceDataset, "alias")}: ${_.get(
                    sourceDataset,
                    "title"
                  )}`}
                </a>
                <span style={{ marginLeft: "10px" }}>
                  {_.get(sourceDataset, "completeness") &&
                    _.get(sourceDataset, "completeness") + "%"}
                </span>
                {_.get(sourceDataset, "confidence") && (
                  <Rate
                    style={{ marginLeft: "10px" }}
                    value={_.get(sourceDataset, "confidence")}
                    disabled
                  />
                )}
              </div>
            </PresentationItem>
          )}
          {_.get(taxon, "link") && (
            <PresentationItem md={md} label="Link to original resource">
              <a href={_.get(taxon, "link")}>{_.get(taxon, "link")}</a>
            </PresentationItem>
          )}
        </div>
      </React.Fragment>
    );
  }
}

export default TaxonPage;
