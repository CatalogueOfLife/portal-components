import React from "react";
import config from "../config";
import { getSectorsBatch } from "../api/sector";
import { getDatasetsBatch } from "../api/dataset";
import DataLoader from "dataloader";
import client, { setAuth } from "../api/client";
import { LinkOutlined, DownloadOutlined } from "@ant-design/icons";
import { Alert, Tag, Row, Col, Button, Rate, Tooltip } from "antd";
// import SynonymTable from "./Synonyms";
import Synonyms from "./Synonyms";
import TypeMaterial from "./TypeMaterial";

import VernacularNames from "./VernacularNames";
import Distributions from "./Distributions";
import Classification from "./Classification";
import NameRelations from "./NameRelations";
import References from "./References";
import ErrorMsg from "../components/ErrorMsg";
import { get } from "lodash-es";
import PresentationItem from "../components/PresentationItem";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
dayjs.extend(localizedFormat);
import { RouterContext, buildRouter, LinkTo } from "../router";
import BooleanValue from "../components/BooleanValue";
// import ReferencePopover from "./ReferencePopover"
import IncludesTable from "./Includes";
import DatasetlogoWithFallback from "../components/DatasetlogoWithFallback";
import Page404 from "../components/Page404";
import TaxonBreakdown from "./TaxonBreakdown";
import SecondarySources from "./SecondarySources";
import MergedDataBadge from "../components/MergedDataBadge";
import DecisionBadge from "../components/DecisionBadge";
import { Feedback } from "./Feedback";
const md = 5;

class TaxonPage extends React.Component {
  static contextType = RouterContext;

  constructor(props) {
    super(props);
    setAuth(this.props.auth);
    this.state = {
      taxon: null,
      info: null,
      taxonLoading: true,
      datasetLoading: true,
      infoLoading: true,
      infoError: null,
      taxonError: null,
      verbatimLoading: true,
      verbatimError: null,
      verbatim: null,
      logoUrl: null,
      sourceDataset: null,
      includes: [],
      rank: [],
      nomStatus: null,
      catalogue: null,
      referenceIndexMap: {},
      sourceDatasetKeyMap: null,
    };
  }

  componentDidMount = () => {
    const { taxonKey } = this.props;
    this.getCatalogue();
    if (taxonKey) {
      this.getInfo(taxonKey);
      this.getRank(taxonKey);
      this.getIncludes(taxonKey);
      this.getNomStatus(taxonKey);
    }
  };

  componentDidUpdate(prevProps) {
    if (prevProps.taxonKey !== this.props.taxonKey && this.props.taxonKey) {
      const taxonKey = this.props.taxonKey;
      this.getInfo(taxonKey);
      this.getRank(taxonKey);
      this.getIncludes(taxonKey);
      this.getNomStatus(taxonKey);
    }
  }

  getCatalogue = () => {
    const { datasetKey } = this.props;
    client(`${config.dataApi}dataset/${datasetKey}`)
      .then((res) => {
        this.setState({ catalogue: res.data });
      })
      .catch((err) => {
        // ignore
      });
  };
  datasetLoader = new DataLoader((ids) =>
    getDatasetsBatch(ids, this.props.datasetKey)
  );
  sectorLoader = new DataLoader((ids) =>
    getSectorsBatch(ids, this.props.datasetKey)
  );

  decorateWithSectorsAndDataset = async (synonyms) => {
    const { datasetKey } = this.props;
    /* const sectorLoader = new DataLoader((ids) =>
      getSectorsBatch(ids, datasetKey)
    ); */
    const sourceDatasetsMap = {};
    for (const type of ["misapplied", "heterotypic", "homotypic"].filter(
      (t) => !!synonyms[t]
    )) {
      await Promise.allSettled(
        synonyms[type]
          .filter((tx) => !!tx.sectorKey)
          .map((tx) =>
            this.sectorLoader.load(tx.sectorKey, datasetKey).then((r) => {
              tx.sector = r;
              return this.datasetLoader
                .load(r.subjectDatasetKey)
                .then((dataset) => {
                  // tx.sector.dataset = dataset
                  tx.sourceDatasetKey = dataset.key;
                  sourceDatasetsMap[dataset.key] = dataset;
                });
            })
          )
      );
    }
    if (synonyms?.heterotypicGroups) {
      for (const arr of synonyms?.heterotypicGroups) {
        await Promise.allSettled(
          arr
            .filter((tx) => !!tx.sectorKey)
            .map((tx) =>
              this.sectorLoader.load(tx.sectorKey, datasetKey).then((r) => {
                tx.sector = r;
                return this.datasetLoader
                  .load(r.subjectDatasetKey)
                  .then((dataset) => {
                    // tx.sector.dataset = dataset
                    tx.sourceDatasetKey = dataset.key;
                    sourceDatasetsMap[dataset.key] = dataset;
                  });
              })
            )
        );
      }
    }

    return Object.keys(sourceDatasetsMap).length > 0 ? sourceDatasetsMap : null;
  };

