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
import btoa from "btoa"
import Page404 from "../components/Page404"
import TaxonBreakdown from "./TaxonBreakdown";

const md = 5;

class TaxonPage extends React.Component {
  constructor(props) {
    super(props);
    if(this.props.auth){
      axios.defaults.headers.common['Authorization'] = `Basic ${btoa(this.props.auth)}`;
    } 
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
      nomStatus: null,
      catalogue: null,
      referenceIndexMap: {}
    };
  }

  componentDidMount = () => {
    const { pathToTaxon } = this.props;
    const { location } = history;
    const uri = `${location.pathname}${location.search}`
    const taxonKey = uri.split(pathToTaxon)[1];
    this.getCatalogue();
    this.getTaxon(taxonKey);
    this.getInfo(taxonKey);
    this.getClassification(taxonKey);
    this.getRank(taxonKey);
    this.getIncludes(taxonKey);
    this.getNomStatus(taxonKey);
  };

  getTaxon = (taxonKey) => {
    const { catalogueKey: datasetKey, pageTitleTemplate } = this.props;
    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${datasetKey}/taxon/${taxonKey}`)
      .then((res) => {
        let promises = [res];
        if(pageTitleTemplate && _.get(res, "data.label")){
          document.title = pageTitleTemplate.replace("__taxon__", res.data.label)
        }
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
              return Promise.allSettled(
                relations.data.map((r) => {
                  return axios(
                    `${config.dataApi}dataset/${datasetKey}/name/${r.relatedNameId}`
                  ).then((n) => {
                    r.relatedName = n.data;
                  });
                })
              ).then(results => {
                return results.filter(r => r.status = 'fulfilled').map(r => r.value)
              });
            })
          );
        }
        // sector keys are only present if its a catalogue
        if (_.get(res, "data.sectorKey")) {
          axios(
            `${config.dataApi}dataset/${datasetKey}/sector/${_.get(
              res,
              "data.sectorKey"
            )}`
          ).then((sector) => {
            axios(
              `${config.dataApi}image/${datasetKey}/source/${_.get(
                sector,
                "data.subjectDatasetKey"
              )}/logo`
            )
              .then(() => {
                this.setState({
                  logoUrl: `${config.dataApi}image/${datasetKey}/source/${_.get(
                    sector,
                    "data.subjectDatasetKey"
                  )}/logo?size=MEDIUM`,
                });
              })
              .catch(() => {
                // ignore, there is no logo
              });

            axios(
              `${config.dataApi}dataset/${datasetKey}/source/${_.get(
                sector,
                "data.subjectDatasetKey"
              )}`
            ).then((dataset) => {
              this.setState({ sourceDataset: dataset.data });
            });
          });
        }

        return Promise.allSettled(promises).then(results => {
          return results.filter(r => r.status = 'fulfilled').map(r => r.value)
        });
      })
      .then((res) => {
        this.setState({
          taxonLoading: false,
          taxon: res[0].data,
          taxonError: null,
        });
      })
      .catch((err) => {
        if(_.get(err, "response.status") === 404){
          this.fetchSynonymAndRedirect(taxonKey)
        } else {
          this.setState({ taxonLoading: false, taxonError: err, taxon: null });
        }
        
      });
  };

  getCatalogue = () => {
    const { catalogueKey } = this.props;
    axios(`${config.dataApi}dataset/${catalogueKey}`)
      .then((res) => {
        this.setState({ catalogue: res.data});
      })
      .catch((err) => {
        // ignore
      });
  }

  getInfo = (taxonKey) => {
    const { catalogueKey: datasetKey } = this.props;
    axios(`${config.dataApi}dataset/${datasetKey}/taxon/${taxonKey}/info`)
      .then((res) => {
        let referenceIndexMap = {}
        if(_.get(res, 'data.references')){
          Object.keys(res.data.references).forEach((k,i) => {
            referenceIndexMap[k] = (i+1).toString();
          })
        }
        this.setState({ infoLoading: false, info: res.data, infoError: null, referenceIndexMap });
      })
      .catch((err) => {
        if(_.get(err, "response.status") === 404){
          this.fetchSynonymAndRedirect(taxonKey)
        } else {
          this.setState({ infoLoading: false, infoError: err, info: null });
        }
        
      });
  };

  getRank = () => {
    axios(`${config.dataApi}vocab/rank`).then((res) =>
      this.setState({ rank: res.data.map((r) => r.name) })
    );
  };

  getNomStatus = () => {
    axios(`${config.dataApi}vocab/nomstatus`).then((res) =>
      this.setState({
        nomStatus: res.data.reduce((a, c) => ((a[c.name] = c), a), {}),
      })
    );
  };

  getClassification = (taxonKey) => {
    const { catalogueKey: datasetKey } = this.props;
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

  getIncludes = (taxonKey) => {
    const { catalogueKey: datasetKey } = this.props;

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

  fetchSynonymAndRedirect = (taxonKey) => {
    const { catalogueKey: datasetKey, pathToTaxon } = this.props;

    axios(
      `${config.dataApi}dataset/${datasetKey}/synonym/${taxonKey}`
    )
      .then((res) => {
        window.location.href = `${pathToTaxon}${_.get(res, 'data.accepted.id')}`;
      })
      .catch((err) => {
        if(_.get(err, "response.status") === 404){
          this.setState({status: 404})
        } 
      });
  }

  render() {
    const {
      catalogueKey,
      pathToTaxon,
      pathToSearch,
      pathToDataset,
      pathToTree,
    } = this.props;
    const {
      taxon,
      info,
      classification,
      sourceDataset,
      includes,
      rank,
      nomStatus,
      taxonError,
      synonymsError,
      classificationError,
      infoError,
      status,
      catalogue,
      referenceIndexMap
    } = this.state;
    const genusRankIndex = rank ? rank.indexOf("genus") : -1;

   /*  const synonyms =
      info && info.synonyms && info.synonyms.length > 0
        ? info.synonyms.filter((s) => s.status !== "misapplied")
        : [];
    const misapplied =
      info && info.synonyms && info.synonyms.length > 0
        ? info.synonyms.filter((s) => s.status === "misapplied")
        : []; */
        const homotypic = _.get(info, 'synonyms.homotypic',[])
        const heterotypic = _.get(info, 'synonyms.heterotypic',[])
        const misapplied = _.get(info, 'synonyms.misapplied',[])
        const synonyms = [...homotypic.map(h => ({...h, __homotypic: true})), ...heterotypic]
    return status === 404 ? <Page404 /> :
      <React.Fragment>
        <div
          className="catalogue-of-life"
          style={{
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
                <a href=""></a>
                {taxon.provisional && <Tag color="red">Provisional</Tag>}
              </Col>
              {sourceDataset && (
                <Col span={5} style={{ textAlign: "right" }}>
                  <DatasetlogoWithFallback
                    auth={this.props.auth}
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                      marginRight: "8px",
                    }}
                    catalogueKey={catalogueKey}
                    datasetKey={sourceDataset.key}
                  />
                </Col>
              )}
            </Row>
          )}
          {_.get(taxon, "id") && (
            <PresentationItem md={md} label={_.get(this.props, "identifierLabel", "Identifier")}>
              {_.get(taxon, "id")} <a href={`https://www.checklistbank.org/dataset/${catalogueKey}/taxon/${_.get(taxon, "id")}`}><LinkOutlined/></a>
            </PresentationItem>
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
            <PresentationItem md={md} label="Checklist status">
              {`${_.get(taxon, "status")} ${_.get(taxon, "name.rank")}`}
            </PresentationItem>
          )}

          {_.get(taxon, "name.nomStatus") && nomStatus && (
            <PresentationItem md={md} label="Nomenclatural Status">
              {
                nomStatus[_.get(taxon, "name.nomStatus")][
                  (_.get(taxon, "name.code"), "zoological")
                ]
              }
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

          {_.get(taxon, "name.relations") && taxon.name.relations.length > 0 && 
          <NameRelations
          md={md}
          style={{ marginTop: "-3px" }}
          data={taxon.name.relations}
        />}
          {infoError && (
            <Alert message={<ErrorMsg error={infoError} />} type="error" />
          )}

          {synonyms && synonyms.length > 0 && (
            <PresentationItem md={md} label="Synonyms and Combinations">
              <SynonymTable
                data={synonyms}
                nomStatus={nomStatus}
                references={_.get(info, "references")}
                referenceIndexMap={referenceIndexMap}
                style={{ marginTop: "-3px" }}
                catalogueKey={catalogueKey}
              />
            </PresentationItem>
          )}

          {misapplied && misapplied.length > 0 && (
            <PresentationItem md={md} label="Misapplied names">
              <SynonymTable
                data={misapplied}
                references={_.get(info, "references")}
                referenceIndexMap={referenceIndexMap}
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
                pathToTaxon={pathToTaxon}
                pathToTree={pathToTree}
              />
            </PresentationItem>
          )}
          {((taxon &&
            rank.indexOf(_.get(taxon, "name.rank")) < genusRankIndex &&
            rank.indexOf(_.get(taxon, "name.rank")) > -1) ||
            (_.get(taxon, "name.rank") === "unranked" &&
              _.get(taxon, "name.scientificName") === "Biota")) &&(
              <TaxonBreakdown taxon={taxon} datasetKey={catalogueKey} rank={rank} pathToTaxon={pathToTaxon} dataset={catalogue}/>
            )}
          {includes.length > 1 && rank && taxon && (
            <PresentationItem md={md} label="Statistics">
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
                references={_.get(info, "references")}
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


          {_.get(taxon, "remarks") && (
            <PresentationItem md={md} label="Additional Data">
              {taxon.remarks}
            </PresentationItem>
          )}

          { _.get(info, "references") && (
            <PresentationItem md={md} label="References">
              <References
                referenceIndexMap={referenceIndexMap}
                data={_.get(info, "references")}
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
          {_.get(taxon, "scrutinizer") && (
              <Col span={12}>
                <PresentationItem md={md * 2} label="Taxonomic scrutiny">
                  {`${_.get(taxon, "scrutinizer")}${
                    _.get(taxon, "scrutinizerDate")
                      ? ", " +
                        _.get(taxon, "scrutinizerDate")
                      : ""
                  }`}
                </PresentationItem>
              </Col>
            )}
          {_.get(sourceDataset, "title") && (
            <PresentationItem md={md} label="Source dataset">
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
    
  }
}

export default TaxonPage;
