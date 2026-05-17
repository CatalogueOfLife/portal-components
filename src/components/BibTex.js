import React from "react";
import config from "../config";

const BibTex = ({ datasetKey, sourceDatasetKey, style = {} }) => {
const defaultStyle = {
    height: "40px"
}
const url = sourceDatasetKey ? `${config.dataApi}dataset/${datasetKey}/source/${sourceDatasetKey}.bib` : `${config.dataApi}dataset/${datasetKey}.bib`

  return (
    <a href={url} >
      <img src="https://www.checklistbank.org/images/bibtex_logo.png" style={{...defaultStyle, ...style}} />
    </a>
  );
};

export default BibTex;