  getInfo = async (taxonKey) => {
    const { datasetKey, pageTitleTemplate } = this.props;


    try {
      const res = await client(
        `${config.dataApi}dataset/${datasetKey}/taxon/${taxonKey}/info`
      );
      const usage = get(res, "data.usage");

      // Page title from the usage label (moved from the old getTaxon).
      if (pageTitleTemplate && get(usage, "label")) {
        document.title = pageTitleTemplate.replace("__taxon__", usage.label);
      }

      // Resolve the name's "published in" reference from the references map the
      // /info payload already carries; fall back to a single fetch only if it
      // is not included. Attaches as usage.name.publishedIn so the existing
      // "Published in" render keeps working.
      const publishedInId = get(usage, "name.publishedInId");
      if (publishedInId && usage.name) {
        const cited = get(res, "data.references") && res.data.references[publishedInId];
        if (cited) {
          usage.name.publishedIn = cited;
        } else {
          try {
            const pub = await client(
              `${config.dataApi}dataset/${datasetKey}/reference/${publishedInId}`
            );
            usage.name.publishedIn = pub.data;
          } catch (e) {
            // no reference available — leave publishedIn unset
          }
        }
      }

      // Source-dataset logo + metadata, only on catalogues (moved from getTaxon).
      if (get(usage, "sectorKey")) {
        client(
          `${config.dataApi}dataset/${datasetKey}/sector/${get(usage, "sectorKey")}`
        ).then((sector) => {
          const subjectDatasetKey = get(sector, "data.subjectDatasetKey");
          client(
            `${config.dataApi}dataset/${datasetKey}/logo/source/${subjectDatasetKey}`
          )
            .then(() => {
              this.setState({
                logoUrl: `${config.dataApi}dataset/${datasetKey}/logo/source/${subjectDatasetKey}?size=MEDIUM`,
              });
            })
            .catch(() => {
              // ignore, there is no logo
            });
          client(
            `${config.dataApi}dataset/${datasetKey}/source/${subjectDatasetKey}`
          ).then((dataset) => {
            this.setState({ sourceDataset: dataset.data });
          });
        });
      }

      let referenceIndexMap = {};
      if (get(res, "data.references")) {
        Object.keys(res.data.references).forEach((k, i) => {
          referenceIndexMap[k] = (i + 1).toString();
        });
        await Promise.allSettled(
          Object.keys(res.data.references)
            .map((key) => res.data.references[key])
            .filter((ref) => !!ref.sectorKey)
            .map((ref) =>
              this.sectorLoader.load(ref.sectorKey).then((r) => {
                ref.sector = r;
                return this.datasetLoader
                  .load(r.subjectDatasetKey)
                  .then((dataset) => {
                    // tx.sector.dataset = dataset
                    ref.sourceDataset = dataset;
                    // sourceDatasetsMap[dataset.key] = dataset;
                  });
              })
            )
        );
      }
      if (res?.data?.vernacularNames) {
        await Promise.allSettled(
          res.data.vernacularNames.filter((name) => !!name.sectorKey).map((name) =>
            this.sectorLoader.load(name.sectorKey).then((r) => {
              name.sector = r;
              name.sourceDatasetKey = r.subjectDatasetKey;
            })
          )
        );
      }
      if (res?.data?.distributions) {
        await Promise.allSettled(
          res.data.distributions.filter((dist) => !!dist.sectorKey).map((dist) =>
            this.sectorLoader.load(dist.sectorKey).then((r) => {
              dist.sector = r;
              dist.sourceDatasetKey = r.subjectDatasetKey;
            })
          )
        );
      }
      let sourceDatasetKeyMap = get(res, "data.synonyms")
        ? await this.decorateWithSectorsAndDataset(get(res, "data.synonyms"))
        : null;

      if (res?.data?.nameRelations && res?.data?.names) {
        res?.data?.nameRelations.forEach((rel) => {
          rel.relatedName = res?.data?.names?.[rel?.relatedNameId];
          rel.name = res?.data?.names?.[rel?.nameId];
        });
      }
      this.setState({
        infoLoading: false,
        info: res.data,
        taxon: usage,
        classification: res?.data?.classification,
        infoError: null,
        referenceIndexMap,
        sourceDatasetKeyMap,
      });
    } catch (err) {
      if (get(err, "response.status") === 404) {
        this.setState({ infoLoading: false, info: null, taxon: null, status: 404 });
      } else {
        this.setState({ infoLoading: false, infoError: err, info: null });
      }
    }
  };

