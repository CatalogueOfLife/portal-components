
import React from "react";
import { Router } from "react-router-dom";
import history from "../history";
import NameSearch from "./NameSearch";
import axios from "axios";
import btoa from "btoa"

export default   ({catalogueKey, pathToTaxon, defaultTaxonKey, citation, auth}) => {
  if(auth){
    
      axios.defaults.headers.common['Authorization'] = `Basic ${btoa(auth)}`;
    
  }
  return  <Router history={history}>
          
                <NameSearch catalogueKey={catalogueKey} pathToTaxon={pathToTaxon} defaultTaxonKey={defaultTaxonKey} citation={citation}/>
                    
          </Router>
}