import React from "react";
import { TagOutlined } from "@ant-design/icons";
import { Popover, Spin, Tag } from "antd";
import client from "../api/client";
import config from "../config";
import { get, isArray } from "lodash-es";
import { getTypeColor } from "./TypeMaterial";
import linkify from "linkify-html";
import XrGutter from "../components/XrGutter";

class TypeMaterialPopover extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      typeMaterial: [],
      loading: false,
      error: null,
    };
  }

  getData = () => {
    const { nameId, datasetKey, references } = this.props;
    if (referenceId) {
      const refIds = !isArray(referenceId) ? [referenceId] : referenceId;
      const typeMaterial = [];
      this.setState({ loading: true });
      Promise.all(
        refIds.map((id) =>
          get(references, id)
            ? Promise.resolve(typeMaterial.push(references[nameId]))
            : client(
                `${
                  config.dataApi
                }dataset/${datasetKey}/name/${encodeURIComponent(nameId)}/types`
              ).then((res) => typeMaterial.push(res.data))
        )
      ).then(() => this.setState({ typeMaterial, loading: false }));
    }
  };

  getContent = () => {
    const { typeMaterial, nameId } = this.props;
    const data = typeMaterial?.[nameId] || [];
    if (data.length > 0)  {
      return (
        <div>
          {data.map((s) => (
            <div key={s.id} style={{ marginBottom: "8px", paddingLeft: "18px" }}>
              <XrGutter merged={s.merged}>
                <Tag color={getTypeColor(s?.status)}>{s?.status}</Tag>{" "}
                {s?.citation && (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: linkify(s?.citation || ""),
                    }}
                  ></span>
                )}
              </XrGutter>
            </div>
          ))}
        </div>
      );
    }
  };

  render = () => {
    const { typeMaterial, nameId } = this.props;
    const data = typeMaterial?.[nameId] || [];

    return data.length > 0 ? (
      <Popover
      getPopupContainer={() =>
            document.getElementById(`type_popover_${nameId}`)
          }
        placement={this.props.placement || "left"}
        title="Type Material"
        content={<div style={{ maxWidth: "500px" }}>{this.getContent()}</div>}
        trigger="click"
      >
        {" "}
        <TagOutlined style={{ cursor: "pointer" }} id={`type_popover_${nameId}`} />
      </Popover>
    ) : (
      ""
    );
  };
}

export default TypeMaterialPopover;
