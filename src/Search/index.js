
import React from "react";
import { Router } from "react-router-dom";
import history from "../history";
import NameSearch from "./NameSearch";

export default   ({catalogueKey, pathToTaxon}) => {
  return  <Router history={history}>
          
                <NameSearch catalogueKey={catalogueKey} pathToTaxon={pathToTaxon} />
                    
          </Router>
}