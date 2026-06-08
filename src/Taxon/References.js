import React, { useEffect } from "react";
import { get, values } from "lodash-es";
import linkify from "linkify-html";
import { Row, Col } from "antd";
import XrGutter from "../components/XrGutter";
import DOMPurify from "dompurify";

const ReferencesTable = ({
  data,
  referenceIndexMap,
  style,
  primarySourceDatasetKey,
}) => {
  useEffect(() => {}, [referenceIndexMap]);
  return (
    <div style={style} className="col-reference-link-container">
      {values(data).map((s) => (
        <Row key={s.id}>
          <Col style={{ paddingRight: "5px" }}>
            {get(referenceIndexMap, s.id) && (
              <span>{`[${get(referenceIndexMap, s.id)}]`}</span>
            )}
          </Col>
          <Col span={20} style={{ paddingLeft: "18px" }}>
            <XrGutter
              merged={s?.sourceDataset?.key !== primarySourceDatasetKey}
              createdBy={s?.createdBy}
              datasetKey={s.datasetKey}
              verbatimSourceKey={s?.verbatimSourceKey}
              sourceDatasetKey={s?.sourceDataset?.key}
            >
              <span
                id={`col-reference-${s.id}`}
                dangerouslySetInnerHTML={{
                  __html: linkify(DOMPurify.sanitize(s.citation)),
                }}
              ></span>
            </XrGutter>
          </Col>
        </Row>
      ))}
    </div>
  );
};

export default ReferencesTable;
