import React from "react";
import ColTree from "./ColTree";
import { Router } from "react-router-dom";
import qs from "query-string";
import _ from "lodash";
import history from "../history";
import NameAutocomplete from "./NameAutocomplete";

class ColTreeWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.wrapperRef = React.createRef();
    this.state = {
      height: 600
    }
  }

  componentDidMount = () => {
    this.resizeHandler()
    window.addEventListener('resize', this.resizeHandler)
  }

  resizeHandler = () => {
    const height = _.get(this.wrapperRef, 'current.clientHeight');
    if(height){
      this.setState({ height })
    } 
  }
  componentWillUnmount(){
    window.removeEventListener('resize', this.resizeHandler);
  }

  render = () => {
    const {catalogueKey, pathToTaxon, pathToDataset, defaultTaxonKey } = this.props;
    const params = qs.parse(_.get(location, "search"));
    const { height } = this.state;
      return (
        <Router history={history}>
          <div className="catalogue-of-life" ref={this.wrapperRef}>
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
            <ColTree
              catalogueKey={catalogueKey}
              pathToTaxon={pathToTaxon}
              pathToDataset={pathToDataset}
              defaultTaxonKey={defaultTaxonKey}
              height={height}
              treeRef={ref => (this.treeRef = ref)}
            />
          </div>
        </Router>
      );
  

}
}


export default ColTreeWrapper;
