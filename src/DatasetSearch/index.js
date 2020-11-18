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


const getColumns = (pathToDataset, catalogueKey) => [
  {
    title: "Title",
    dataIndex: ["alias"],
    key: "title",
    render: (text, record) => {
      return (

          <a href={`${pathToDataset}${record.key}`} onClick={() => {window.location.href =  `${pathToDataset}${record.key}`}}  dangerouslySetInnerHTML={{ __html: text }} />
      );
    },
    width: "30%",
    sorter: (a, b) => a.alias.localeCompare(b.alias),
    defaultSortOrder: 'ascend'
  },
  {
    title: "",
    dataIndex: ["logo"],
    key: "logo",
    render: (text, record) => <DatasetlogoWithFallback  catalogueKey={catalogueKey} datasetKey={record.key} style={{maxHeight: '32px'}} size="SMALL"/>
  },
  {
    title: "English name of the group",
    dataIndex: ["group"],
    key: "group"
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
 
];

class DatasetSearchPage extends React.Component {
  constructor(props) {
    super(props);
    if(this.props.auth){
      axios.defaults.headers.common['Authorization'] = `Basic ${btoa(this.props.auth)}`;
    } 
    this.state = {
      data: [],
      rank: null,
      loading: false
    };
  }

  componentDidMount = () => {
    this.getData();
    this.getRank();
  }
  

  getData = () => {
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
            columns={getColumns(pathToDataset, catalogueKey)}
            dataSource={data}
            loading={loading}
            rowKey={record => record.key}
            showSorterTooltip={false}
            pagination={{pageSize: 200}}
            expandedRowRender={(dataset) => <div style={{marginLeft: '40px'}}>
              <MetricsPresentation metrics={dataset.metrics} dataset={dataset} pathToSearch={this.props.pathToSearch} rank={rank} />
            {dataset.citation &&  <div style={{marginTop: "12px"}}><PresentationItem md={24}  label={`Citation`}>
              {dataset.citation}
          </PresentationItem></div>}
              
            </div>}
          />
        )}
      </div>
    );
  }
}

export default DatasetSearchPage;
