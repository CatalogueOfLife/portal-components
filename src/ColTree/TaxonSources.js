import React from "react";
import {Popover, Spin} from 'antd'
import { getDatasetsBatch } from "../api/dataset";
import DataLoader from "dataloader";
import config from "../config";
const datasetLoader = new DataLoader(ids => getDatasetsBatch(ids));


class TaxonSources extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      showInNode: false,
      loading: false
    };
  }

  componentDidMount = () => {
    const { datasetSectors } = this.props;

    if (Object.keys(datasetSectors).length < 4) {
        this.setState({showInNode: true}, this.getData)
    } 
  };

  getData = () => {
    this.setState({ loading: true});
    const { datasetSectors } = this.props;
    const promises = Object.keys(datasetSectors).map(s =>
      datasetLoader.load(s).then(dataset => dataset)
    );

    Promise.all(promises).then(data => {
      this.setState({ data , loading: false});
    });
  };

  render = () => {
    const { data, showInNode, popOverVisible, loading } = this.state;
    const {taxon, catalogueKey} = this.props;

    return (
        showInNode ?  <React.Fragment>
       {" •"} {data.map((d, index) => (
                      <a key={d.key} 
                        style={{ fontSize: "11px"}} 
                        href={`${config.clearingHouseUrl}catalogue/${catalogueKey}/dataset/${d.key}/meta`}
                        onClick={()=> {
                            const uri =  `${config.clearingHouseUrl}catalogue/${catalogueKey}/dataset/${d.key}/meta`;
                            const win = window.open(uri, '_blank');
                            win.focus();
                          }}
                        >
                      
                   
                      { (index ? ', ' : '') + (d.alias || d.key) }
                    </a>
                    
                  ))}
      </React.Fragment> :
      <React.Fragment>
             
              <Popover
                content={loading ? <Spin /> :
                  <div style={{'maxWidth': '400px'}}>
                   <span>Source databases: </span>   
                  {data.map((d, index) => (
                      <a key={d.key} 
                        style={{ fontSize: "11px"}} 
                        href={`${config.clearingHouseUrl}catalogue/${catalogueKey}/dataset/${d.key}/meta`}
                        onClick={()=> {
                            const uri =  `${config.clearingHouseUrl}catalogue/${catalogueKey}/dataset/${d.key}/meta`;
                            const win = window.open(uri, '_blank');
                            win.focus();
                          }}>
                      
                   
                      { (index ? ', ' : '') + (d.alias || d.key) }
                    </a>
                    
                  ))}
                  </div>
                }
                title={<span 
                    dangerouslySetInnerHTML={{ __html: taxon.name }} 
                    />}
                visible={popOverVisible}
                onVisibleChange={() =>
                  this.setState({ popOverVisible: !popOverVisible })
                }
                trigger="click"
                placement="rightTop"
              >
                 {" •"} <a style={{ fontSize: "11px" }} 
                           href="" 
                           onClick={() => {this.getData(); this.setState({ popOverVisible: !popOverVisible })}}>
                               Multiple providers 
                               </a>
              </Popover>
    </React.Fragment>

    );
  };
}

export default TaxonSources;
