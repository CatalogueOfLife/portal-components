import React from "react";
import axios from "axios";
import { Table, Alert, Row, Col, Tooltip, Checkbox } from "antd";
import config from "../config";
import btoa from "btoa";
import _ from "lodash";
import ErrorMsg from "../components/ErrorMsg";
import DatasetlogoWithFallback from "../components/DatasetlogoWithFallback";
import MetricsPresentation from "../Dataset/MetricsPresentation";
import PresentationItem from "../components/PresentationItem";
import MergedDataBadge from "../components/MergedDataBadge";
const getLivingSpecies = (record, rank) =>
  _.get(record, `metrics.taxaByRankCount.${rank || "species"}`) || 0;
const getExtinctSpecies = (record) =>
  _.get(record, "metrics.extinctTaxaByRankCount.species") || 0;
const getSearchParam = (dataset) =>
  dataset.key
    ? `SECTOR_DATASET_KEY=${dataset.key}`
    : `SECTOR_PUBLISHER_KEY=${dataset.id}`;

const getColumns = (
  pathToDataset,
  catalogueKey,
  auth,
  hasPublishers,
  pathToSearch
) =>
  [
    {
      title: "Title",

      dataIndex: ["alias"],
      key: "title",

      render: (text, record) => {
        return (
          <>
            {record.id ? (
              <span>
                {"Publisher: "}{" "}
                <a
                  href={`https://www.checklistbank.org/dataset/${catalogueKey}/publisher/${record.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  /* onClick={() => {
                    window.location.href = `https://www.checklistbank.org/dataset/${catalogueKey}/publisher/${record.id}`;
                  }} */
                  dangerouslySetInnerHTML={{ __html: text }}
                />{" "}
              </span>
            ) : (
              <>
                {" "}
                {!!record?.merged && <MergedDataBadge />}{" "}
                <a
                  href={`${pathToDataset}${record.key}`}
                  onClick={() => {
                    window.location.href = `${pathToDataset}${record.key}`;
                  }}
                >
                  {record.alias || record.title}{" "}
                  {record.alias === "3i Auchenorrhyncha"
                    ? record.key + " " + record.sectorModes.join()
                    : ""}
                </a>
              </>
            )}
            {!!record?.taxonomicScope && (
              <div style={{ width: "90%", wordBreak: "break-all" }}>
                {record.taxonomicScope.length > 200
                  ? record.taxonomicScope.substring(0, 200) + "..."
                  : record.taxonomicScope}
              </div>
            )}
          </>
        );
      },
      width: "30%",
      sorter: (a, b) =>
        a.alias && b.alias ? a.alias.localeCompare(b.alias) : 0,
      // defaultSortOrder: 'ascend'
    },
    {
      title: "Datasets",
      dataIndex: ["metrics", "datasetCount"],
      key: "datasets",
      render: (text, record) =>
        _.get(record, "metrics.datasetCount", 1).toLocaleString("en-GB"),
    },
    /*  {
    title: "Version",
    dataIndex: ["version"],
    key: "version"
  }, */
