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
      open: false
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
/*         const names = res.data.result ? res.data.result.map((name) => ({
            key: name.usage.name.id,
            title: name.usage.name.scientificName,
          })) : res.data.suggestions.map((name) => ({
            key: name.usageId ,
            title: name.suggestion 
          })); */
        this.setState({
          names: res.data.suggestions || []
        });
      })
      .catch((err) => {
        this.setState({ names: [], err });
      });
  };
  onSelectName = (val, obj) => {
    const selectedTaxon = _.get(obj, 'data.acceptedUsageId') ? 
    {key: _.get(obj, 'data.acceptedUsageId'), title: _.get(obj, 'data.parentOrAcceptedName')} :
    {key: _.get(obj, 'data.usageId'), title: _.get(obj, 'data.name')}
    this.setState({ value: val });
    this.props.onSelectName(selectedTaxon);
  };
  onReset = () => {
    this.setState({ value: "", names: [] }, this.props.onResetSearch);
  };



  render = () => {
    const { placeHolder, autoFocus } = this.props;
    const { value } = this.state;
    const options = this.state.names.map((o) => {
        return {
          key: o.usageId,
          value: o.suggestion,
          label: (
              <Highlighter
              highlightStyle={{ fontWeight: "bold", padding: 0 }}
              searchWords={value.split(" ")}
              autoEscape
              textToHighlight={o.suggestion}
            /> 
          ),
          data: o
          }
    });
   
    return (
    <AutoComplete
        style={this.props.style ? this.props.style : { width: "100%" }}
        options={value ? options : []}
        onSelect={this.onSelectName}
        onSearch={q => !!q ? this.getNames(q) : this.onReset()}
        placeholder={placeHolder || "Find taxon"}
        onChange={(value) => this.setState({ value })}
        value={value}
        autoFocus={autoFocus === false ? false : true}
      >
        <Input.Search allowClear
 />
      </AutoComplete>
    
    );
  };
}

export default NameSearchAutocomplete;
