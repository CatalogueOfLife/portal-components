import React from "react";
import _ from "lodash";
import { Row, Col } from "antd";

const SourceDatasets = ({
  pathToDataset,
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
                <a href={`${pathToDataset}${s}`}>{`[${s}]`}</a>
         
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
