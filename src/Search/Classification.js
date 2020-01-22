import React from "react";

export default ({classification, pathToTaxon, maxParents = classification.length}) => {
    const clazzification = classification.slice(Math.max(classification.length - maxParents));
    
    return clazzification.map((t, key) => 
    <React.Fragment key={key}>
        <a onClick={() => {window.location.href = `${pathToTaxon}${t.id}`}}>{t.name}</a>
        {!Object.is(clazzification.length - 1, key) && " > "}
    </React.Fragment>)}