import React from "react";
import ColTree from "./ColTree"
import qs from "query-string";
import _ from "lodash";
import history from "../history";
import NameAutocomplete from "./NameAutocomplete"

class ColTreeWrapper extends React.Component {
    constructor(props) {
      super(props);
      const {location} = history;
      this.state = { taxonKey: _.get(qs.parse(_.get(location, "search")), 'taxonKey') || null };

    }
  

    render = () => {
    const {catalogueKey, pathToTaxon} = this.props;
    const location = history.location;
    const {taxonKey} = this.state;
      return (
        <React.Fragment>
            <NameAutocomplete
                      datasetKey={catalogueKey}
                      onSelectName={name => {
                        const params = qs.parse(_.get(location, "search"));

                        const newParams = {
                          ...params,
                          taxonKey: _.get(name, "key")
                        };
                       

                        history.push({
                            pathname: location.path,
                            search: `?${qs.stringify(newParams)}`
                          });

                        this.setState({ taxonKey: name.key }
                        );
                      }}
                      onResetSearch={() => {
                        const params = qs.parse(_.get(location, "search"));

                        const newParams = { ...params, taxonKey: null };
                        history.push({
                          pathname: location.path,
                          search: `?${qs.stringify(
                            _.omit(newParams, ["taxonKey"])
                          )}`
                        });
                        this.setState({ taxonKey: null });
                      }}
                    />
       <ColTree defaultExpandKey={taxonKey} catalogueKey={catalogueKey} pathToTaxon={pathToTaxon}/>
       
       </React.Fragment>
      );
    };
  }

  export default ColTreeWrapper;
