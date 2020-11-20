import React from "react";
import ColTree from "./ColTree";
import { Router } from "react-router-dom";
import qs from "query-string";
import _ from "lodash";
import history from "../history";
import NameAutocomplete from "./NameAutocomplete";
import axios from 'axios'
import btoa from "btoa"
import {Row, Col, Switch} from "antd";
class ColTreeWrapper extends React.Component {
  constructor(props) {    
    super(props);
    if(this.props.auth){
      axios.defaults.headers.common['Authorization'] = `Basic ${btoa(this.props.auth)}`;
    } 
    
  }



  render = () => {
    const {catalogueKey, pathToTaxon, pathToDataset, defaultTaxonKey, showTreeOptions } = this.props;
    const params = qs.parse(_.get(location, "search"));
      return (
        <Router history={history}>
          <div className="catalogue-of-life" >
            <Row>
              <Col flex="auto">
            <NameAutocomplete
              datasetKey={catalogueKey}
              style={{width: '100%', marginBottom: '8px'}}
              defaultTaxonKey={_.get(params, "taxonKey") || null}
              onSelectName={name => {
    
                const newParams = {
                  ...params,
                  taxonKey: _.get(name, "key")
                };
    
                history.push({
                  pathname: location.path,
                  search: `?${qs.stringify(newParams)}`
                });
                this.treeRef.reloadRoot()
              }}
              onResetSearch={() => {
    
                const newParams = { ...params, taxonKey: null };
                history.push({
                  pathname: location.path,
                  search: `?${qs.stringify(_.omit(newParams, ["taxonKey"]))}`
                });
              }}
            />
           </Col>
            {showTreeOptions && <Col>
              <Switch size="small" 
               checkedChildren="Show info"
               unCheckedChildren="Show info"
              defaultChecked />
              <Switch size="small" 
              checkedChildren="Show extinct"
              unCheckedChildren="Show extinct"
              defaultChecked />
            </Col>} 
           
           </Row>
            <ColTree
              catalogueKey={catalogueKey}
              pathToTaxon={pathToTaxon}
              pathToDataset={pathToDataset}
              defaultTaxonKey={defaultTaxonKey}
              treeRef={ref => (this.treeRef = ref)}
            />
          </div>
        </Router>
      );
  

}
}


export default ColTreeWrapper;
