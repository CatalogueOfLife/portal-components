import React from "react";
import { Row, Col, Tag, Tooltip } from "antd";
import Classification from "./Classification";
import { get, initial } from "lodash-es";

const RowDetail = ({ issues, usage, classification, vernacularNames, issueMap }) => (
  <React.Fragment>
    {get(usage, "id") && (
      <Row style={{ marginBottom: "10px" }}>
        <Col
          span={3}
          style={{
            textAlign: "right",
            paddingRight: "16px",
            fontWeight: "bold"
          }}
        >
          ID:
        </Col>
        <Col span={18}>{get(usage, "id")}</Col>
      </Row>
    )}
    {classification && (
      <Row style={{ marginBottom: "10px" }}>
        <Col
          span={3}
          style={{
            textAlign: "right",
            paddingRight: "16px",
            fontWeight: "bold"
          }}
        >
          Classification:
        </Col>
        <Col span={18}>
          <Classification
            classification={initial(classification)}
          />
        </Col>
      </Row>
    )}
    {vernacularNames && (
      <Row>
        <Col
          span={3}
          style={{
            textAlign: "right",
            paddingRight: "16px",
            fontWeight: "bold"
          }}
        >
          Vernacular:
        </Col>
        <Col span={18} style={{paddingBottom: "12px"}}>
          {vernacularNames.slice(0, 8).map(vn => vn.name).join(", ")}
        </Col>
      </Row>
    )}    
    { /* issues && (
      <Row>
        <Col
          span={3}
          style={{
            textAlign: "right",
            paddingRight: "16px",
            fontWeight: "bold"
          }}
        >
          Issues:
        </Col>
        <Col span={18}>
          {issues.map(i => (
            <Tooltip key={i} title={get(issueMap, `[${i}].description`)}>
              {" "}
              <Tag key={i} color={get(issueMap, `[${i}].color`)}>
                {i}
              </Tag>
            </Tooltip>
          ))}
        </Col>
      </Row>
          ) */}
  </React.Fragment>
);

export default RowDetail;
