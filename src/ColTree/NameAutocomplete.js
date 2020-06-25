import React from "react";
import axios from "axios";
import config from "../config";
import { CloseCircleOutlined } from '@ant-design/icons';
import { AutoComplete, Input, Form } from "antd";
import _ from "lodash";
import {debounce} from 'lodash';
import Highlighter from "react-highlight-words";

const FormItem = Form.Item;

class NameSearchAutocomplete extends React.Component {
  constructor(props) {
    super(props);

    this.getNames = debounce(this.getNames, 500);
    this.state = {
      names: [],
      value: "",
    };
  }

  componentDidMount = () => {
    const { defaultTaxonKey } = this.props;
    if (defaultTaxonKey) {
      this.setDefaultValue(defaultTaxonKey);
    }
  };

  componentDidUpdate = (prevProps) => {
    const { defaultTaxonKey } = this.props;
    if (defaultTaxonKey && defaultTaxonKey !== prevProps.defaultTaxonKey) {
      this.setDefaultValue(defaultTaxonKey);
    }
  };

  componentWillUnmount() {
    this.getNames.cancel();
  }

  setDefaultValue = (usageId) => {
    const { datasetKey } = this.props;
    axios(
      `${config.dataApi}dataset/${datasetKey}/nameusage/search?USAGE_ID=${usageId}`
    ).then((res) => {
      this.setState({ value: _.get(res, "data.result[0].usage.label") || "" });
    });
  };
  getNames = (q) => {
    const { datasetKey } = this.props;
    const url = datasetKey
      ? `${config.dataApi}dataset/${datasetKey}/nameusage/suggest`
      : `${config.dataApi}name/search`;

    axios(`${url}?vernaculars=false&fuzzy=false&limit=25&q=${q}`)
      .then((res) => {
        const names = res.data.result ? res.data.result.map((name) => ({
            key: name.usage.name.id,
            title: name.usage.name.scientificName,
          })) : res.data.suggestions.map((name) => ({
            key: name.usageId ,
            title: name.suggestion 
          }));
        this.setState({
          names
        });
      })
      .catch((err) => {
        this.setState({ names: [], err });
      });
  };
  onSelectName = (val, obj) => {
    this.setState({ value: val });
    this.props.onSelectName({ key: obj.key, title: val});
  };
  onReset = () => {
    this.setState({ value: "", names: [] });
    this.props.onResetSearch();
  };



  render = () => {
    const { placeHolder, autoFocus } = this.props;
    const { value } = this.state;
    const options = this.state.names.map((o) => {
        return {
            key: o.key,
            value: o.title,
            label: (
                <Highlighter
                highlightStyle={{ fontWeight: "bold", padding: 0 }}
                searchWords={value.split(" ")}
                autoEscape
                textToHighlight={o.title}
              /> 
            ),
          }
    });
    const suffix = value ? (
      <CloseCircleOutlined key="suffix" onClick={this.onReset} style={{ marginRight: "6px" }} />
    ) : (
      ""
    );
    return (
    <FormItem> <AutoComplete
        style={{ width: "100%", marginBottom: '8px' }}
        options={options}
        onSelect={this.onSelectName}
        onSearch={this.getNames}
        placeholder={placeHolder || "Find taxon"}
        onChange={(value) => this.setState({ value })}
        value={value}
        autoFocus={autoFocus === false ? false : true}
      >
        <Input.Search suffix={suffix} 
 />
      </AutoComplete>
      </FormItem> 
    );
  };
}

export default NameSearchAutocomplete;
