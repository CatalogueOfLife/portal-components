import React from "react";
import axios from "axios";
import { Table, Alert, Row, Col } from "antd";
import config from "../config";

import _ from "lodash";
import ErrorMsg from "../components/ErrorMsg";
import DatasetlogoWithFallback from "../components/DatasetlogoWithFallback"


const getLivingSpecies = (record) => ( (_.get(record, 'metrics.taxaByRankCount.species') || 0) - (_.get(record, 'metrics.extinctTaxaByRankCount.species') || 0))
const getExtinctSpecies = (record) => (_.get(record, 'metrics.extinctTaxaByRankCount.species') || 0)


const getColumns = (pathToDataset) => [
  {
    title: "Title",
    dataIndex: ["title"],
    key: "title",
    render: (text, record) => {
      return (

          <a href={`${pathToDataset}${record.key}`} onClick={() => {window.location.href =  `${pathToDataset}${record.key}`}}  dangerouslySetInnerHTML={{ __html: text }} />
      );
    },
    width: "50%",
    sorter: (a, b) => a.title.localeCompare(b.title),
    defaultSortOrder: 'ascend'
  },
  {
    title: "",
    dataIndex: ["logo"],
    key: "logo",
    render: (text, record) => <DatasetlogoWithFallback  datasetKey={record.key} style={{maxHeight: '32px'}} size="SMALL"/>
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
    render: (text, record) => getLivingSpecies(record),
    sorter: (a, b) => getLivingSpecies(a) - getLivingSpecies(b)

  },
  {
    title: "Extinct Species",
    dataIndex: ["metrics", "extinctTaxaByRankCount", "species"],
    key: "extinctSpecies",
    render: (text, record) => getExtinctSpecies(record),
    sorter: (a, b) => getExtinctSpecies(a) - getExtinctSpecies(b)

  }
 
];

class DatasetSearchPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      loading: false
    };
  }

  componentDidMount = () => {
    this.getData()
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




  render() {
    const {
      data,
      loading,
      error
    } = this.state;
    const {pathToDataset} = this.props;
    


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
            columns={getColumns(pathToDataset)}
            dataSource={data}
            loading={loading}
            rowKey={record => record.key}
            showSorterTooltip={false}
            pagination={{pageSize: 200}}
          />
        )}
      </div>
    );
  }
}


export default DatasetSearchPage;