  getRank = () => {
    client(`${config.dataApi}vocab/rank`).then((res) =>
      this.setState({ rank: res.data.map((r) => r.name) })
    );
  };

  getNomStatus = () => {
    client(`${config.dataApi}vocab/nomstatus`).then((res) =>
      this.setState({
        nomStatus: res.data.reduce((a, c) => ((a[c.name] = c), a), {}),
      })
    );
  };

  getIncludes = (taxonKey) => {
    const { datasetKey } = this.props;

    client(
      `${config.dataApi}dataset/${datasetKey}/nameusage/search?TAXON_ID=${taxonKey}&facet=rank&status=accepted&status=provisionally%20accepted&limit=0`
    )
      .then((res) => {
        this.setState({
          includesLoading: false,
          includes: get(res, "data.facets.rank") || [],
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
      datasetKey,
      showDistributionMap,
      gbifChecklistKey,
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
      referenceIndexMap,
    } = this.state;
    const genusRankIndex = rank ? rank.indexOf("genus") : -1;
    const isSynonym = ["synonym", "ambiguous synonym", "misapplied"].includes(
      get(taxon, "status")
    );

    /*  const synonyms =
      info && info.synonyms && info.synonyms.length > 0
        ? info.synonyms.filter((s) => s.status !== "misapplied")
        : [];
    const misapplied =
      info && info.synonyms && info.synonyms.length > 0
        ? info.synonyms.filter((s) => s.status === "misapplied")
        : []; */
    const homotypic = get(info, "synonyms.homotypic", []);
    const heterotypic = get(info, "synonyms.heterotypic", []);
    const misapplied = get(info, "synonyms.misapplied", []);
    const synonyms = [
      ...homotypic.map((h) => ({ ...h, __homotypic: true })),
      ...heterotypic,
    ];
    return status === 404 ? (
      <Page404 />
    ) : (
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
            <Row align="bottom">
              <Col flex="auto">
                
                <div style={{marginLeft: info?.usage?.merged  ? "-22px": 0}}>
                {info?.usage?.merged && 
                  <MergedDataBadge 
                    style={{marginBottom: "10px"}}
                    createdBy={info?.usage?.createdBy}
                    datasetKey={info?.usage?.datasetKey} 
                    verbatimSourceKey={info?.usage?.verbatimSourceKey} 
                    sourceDatasetKey={info?.source?.sourceDatasetKey} 
                    sourceId={info?.source?.sourceId} 
                    />}
                <h1
                  style={{
                    fontSize: "30px",
                    fontWeight: "400",
                    paddingLeft: "10px",
                    display: "inline",
                    textTransform: "none",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: taxon.labelHtml,
                  }}
                /></div>
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
                    datasetKey={datasetKey}
                    sourceDatasetKey={sourceDataset.key}
                  />
                </Col>
              )}
            </Row>
          )}
          {isSynonym && get(taxon, "accepted.id") && (
            <div
              style={{
                paddingLeft: "10px",
                marginTop: "2px",
                marginBottom: "10px",
                fontSize: "16px",
              }}
            >
              {get(taxon, "status")}{" "}
              {get(taxon, "status") === "misapplied" ? "to" : "of"}{" "}
              <LinkTo to="taxon" args={get(taxon, "accepted.id")}>
                <span
                  dangerouslySetInnerHTML={{
                    __html: get(taxon, "accepted.labelHtml"),
                  }}
                />
              </LinkTo>
            </div>
          )}
          {get(taxon, "id") && (
            <PresentationItem
              md={md}
              label={get(this.props, "identifierLabel", "Identifier")}
            >
              {get(taxon, "id")}{" "}
              <a
                href={`https://www.checklistbank.org/dataset/${datasetKey}/taxon/${get(
                  taxon,
                  "id"
                )}`}
              >
                <LinkOutlined />
              </a>
                <Tooltip title={"Download data for this taxon and descendants"}
                 getPopupContainer={() => document.getElementById(`col-download-${get(taxon, "id")}`) || document.body}
                >
              <a
                style={{ marginLeft: "5px" }}
                id={`col-download-${get(taxon, "id")}`}
                target="_blank"
                href={`http://checklistbank.org/dataset/${datasetKey}/download?taxonID=${encodeURIComponent(get(
                  taxon,
                  "id"
                ))}`}
              >
                <DownloadOutlined />
              </a>
              </Tooltip>
            </PresentationItem>
          )}
          {Array.isArray(get(taxon, "identifier")) &&
            get(taxon, "identifier").length > 0 && (
              <PresentationItem md={md} label="Identifiers">
                {get(taxon, "identifier").map((id, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && ", "}
                    {String(id)}
                  </React.Fragment>
                ))}
              </PresentationItem>
            )}
          {get(taxon, "labelHtml") && (
            <PresentationItem md={md} label="Name">
              <span
                dangerouslySetInnerHTML={{
                  __html: taxon.labelHtml,
                }}
              />
            </PresentationItem>
          )}
          {get(taxon, "name.publishedIn.citation") && (
            <PresentationItem md={md} label="Published in">
            {get(info, "source.secondarySources['published in']") && 
              <MergedDataBadge 
                sourceDatasetKey={get(info, "source.secondarySources['published in'].datasetKey")} 
                sourceId={get(info, "source.secondarySources['published in'].id")} />}  
                {get(taxon, "name.publishedIn.citation")}
            </PresentationItem>
          )}
          {get(taxon, "status") && (
            <PresentationItem md={md} label="Checklist status">
              {`${get(taxon, "status")} ${get(taxon, "name.rank")}`}
              {info?.decisions?.[taxon?.id] && (
                          <>
                            &nbsp;with{" "}
                            {info?.decisions?.[taxon?.id]?.mode}{" "}
                            decision
                            <DecisionBadge
                              style={{ marginLeft: "10px" }}
                              decision={
                                info?.decisions?.[taxon?.id]
                              }
                            />
                          </>
                        )}
            </PresentationItem>
          )}

