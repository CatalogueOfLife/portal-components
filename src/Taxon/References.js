import React, { useEffect } from "react";
import _ from "lodash";
import linkify from "linkify-html";
import { Row, Col } from "antd";
import MergedDataBadge from "../components/MergedDataBadge";
import DOMPurify from "dompurify";

const ReferencesTable = ({
  data,
  referenceIndexMap,
  style,
  primarySourceDatasetKey,
  pathToDataset,
}) => {
  useEffect(() => {}, [referenceIndexMap]);
  return (
    <div style={style} className="col-reference-link-container">
      {_.values(data)
      .map((s) => (
        <>
          <Row key={s.id}>
            <Col style={{ paddingRight: "5px" }}>
              {_.get(referenceIndexMap, s.id) && (
                <span>{`[${_.get(referenceIndexMap, s.id)}]`}</span>
              )}
            </Col>
            <Col span={20}>
            {s?.sourceDataset?.key !== primarySourceDatasetKey &&
             <MergedDataBadge
              createdBy={s?.createdBy}
              datasetKey={s.datasetKey} 
              verbatimSourceKey={s?.verbatimSourceKey} 
              sourceDatasetKey={s?.sourceDataset?.key} 
              pathToDataset={pathToDataset} />}
              <span
                id={`col-refererence-${s.id}`}
                dangerouslySetInnerHTML={{ __html: linkify(DOMPurify.sanitize(s.citation)) }}
              ></span>
            </Col>
          </Row>

        
        </>
      ))}
    </div>
  );
};

export default ReferencesTable;
