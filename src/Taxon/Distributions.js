import React, { useState, useEffect } from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem";
import ReferencePopover from "./ReferencePopover";
import config from "../config";
import axios from "axios";
import MergedDataBadge from "../components/MergedDataBadge";

const DistributionsTable = ({ datasetKey, data, style, pathToDataset }) => {
  const [iso3Map, setIso3Map] = useState({});

  useEffect(()=> {   
    let isIso = false;
    for(let i=0; i< data.length; i++){
      if(data[i].gazetteer === 'iso'){
        isIso = true;
        break;
      }
    }
    if(isIso){
      axios(`${config.dataApi}vocab/country`)
      .then((res) => {
        setIso3Map(_.keyBy(res.data, 'alpha3'))
      })
    }
    
  }, [])
  return (
    <div style={style}>
      {data.map((s, i) => (
        <span key={i}>
          {s?.merged && <MergedDataBadge
              createdBy={s?.createdBy}
              datasetKey={s.datasetKey} 
              sourceDatasetKey={s?.sourceDatasetKey}
              verbatimSourceKey={s?.verbatimSourceKey} 
              pathToDataset={pathToDataset} style={{marginRight: "4px"}} />}
          {(_.get(iso3Map, `[${_.get(s, "area.name")}].name`) ? _.startCase(_.get(iso3Map, `[${_.get(s, "area.name")}].name`)): null )|| _.get(s, "area.name") || _.get(s, "area.globalId")}{" "}
          {s.referenceId && (
            <ReferencePopover
              datasetKey={datasetKey}
              referenceId={s.referenceId}
              placement="bottom"
            />
          )}
          {i < data.length -1 && ", "}
        </span>
      ))}
    </div>
  );
};

export default DistributionsTable;
