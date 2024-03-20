import React from "react";
import axios from "axios";
import { Table, Alert, Row, Col } from "antd";
import config from "../config";
import btoa from "btoa"
import _ from "lodash";
import ErrorMsg from "../components/ErrorMsg";
import DatasetlogoWithFallback from "../components/DatasetlogoWithFallback"
import MetricsPresentation from "../Dataset/MetricsPresentation"
import PresentationItem from "../components/PresentationItem";

const getLivingSpecies = (record) => ( (_.get(record, 'metrics.taxaByRankCount.species') || 0) - (_.get(record, 'metrics.extinctTaxaByRankCount.species') || 0))
const getExtinctSpecies = (record) => (_.get(record, 'metrics.extinctTaxaByRankCount.species') || 0)

const getColumns = (pathToDataset, catalogueKey, auth, hasPublishers) => [
  {
    title: "Title",
    dataIndex: ["alias"],
    key: "title",
    
    render: (text, record) => {
      return (
record.id ? <span>{"Publisher: "} <a href={`https://www.checklistbank.org/catalogue/${catalogueKey}/publisher/${record.id}`} onClick={() => {window.location.href =  `https://www.checklistbank.org/catalogue/${catalogueKey}/publisher/${record.id}`}}  dangerouslySetInnerHTML={{ __html: text }} /> </span> :
          <a href={`${pathToDataset}${record.key}`} onClick={() => {window.location.href =  `${pathToDataset}${record.key}`}}  >{record.alias || record.title}</a>
      );
    },
    width: "30%",
    ellipsis: true,
    sorter: (a, b) => (a.alias && b.alias) ? a.alias.localeCompare(b.alias) : 0,
   // defaultSortOrder: 'ascend'
  },
  {
    title: "Datasets",
    dataIndex: ["metrics", "datasetCount"],
    key: "datasets",
    render: (text, record) => _.get(record, 'metrics.datasetCount', 1).toLocaleString("en-GB")
  },
  {
    title: "Version",
    dataIndex: ["version"],
    key: "version"
  },
  {
    title: "",
    dataIndex: ["logo"],
    key: "logo",
    render: (text, record) => <DatasetlogoWithFallback  auth={auth} catalogueKey={catalogueKey} datasetKey={record.key} style={{maxHeight: '32px'}} size="SMALL"/>
  },
  {
    title: "Taxonomic scope",
    dataIndex: ["taxonomicScope"],
    key: "taxonomicScope",
    ellipsis: true,

  },
  {
    title: "Living Species",
    dataIndex: ["metrics", "taxaByRankCount", "species"],
    key: "livingSpecies",
    render: (text, record) => getLivingSpecies(record).toLocaleString("en-GB"),
    sorter: (a, b) => getLivingSpecies(a) - getLivingSpecies(b)

  },
  {
    title: "Extinct Species",
    dataIndex: ["metrics", "extinctTaxaByRankCount", "species"],
    key: "extinctSpecies",
    render: (text, record) => getExtinctSpecies(record).toLocaleString("en-GB"),
    sorter: (a, b) => getExtinctSpecies(a) - getExtinctSpecies(b)

  }
 
].filter(clm => !hasPublishers ? clm.key !== "datasets" : true );

class DatasetSearchPage extends React.Component {
  constructor(props) {
    super(props);
    if(this.props.auth){
      axios.defaults.headers.common['Authorization'] = `Basic ${btoa(this.props.auth)}`;
    } 
    this.state = {
      data: [],
      rank: null,
      hasPublishers: false,
      loading: false
    };
  }

  componentDidMount = () => {
    this.getData();
    this.getRank();
  }
  
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
      `${config.dataApi}dataset/${datasetKey}/source`
    ),
    axios(`${config.dataApi}dataset/${datasetKey}/sector/publisher`),
  ])
    .then(([res, publisherRes]) => {
      let columns = {};
      const datasetData = res.data || [];
      const publisherData = _.get(publisherRes, 'data.result', []);
      if(publisherData.length > 0){
        this.setState({hasPublishers: true})
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
          return this.getMetrics(datasetKey, r.key).then((metrics) => {
            columns = _.merge(columns, metrics);
            return {
              ...r,
              metrics: metrics,
            };
          });
        }),
      ])
    })
    .then(data => {

      this.setState({
        loading: false,
        data: data.sort((a, b) => {
          if(!!a.id && !b.id){
            return a
          } else if(!!b.id && !a.id){
            return b
          } else if(a.alias && b.alias) {
            return a.alias.localeCompare(b.alias)
          } else {
            return 0
          }

        }),
        err: null
      });
    })
    .catch(err => {
      this.setState({ loading: false, error: err, data: [] });
    });
}

  getMetrics = (datasetKey, sourceDatasetKey) => {
    return axios(
      `${config.dataApi}dataset/${datasetKey}/source/${sourceDatasetKey}/metrics`
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
    const {
      data,
      loading,
      rank,
      hasPublishers,
      error
    } = this.state;
    const {pathToDataset, catalogueKey} = this.props;
    
   

    return (
      <div
      className="catalogue-of-life"

        style={{
          background: "#fff",
          padding: 24,
          minHeight: 280,
          margin: "16px 0"
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
         
          <Col span={24} style={{ textAlign: "right", marginBottom: "8px" }}>
            {`Source datasets: ${data.length.toLocaleString('en-GB')}`}
          </Col>
        </Row>
        {!error && (
          <Table
            size="small"
            columns={ getColumns(pathToDataset, catalogueKey, this.props.auth, hasPublishers)}
            dataSource={data}
            loading={loading}
            rowKey={record => record.key || record.id}
            showSorterTooltip={false}
            pagination={false}
            expandedRowRender={(dataset) => <div style={{marginLeft: '40px'}}>
              <MetricsPresentation metrics={dataset.metrics} dataset={dataset} pathToSearch={this.props.pathToSearch} rank={rank} />
            {dataset.citation &&  <div style={{marginTop: "12px"}}><PresentationItem md={24}  label={`Citation`}>
              <div dangerouslySetInnerHTML={{__html: dataset.citation}}></div>
          </PresentationItem></div>}
              
            </div>}
          />
        )}
      </div>
    );
  }
}

export default DatasetSearchPage;
