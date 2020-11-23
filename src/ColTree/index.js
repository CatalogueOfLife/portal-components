import React from "react";
import ColTree from "./ColTree";
import { Router } from "react-router-dom";
import qs from "query-string";
import _ from "lodash";
import history from "../history";
import NameAutocomplete from "./NameAutocomplete";
import axios from 'axios'
import btoa from "btoa"
import {Row, Col, Switch, Checkbox, Form} from "antd";
import {ColTreeContext} from "./ColTreeContext"

const FormItem = Form.Item;

class ColTreeWrapper extends React.Component {
  constructor(props) {    
    super(props);
    if(this.props.auth){
      axios.defaults.headers.common['Authorization'] = `Basic ${btoa(this.props.auth)}`;
    } 
    this.state = {
      hideExtinct: false,
      showInfo: false
    }
  }



  render = () => {
    const {catalogueKey, pathToTaxon, pathToDataset, defaultTaxonKey, showTreeOptions } = this.props;
    const {hideExtinct} = this.state;
    const params = qs.parse(_.get(location, "search"));
      return (
        <Router history={history}>
          <div className="catalogue-of-life" >
            <ColTreeContext.Provider value={this.state}>
            <Row>
              <Col flex="auto">
              
            <NameAutocomplete
              hideExtinct={hideExtinct}
              datasetKey={catalogueKey}
              style={{width: '100%', paddingTop: '5px', paddingBottom: '5px'}}
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
            {showTreeOptions && <Col style={{textAlign: 'right', paddingLeft: "10px"}}>
            <Form layout="inline"> 
            <FormItem label="Info">
            <Checkbox 
               onChange={({target: {checked}}) => {
                console.log(checked) 
                this.setState({showInfo: checked})}}
               />
                </FormItem>
              
            
               <FormItem label="Extinct">
            <Checkbox 
              defaultChecked={true}
               onChange={({target: {checked}}) => {
                console.log(checked) 
                this.setState({hideExtinct: !checked})}}
               />
                </FormItem>
                </Form>
              
            </Col>} 
           
           </Row>
           <ColTree
              hideExtinct={hideExtinct}
              catalogueKey={catalogueKey}
              pathToTaxon={pathToTaxon}
              pathToDataset={pathToDataset}
              defaultTaxonKey={defaultTaxonKey}
              treeRef={ref => (this.treeRef = ref)}
            />
                
            
            </ColTreeContext.Provider>
          </div>
        </Router>
      );
  

}
}


export default ColTreeWrapper;
