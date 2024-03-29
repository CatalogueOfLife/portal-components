import React from "react";
import config from "../config";

class DatasetlogoWithFallback extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: true, loading: true };
  }
  render() {

      const {fallBack = null,catalogueKey, datasetKey, style, size = 'MEDIUM'} = this.props;
      const {error, loading} = this.state;
    return (loading || !error) ?  
        <img
          style={style}
          src={`${config.dataApi}dataset/${catalogueKey}/logo/source/${datasetKey}?size=${size}`}
          onLoad={() => this.setState({error: false, loading: false})}
          onError={() => this.setState({error: true, loading: false})}
        /> : fallBack;
       
    ;
  }
}
export default DatasetlogoWithFallback;