/*     {
      title: "",
      dataIndex: ["logo"],
      key: "logo",
      render: (text, record) => (
        <DatasetlogoWithFallback
          auth={auth}
          catalogueKey={catalogueKey}
          datasetKey={record.key}
          style={{ maxHeight: "32px" }}
          size="SMALL"
        />
      ),
    }, */
    /* {
    title: "Taxonomic scope",
    dataIndex: ["taxonomicScope"],
    key: "taxonomicScope",
    ellipsis: true,

  }, */
   {
      title: (
        <Tooltip
          placement="topLeft"
          title={"Count of all accepted families including extinct species"}
          getPopupContainer={() => document.getElementById("familyCount")}
        >
          <span id="familyCount">Families</span>
        </Tooltip>
      ),
      dataIndex: ["metrics", "taxaByRankCount", "family"],
      key: "species",
      render: (text, record) => (
        <a
          href={`${pathToSearch}?${getSearchParam(
            record
          )}&rank=family&status=accepted&status=provisionally%20accepted${
            _.isArray(record.sectorModes)
              ? "&" + record.sectorModes.map((m) => `&sectorMode=${m}`).join("")
              : ""
          }`}
        >
          {getLivingSpecies(record, "family").toLocaleString("en-GB")}
        </a>
      ),
      sorter: (a, b) => getLivingSpecies(a,"family") - getLivingSpecies(b,"family"),
    },
       {
      title: (
        <Tooltip
          placement="topLeft"
          title={"Count of all accepted genera including extinct species"}
          getPopupContainer={() => document.getElementById("genusCount")}
        >
          <span id="genusCount">Genera</span>
        </Tooltip>
      ),
      dataIndex: ["metrics", "taxaByRankCount", "genus"],
      key: "species",
      render: (text, record) => (
        <a
          href={`${pathToSearch}?${getSearchParam(
            record
          )}&rank=genus&status=accepted&status=provisionally%20accepted${
            _.isArray(record.sectorModes)
              ? "&" + record.sectorModes.map((m) => `&sectorMode=${m}`).join("")
              : ""
          }`}
        >
          {getLivingSpecies(record, "genus").toLocaleString("en-GB")}
        </a>
      ),
      sorter: (a, b) => getLivingSpecies(a,"genus") - getLivingSpecies(b,"genus"),
    },
    {
      title: (
        <Tooltip
          placement="topLeft"
          title={"Count of all accepted species including extinct species"}
          getPopupContainer={() => document.getElementById("speciesCount")}
        >
          <span id="speciesCount">Species</span>
        </Tooltip>
      ),
      dataIndex: ["metrics", "taxaByRankCount", "species"],
      key: "species",
      render: (text, record) => (
        <a
          href={`${pathToSearch}?${getSearchParam(
            record
          )}&rank=species&status=accepted&status=provisionally%20accepted${
            _.isArray(record.sectorModes)
              ? "&" + record.sectorModes.map((m) => `&sectorMode=${m}`).join("")
              : ""
          }`}
        >
          {getLivingSpecies(record).toLocaleString("en-GB")}
        </a>
      ),
      sorter: (a, b) => getLivingSpecies(a) - getLivingSpecies(b),
    },

  ].filter((clm) => (!hasPublishers ? clm.key !== "datasets" : true));

class DatasetSearchPage extends React.Component {
  constructor(props) {
    super(props);
    if (this.props.auth) {
      axios.defaults.headers.common["Authorization"] = `Basic ${btoa(
        this.props.auth
      )}`;
    }
    this.state = {
      data: [],
      rank: null,
      hasPublishers: false,
      loading: false,
      showMerged: true,
    };
  }

  componentDidMount = () => {
    this.getData();
    this.getRank();
  };

  /* 
  getDataOLD = () => {
    this.setState({ loading: true });
    const { catalogueKey } = this.props;
   
    axios(`${config.dataApi}dataset/${catalogueKey}/source`)
    .then((res) => {
          return Promise.all(
            res.data.map((r) => 
                axios(
                    `${config.dataApi}dataset/${catalogueKey}/source/${r.key}/metrics`
                  ).then((res) => ({...r, metrics: res.data}))
              
            )
          );
        
      })
      .then(data => {

        this.setState({
          loading: false,
          data: data,
          err: null
        });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: [] });
      });
  }; */

