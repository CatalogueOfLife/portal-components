import React from "react";

const ranks = ["family", "superfamily", "order", "subclass", "class", "superclass", "subphylum", "phylum"];
const navigateToTaxon = (pathToTaxon, id) => {
    if(typeof pathToTaxon === "string"){
        window.location.href = `${pathToTaxon}${id}`;
      } else if(typeof pathToTaxon === "function"){
        pathToTaxon(id)
      }
}
export default ({classification, pathToTaxon, maxParents = classification.length, truncate}) => {
    const clazzification = classification.slice(Math.max(classification.length - maxParents));
    if(truncate){
        const classificationRankMap = classification.reduce((acc,curr)=> (acc[curr.rank]= curr,acc),{});

        const kingdom = classificationRankMap["kingdom"];
        let familyOrClosestAlternative;
        for(let i =0; i < ranks.length; i++){
            if(classificationRankMap[ranks[i]]){
                familyOrClosestAlternative = classificationRankMap[ranks[i]];
                break;
            }
        }
        if(kingdom && familyOrClosestAlternative){
            return <React.Fragment >
                <a onClick={() => navigateToTaxon(pathToTaxon, kingdom.id)}>{kingdom.name}</a> 
                {familyOrClosestAlternative.rank === "phylum" ? " > " : " > ... > "}
                <a onClick={() => navigateToTaxon(pathToTaxon, familyOrClosestAlternative.id)}>{familyOrClosestAlternative.name}</a> 
            </React.Fragment>
        } else if(kingdom) {     
            return <a onClick={() => navigateToTaxon(pathToTaxon, kingdom.id)}>{kingdom.name}</a> 
        } else {
            return null;
        }
    } else {
        return clazzification.map((t, key) => 
    <React.Fragment key={key}>
        <a onClick={() => navigateToTaxon(pathToTaxon, t.id)}>{t.name}</a>
        {!Object.is(clazzification.length - 1, key) && " > "}
    </React.Fragment>)}
    }
    