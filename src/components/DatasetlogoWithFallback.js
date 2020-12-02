import React from "react";
import config from "../config";

class DatasetlogoWithFallback extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: true, loading: true };
  }

  render() {

      // Note that authenticated URLs will be blocked by chrome, IE and others. Seems to work in FF though
      const {fallBack = null,catalogueKey, datasetKey, style, size = 'MEDIUM', auth} = this.props;
      const dataApiParts = config.dataApi.split("//");
      const protocol = `${dataApiParts[0]}//`;
      const location = `${dataApiParts[1]}dataset/${catalogueKey}/source/${datasetKey}/logo?size=${size}`;
      const {error, loading} = this.state;
    return (loading || !error) ?  
        <img
          style={style}
          src={`${protocol}${auth ? auth + "@" : ""}${location}`}
          onLoad={() => this.setState({error: false, loading: false})}
          onError={() => this.setState({error: true, loading: false})}
        /> : fallBack;
       
    ;
  }
}
export default DatasetlogoWithFallback;