  getData = () => {
    this.setState({ loading: true });
    const { catalogueKey: datasetKey } = this.props;
    Promise.all([
      axios(
        /* `${config.dataApi}dataset?limit=1000&contributesTo=${datasetKey}&sortBy=alias` */
        // `${config.dataApi}dataset/${datasetKey}/source?inclPublisherSources=false`
        `${config.dataApi}dataset/${datasetKey}/source?splitMerge=true`
      ),
      axios(`${config.dataApi}dataset/${datasetKey}/sector/publisher`),
    ])
      .then(([res, publisherRes]) => {
        let columns = {};
        const datasetData = res.data || [];
        const publisherData = _.get(publisherRes, "data.result", []);
        if (publisherData.length > 0) {
          this.setState({ hasPublishers: true });
        }
        return Promise.all([
          ...publisherData.map((r) => {
            return this.getPublisherMetrics(datasetKey, r.id).then(
              (metrics) => {
                // columns = _.merge(columns, metrics);
                return {
                  ...r,
                  metrics: metrics,
                };
              }
            );
          }),
          ...datasetData.map((r) => {
            return this.getMetrics(datasetKey, r).then((metrics) => {
              columns = _.merge(columns, metrics);
              return {
                ...r,
                metrics: metrics,
              };
            });
          }),
        ]);
      })
      .then((data) => {
        this.setState({
          loading: false,
          data: data
            .filter((p) => !p?.id || (!!p?.id && p?.metrics?.sectorCount > 0))
            .sort((a, b) => {
              if (!!a.id && !b.id) {
                return a;
              } else if (!!b.id && !a.id) {
                return b;
              } else if (a.alias && b.alias) {
                return a.alias.localeCompare(b.alias) === 0
                  ? a.merged === true
                    ? 1
                    : -1
                  : a.alias.localeCompare(b.alias);
              } else {
                return 0;
              }
            }),
          err: null,
        });
      })
      .catch((err) => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  getMetrics = (datasetKey, source) => {
    return axios(
      `${config.dataApi}dataset/${datasetKey}/source/${source?.key}/metrics?merged=${source?.merged}`
    ).then((res) => res.data);
  };
  getPublisherMetrics = (datasetKey, publisherId) => {
    return axios(
      `${config.dataApi}dataset/${datasetKey}/sector/publisher/${publisherId}/metrics`
    ).then((res) => res.data);
  };

  getRank = () => {
    axios(`${config.dataApi}vocab/rank`).then((res) =>
      this.setState({ rank: res.data.map((r) => r.name) })
    );
  };

  render() {
    const { data, loading, rank, hasPublishers, error } = this.state;
    const { pathToDataset, pathToSearch, catalogueKey } = this.props;

    return (
      <div
        className="catalogue-of-life"
        style={{
          background: "#fff",
          padding: 24,
          minHeight: 280,
          margin: "16px 0",
        }}
      >
        <Row>
          {error && (
            <Alert
              style={{ marginBottom: "10px" }}
              message={<ErrorMsg error={error} />}
              type="error"
            />
          )}
        </Row>

        <Row>
          <Col span={12} style={{ marginBottom: "8px" }}>
            Include <MergedDataBadge />{" "}
            <Checkbox
              checked={this.state.showMerged}
              onChange={({ target: { checked } }) =>
                this.setState({
                  showMerged: checked,
                })
              }
            />
          </Col>
          <Col span={12} style={{ textAlign: "right", marginBottom: "8px" }}>
            {`Source datasets: ${data
              .filter((d) => {
                if (!this.state.showMerged && d?.merged) {
                  return false;
                }
                if (!d?.metrics?.publisherKey) {
                  return true;
                } else {
                  return !(
                    d?.metrics?.datasetCount === 0 ||
                    d?.metrics?.usagesCount === 0
                  );
                }
              })
              .length.toLocaleString("en-GB")}`}
          </Col>
        </Row>
        {!error && (
          <Table
            size="small"
            scroll={{ x: "1200" }}
            columns={getColumns(
              pathToDataset,
              catalogueKey,
              this.props.auth,
              hasPublishers,
              pathToSearch
            )}
            dataSource={data.filter((d) => {
              if (!this.state.showMerged && d?.merged) {
                return false;
              }
              if (!d?.metrics?.publisherKey) {
                return true;
              } else {
                return !(
                  d?.metrics?.datasetCount === 0 ||
                  d?.metrics?.usagesCount === 0
                );
              }
            })}
            loading={loading}
            rowKey={(record) => `${record.key || record.id}-${record.merged}`}
            showSorterTooltip={false}
            pagination={false}
            expandedRowRender={(dataset) => (
              <div style={{ marginLeft: "40px" }}>
                <Row>
                  <Col flex="auto"></Col>
                  <Col>
                    <DatasetlogoWithFallback
                      auth={this.props.auth}
                      catalogueKey={catalogueKey}
                      datasetKey={dataset.key}
                      style={{ maxHeight: "64px" }}
                      size="MEDIUM"
                    />
                  </Col>
                </Row>
                <MetricsPresentation
                  metrics={dataset.metrics}
                  dataset={dataset}
                  pathToSearch={this.props.pathToSearch}
                  rank={rank}
                />
                <div style={{ marginTop: "12px" }}>
                  {dataset?.version && (
                    <PresentationItem md={8} label={`Dataset version`}>
                      {dataset.version}
                    </PresentationItem>
                  )}

                  {dataset?.taxonomicScope && (
                    <PresentationItem md={8} label={`Taxonomic scope`}>
                      {dataset.taxonomicScope}
                    </PresentationItem>
                  )}
                </div>

                {dataset.citation && (
                  <div style={{ marginTop: "12px" }}>
                    <PresentationItem md={24} label={`Citation`}>
                      <div
                        dangerouslySetInnerHTML={{ __html: dataset.citation }}
                      ></div>
                    </PresentationItem>
                  </div>
                )}
              </div>
            )}
          />
        )}
      </div>
    );
  }
}

export default DatasetSearchPage;
