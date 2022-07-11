import React from "react";
import { BookOutlined } from "@ant-design/icons";
import { Popover, Spin } from "antd";
import axios from "axios";
import config from "../config";
import _ from "lodash";
import ErrorMsg from "../components/ErrorMsg";

class ReferencePopover extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      reference: [],
      loading: false,
      error: null,
    };
  }

  getData = () => {
    const { referenceId, datasetKey, references } = this.props;
     if (referenceId) {
      const refIds = !_.isArray(referenceId) ? [referenceId] : referenceId;
      const reference = [];
      this.setState({ loading: true });
      Promise.allSettled(
        refIds.map((id) => _.get(references, id) ? Promise.resolve(reference.push(references[id])) :

          axios(
            `${config.dataApi}dataset/${datasetKey}/reference/${id}`
          ).then((res) => reference.push(res.data)).catch(err => this.setState({error: err}))

     
        )
      ).then(() => this.setState({ reference, loading: false }));
    }
  };

  getContent = () => {
    const { error, reference, loading } = this.state;
    if (loading) {
      return <Spin />;
    } else if (error) {
      return <ErrorMsg error={error}/>;
    } else if (reference.length === 1) {
      return reference[0].citation;
    } else {
      return (
        <ul>
          {reference.map((r) => (
            <li key={r.id}>{r.citation}</li>
          ))}
        </ul>
      );
    }
  };

  render = () => {
    const { referenceId, referenceIndexMap, trigger } = this.props;
    const refIds = !_.isArray(referenceId) ? [referenceId] : referenceId;
    let icon = referenceIndexMap && _.get(referenceIndexMap, refIds[0]) ? refIds.map(r => <a className="col-reference-link" href={`#col-refererence-${r}`}>{`[${referenceIndexMap[r]}]`}</a>) : <BookOutlined style={{ cursor: "pointer" }} />;

    return referenceId ? (
      <div id={`reference_${referenceId}`} key={`reference_${referenceId}`} style={this.props.style}>
        <Popover
          getPopupContainer={() =>
            document.getElementById(`reference_${referenceId}`)
          }
          placement={this.props.placement || "left"}
          title="Reference"
          onVisibleChange={(visible) => visible && this.getData()}
          content={<div style={{ maxWidth: "500px" }}>{this.getContent()}</div>}
          trigger={trigger || "hover"}
        >
          {icon}
        </Popover>
      </div>
    )  : (
      ""
    );
  };
}

export default ReferencePopover;