          {get(taxon, "name.nomStatus") && nomStatus && (
            <PresentationItem md={md} label="Nomenclatural Status">
              {
                nomStatus[get(taxon, "name.nomStatus")][
                  (get(taxon, "name.code"), "zoological")
                ]
              }
            </PresentationItem>
          )}
          {/*           <PresentationItem md={md} label="Extinct">
            <BooleanValue value={get(taxon, "extinct")} />
          </PresentationItem> */}
          {/* 
          <PresentationItem md={md} label="Fossil">
            <BooleanValue value={get(taxon, "fossil")} />
          </PresentationItem>
          <PresentationItem md={md} label="Recent">
            <BooleanValue value={get(taxon, "recent")} />
          </PresentationItem> */}

          {/*   {get(taxon, "name.relations") && taxon.name.relations.length > 0 && 
          <NameRelations
          md={md}
          style={{ marginTop: "-3px" }}
          data={taxon.name.relations}
        />} */}
          {infoError && (
            <Alert message={<ErrorMsg error={infoError} />} type="error" />
          )}
          {!isSynonym && get(info, "synonyms") && (
            <PresentationItem md={md} label="Synonyms and combinations">
              <Synonyms
                primarySource={sourceDataset}
                data={get(info, "synonyms")}
                decisions={get(info, "decisions")}
                references={get(info, "references")}
                typeMaterial={get(info, "typeMaterial")}
                referenceIndexMap={referenceIndexMap}
                style={{ marginTop: "-3px" }}
                                /*                     datasetKey={datasetKey}
                 */ datasetKey={datasetKey}
              />
            </PresentationItem>
          )}
          {!isSynonym && misapplied.length > 0 && (
            <PresentationItem md={md} label="Misapplied names">
              <Synonyms
                misapplied
                primarySource={sourceDataset}
                data={get(info, "synonyms")}
                decisions={get(info, "decisions")}
                references={get(info, "references")}
                typeMaterial={get(info, "typeMaterial")}
                referenceIndexMap={referenceIndexMap}
                style={{ marginTop: "-3px" }}
                datasetKey={datasetKey}
              />
            </PresentationItem>
          )}
          {get(info, "typeMaterial") &&
                info.typeMaterial[info?.usage?.name?.id] && (
                  <PresentationItem md={md} label="Type material">
                    <TypeMaterial
                      data={get(info, "typeMaterial")}
                      nameID={get(taxon, "name.id")}
                    />
                  </PresentationItem>
                )}
          {get(info, "nameRelations") &&
            info.nameRelations.filter((rel) => rel?.usageId === taxon?.id)
              .length > 0 && (
              <NameRelations
                md={md}
                style={{ marginTop: "-3px" }}
                data={info.nameRelations.filter(
                  (rel) => rel?.usageId === taxon?.id
                )}
              />
            )}
          {get(info, "nameRelations") &&
            info.nameRelations.filter((rel) => rel?.usageId !== taxon?.id)
              .length > 0 && (
              <NameRelations
                md={md}
                reverse={true}
                style={{ marginTop: "-3px" }}
                data={info.nameRelations.filter(
                  (rel) => rel?.usageId !== taxon?.id
                )}
              />
            )}

