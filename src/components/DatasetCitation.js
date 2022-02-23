import React from 'react';


const Citation = ({ dataset }) => {

  return (
    <div className="col-dataset-citation">
      <div className="col-dataset-citation-title">{dataset.citation ? <span dangerouslySetInnerHTML={{__html: dataset.citation}}></span> : dataset.title}</div>
      <div className="col-dataset-citation-source"> - accessed through <a href={`https://www.checklistbank.org/dataset/${dataset.key}`}>ChecklistBank</a></div>
    </div>
  );
};


export default Citation;