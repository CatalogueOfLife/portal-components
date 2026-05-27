import React from "react";
import { Row, Col } from "antd";
import { LinkTo } from "../router";

const SourceDatasets = ({
  sourceDatasetKeyMap,
  primarySourceDatasetKey,
  style,
}) => {
  return (
    <div style={style} className="col-reference-link-container">
      {Object.keys(sourceDatasetKeyMap)
        .filter((s) => Number(s) !== Number(primarySourceDatasetKey))
        .map((s) => (
          <Row key={s}>
            <Col style={{ paddingRight: "5px" }}>
              <LinkTo to="source" args={s}>{`[${s}]`}</LinkTo>
            </Col>
            <Col span={20} flex="auto">
              <div id={`col-sourcedataset-${s}`}>
                {sourceDatasetKeyMap[s]?.title}
              </div>
            </Col>
          </Row>
        ))}
    </div>
  );
};

export default SourceDatasets;