          {/*    {synonyms && synonyms.length > 0 && (
            <PresentationItem md={md} label="Synonyms and Combinations">
              <SynonymTable
                data={synonyms}
                                nomStatus={nomStatus}
                references={get(info, "references")}
                referenceIndexMap={referenceIndexMap}
                style={{ marginTop: "-3px" }}
                datasetKey={datasetKey}
              />
            </PresentationItem>
          )}

          {misapplied && misapplied.length > 0 && (
            <PresentationItem md={md} label="Misapplied names">
              <SynonymTable
                data={misapplied}
                references={get(info, "references")}
                referenceIndexMap={referenceIndexMap}
                style={{ marginBottom: 16, marginTop: "-3px" }}
                datasetKey={datasetKey}
                primarySource={sourceDataset}
              />
            </PresentationItem>
          )} */}
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
                datasetKey={datasetKey}
                                              />
            </PresentationItem>
          )}
          {!isSynonym && ((taxon &&
            rank.indexOf(get(taxon, "name.rank")) < genusRankIndex &&
            rank.indexOf(get(taxon, "name.rank")) > -1) ||
            (get(taxon, "name.rank") === "unranked" &&
              get(taxon, "name.scientificName") === "Biota")) && (
            <PresentationItem md={md} label="Breakdown">
              <TaxonBreakdown
                taxon={taxon}
                datasetKey={datasetKey}
                rank={rank}
                dataset={catalogue}
                showLevelSwitch
              />
            </PresentationItem>
          )}
          {!isSynonym && includes.length > 1 && rank && taxon && (
            <PresentationItem md={md} label="Statistics">
              <IncludesTable
                style={{ marginTop: "-3px", marginLeft: "-3px" }}
                data={includes}
                rank={rank}
                taxon={taxon}
                              />
            </PresentationItem>
          )}
          {!isSynonym && get(info, "vernacularNames") && taxon && (
            <PresentationItem md={md} label="Vernacular names">
              <VernacularNames
                style={{ marginTop: "-3px", marginLeft: "-3px" }}
                data={info.vernacularNames}
                references={get(info, "references")}
                datasetKey={taxon.datasetKey}
              />
            </PresentationItem>
          )}
          {!isSynonym &&
            (get(info, "distributions") ||
              (showDistributionMap && gbifChecklistKey && taxon)) && (
            // Distributions owns its labelled block so it can hide entirely
            // (label included) when there is nothing to show — including after
            // the async GBIF occurrence lookup comes back empty.
            <Distributions
              label="Distributions"
              md={md}
              data={info?.distributions || []}
              datasetKey={datasetKey}
              showDistributionMap={showDistributionMap}
              focalTaxon={taxon}
              rankOrder={rank}
              gbifChecklistKey={gbifChecklistKey}
            />
          )}
          {get(taxon, "environments") && (
            <PresentationItem md={md} label="Environment(s)">
              {get(taxon, "environments").join(", ")}
            </PresentationItem>
          )}

          {get(taxon, "remarks") && (
            <PresentationItem md={md} label="Additional Data">
              {taxon.remarks}
            </PresentationItem>
          )}

          <Row>
            {get(taxon, "accordingTo") && (
              <Col span={12}>
                <PresentationItem md={md * 2} label="According to">
                  {`${get(taxon, "accordingTo")}`}
                  {get(taxon, "accordingToDate") &&
                    `, ${dayjs(get(taxon, "accordingToDate")).format("LL")}`}
                </PresentationItem>
              </Col>
            )}
            {/*           <Col span={12}>
          {get(taxon, "origin") && (
            <PresentationItem md={md * 2} label="Origin">
              {get(taxon, "origin")}
            </PresentationItem>
          )}
          </Col>   */}
          </Row>
          {get(taxon, "scrutinizer") && (
            <Col span={12}>
              <PresentationItem md={md * 2} label="Taxonomic scrutiny">
                {`${get(taxon, "scrutinizer")}${
                  get(taxon, "scrutinizerDate")
                    ? ", " + get(taxon, "scrutinizerDate")
                    : ""
                }`}
              </PresentationItem>
            </Col>
          )}
          {get(sourceDataset, "title") && (
            <PresentationItem md={md} label="Source">
              <div style={{ display: "inline-block" }}>
              {info?.usage?.merged && 
                <MergedDataBadge 
                  createdBy={info?.usage?.createdBy}
                  datasetKey={info?.usage?.datasetKey} 
                  verbatimSourceKey={info?.usage?.verbatimSourceKey} 
                  sourceDatasetKey={info?.source?.sourceDatasetKey} 
                  sourceId={info?.source?.sourceId} 
                  />}{" "}
                {info?.source && info?.source?.sourceId && (
                  <>
                    <a
                      href={`https://www.checklistbank.org/dataset/${info?.source?.sourceDatasetKey}/taxon/${info?.source?.sourceId}`}
                    >
                      {info?.source?.sourceId}
                    </a>{" "}
                    in{" "}
                  </>
                )}
                <LinkTo to="source" args={get(sourceDataset, "key")}>
                  {`${get(sourceDataset, "alias")}: ${get(
                    sourceDataset,
                    "title"
                  )}`}
                </LinkTo>
                <span style={{ marginLeft: "10px" }}>
                  {get(sourceDataset, "completeness") &&
                    get(sourceDataset, "completeness") + "%"}
                </span>
                {get(sourceDataset, "confidence") && (
                  <Rate
                    style={{ marginLeft: "10px" }}
                    value={get(sourceDataset, "confidence")}
                    disabled
                  />
                )}
              </div>
            </PresentationItem>
          )}
          {get(taxon, "link") && (
            <PresentationItem md={md} label="Original record">
              <a href={get(taxon, "link")}>{get(taxon, "link")}</a>
            </PresentationItem>
          )}
          {info?.source?.secondarySources && (
            <PresentationItem md={md} label="Secondary Sources">
              <SecondarySources info={info} datasetKey={datasetKey}  />
            </PresentationItem>
          )}
          {/* {this.state?.sourceDatasetKeyMap && (
            <PresentationItem md={md} label="Synonym Sources">
              <SourceDatasets
                                datasetKey={this.props.datasetKey}
                primarySourceDatasetKey={info?.source?.sourceDatasetKey}
                sourceDatasetKeyMap={this.state.sourceDatasetKeyMap}
              />
            </PresentationItem>
          )} */}
          {get(info, "references") && (
            <PresentationItem md={md} label="References">
              <References
                                referenceIndexMap={referenceIndexMap}
                primarySourceDatasetKey={info?.source?.sourceDatasetKey}
                data={get(info, "references")}
                style={{ marginTop: "-3px" }}
              />
            </PresentationItem>
          )}
          {window?.location?.hostname?.endsWith("catalogueoflife.org") && <PresentationItem md={md} label="">
              <Feedback taxonKey={this?.state?.taxon?.id} datasetKey={this.props.datasetKey} />
            </PresentationItem>}
        </div>
      </React.Fragment>
    );
  }
}

// Public wrapper: takes the controlled props + navigation callbacks,
// builds the RouterContext, hands the rest down to TaxonPage.
export default function Taxon({
  taxonKey,
  datasetKey,
  pageTitleTemplate,
  identifierLabel,
  showDistributionMap,
  gbifChecklistKey,
  auth,
  ...routerProps
}) {
  return (
    <RouterContext.Provider value={buildRouter(routerProps)}>
      <TaxonPage
        taxonKey={taxonKey}
        datasetKey={datasetKey}
        pageTitleTemplate={pageTitleTemplate}
        identifierLabel={identifierLabel}
        showDistributionMap={showDistributionMap}
        gbifChecklistKey={gbifChecklistKey}
        auth={auth}
      />
    </RouterContext.Provider>
  );
}
