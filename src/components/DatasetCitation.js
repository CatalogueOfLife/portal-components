import React from 'react';


const Citation = ({ dataset }) => {

  return (
    <div className="col-dataset-citation">
      <div className="col-dataset-citation-title">{dataset.citation || dataset.title}</div>
      <div className="col-dataset-citation-source"> - accessed through <a href={`https://data.catalogueoflife.org/dataset/${dataset.key}`}>Catalogue of Life Checklistbank</a></div>
    </div>
  );
};



export default Citation;