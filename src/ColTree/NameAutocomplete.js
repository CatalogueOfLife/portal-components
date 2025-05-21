import React from "react";
import axios from "axios";
import config from "../config";
import { AutoComplete, Input } from "antd";
import _ from "lodash";
import { debounce } from "lodash";
import Highlighter from "react-highlight-words";


class NameSearchAutocomplete extends React.Component {
  constructor(props) {
    super(props);

    this.getNames = debounce(this.getNames, 500);
    this.state = {
      options: [],
      value: "",
      randomID: (Math.floor(Math.random() * 100) +1)*(Math.floor(Math.random() * 100) +1)*(Math.floor(Math.random() * 100) +1)
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
    const { datasetKey, minRank, hideExtinct } = this.props;
    const {value} = this.state;
    const url = datasetKey
      ? `${config.dataApi}dataset/${datasetKey}/nameusage/suggest`
      : `${config.dataApi}name/search`;

    axios(
      `${url}?fuzzy=false&limit=25&q=${q}${
        minRank ? `&minRank=${minRank}` : ""
      }${hideExtinct ? `&extinct=false&extinct=`:''}`
    )
      .then((res) => {
        this.setState({
         // names: res.data || [],
          options: this.getOptions(res.data || [], value)
        });
      })
      .catch((err) => {
        this.setState({  options: [], err });
      });
  };
  onSelectName = (val, obj) => {
    const selectedTaxon = _.get(obj, "data.acceptedUsageId")
      ? {
          key: _.get(obj, "data.acceptedUsageId"),
          rank: _.get(obj, "data.rank"),
          title: _.get(obj, "data.parentOrAcceptedName"),
        }
      : { key: _.get(obj, "data.usageId"), rank: _.get(obj, "data.rank"), title: _.get(obj, "data.name") };
    this.setState({ value: val });
    this.props.onSelectName(selectedTaxon);
  };
  onReset = () => {
    this.setState({ value: "", options: [] }, this.props.onResetSearch);
  };

  getOptions = (names, searchTerm) => {
    return names.map((o) => {
      return {
        key: o.usageId,
        value: o.suggestion,
        label: (
          <Highlighter
            highlightStyle={{ fontWeight: "bold", padding: 0 }}
            searchWords={searchTerm ? searchTerm.split(" ") : []}
            autoEscape
            textToHighlight={o.suggestion}
          />
        ),
        data: o,
      };
    });
  }
  render = () => {
    const { placeHolder, autoFocus, disabled } = this.props;
    const { value , options, randomID} = this.state;
    //const randomID = (Math.floor(Math.random() * 100) +1)*(Math.floor(Math.random() * 100) +1)*(Math.floor(Math.random() * 100) +1);

   // const options = this.getOptions(this.state.names, value)

    return (
     <div id={`taxon_autocomplete_${randomID}`}><AutoComplete
        style={this.props.style ? this.props.style : { width: "100%" }}
        options={options}
        onSelect={this.onSelectName}
        onSearch={(q) => (!!q ? this.getNames(q) : this.onReset())}
        placeholder={placeHolder || "Find taxon"}
        onChange={(value) => {
          if(value){
            this.setState({ value  })
          } else {
            setTimeout(this.onReset, 50); 
          }
        }}
        value={value}
        autoFocus={autoFocus === false ? false : true}
        disabled={disabled}
        getPopupContainer={() => {
          console.log(`Test ${randomID}`)
          return document.getElementById(`taxon_autocomplete_${randomID}`)
        }
          
        }
        
      >
        <Input.Search allowClear />
      </AutoComplete></div> 
    );
  };
}

export default NameSearchAutocomplete;
