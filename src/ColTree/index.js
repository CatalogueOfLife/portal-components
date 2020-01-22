import React from "react";
import ColTree from "./ColTree";
import { Router } from "react-router-dom";
import qs from "query-string";
import _ from "lodash";
import history from "../history";
import ColTreeActions from "./ColTreeActions"
import NameAutocomplete from "./NameAutocomplete";


const ColTreeWrapper = ({ catalogueKey, pathToTaxon }) => {
  return (
    <Router history={history}>
      <div className="catalogue-of-life">
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

            ColTreeActions.emit('refreshTree')
          }}
          onResetSearch={() => {
            const params = qs.parse(_.get(location, "search"));

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
        />
      </div>
    </Router>
  );
};

export default ColTreeWrapper;
