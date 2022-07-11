import React, {useEffect} from "react";
import _ from "lodash";
import linkify from 'linkify-html';
import {Row, Col} from "antd"

const ReferencesTable = ({ data, referenceIndexMap, style }) => {
  useEffect(()=>{},[referenceIndexMap])
  return (
    <div style={style} className="col-reference-link-container">
      {_.values(data)
        
        .map(s => (
            <Row>
              <Col style={{paddingRight: "5px"}}>
             {_.get(referenceIndexMap, s.id) && <span>
              {`[${_.get(referenceIndexMap, s.id)}]`}
              </span>}
              </Col>
              <Col span={20} >
              <span  id={`col-refererence-${s.id}`}
                  dangerouslySetInnerHTML={{ __html: linkify(s.citation)}}
                ></span>
              </Col>

                
             
            </Row>
             
        ))}
    </div>
  );
};

export default ReferencesTable;


/* import React from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem"

const ReferencesTable = ({ data, style }) => {
  return (
    <div style={style}>
      {_.values(data)
        
        .map(s => (
          <BorderedListItem key={s.id}>
            {s.citation}
          </BorderedListItem>
        ))}
    </div>
  );
};

export default ReferencesTable; */
