import React from "react";
import client from "../api/client";
import config from "../config";
import { AutoComplete, Input , Select} from "antd";
import { debounce, get } from "lodash-es";
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
    if (defaultTaxonKey !== prevProps.defaultTaxonKey) {
      if (defaultTaxonKey) {
        this.setDefaultValue(defaultTaxonKey);
      } else {
        this.setState({ value: "", options: [] });
      }
    }
  };

  componentWillUnmount() {
    this.getNames.cancel();
  }

  setDefaultValue = (usageId) => {
    const { datasetKey } = this.props;
    client(
      `${config.dataApi}dataset/${datasetKey}/nameusage/search?USAGE_ID=${usageId}`
    ).then((res) => {
      this.setState({ value: get(res, "data.result[0].usage.label") || "" });
    });
  };
  getNames = (q) => {
    const { datasetKey, minRank, extinct /* hideExtinct */ } = this.props;
    const {value} = this.state;
    const url = datasetKey
      ? `${config.dataApi}dataset/${datasetKey}/nameusage/suggest`
      : `${config.dataApi}name/search`;

    client(
      `${url}?limit=25&q=${q}${
        minRank ? `&minRank=${minRank}` : ""
      }${extinct ? `&extinct=${extinct}`:''}`
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
    const selectedTaxon = get(obj, "data.acceptedUsageId")
      ? {
          key: get(obj, "data.acceptedUsageId"),
          rank: get(obj, "data.rank"),
          title: get(obj, "data.parentOrAcceptedName"),
        }
      : { key: get(obj, "data.usageId"), rank: get(obj, "data.rank"), title: get(obj, "data.name") };
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
        value:  o.usageId, //o.suggestion,
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
     <div id={`taxon_autocomplete_${randomID}`} className="taxon-autocomplete">
       <Select
       value={value || undefined}
        defaultActiveFirstOption={false}
        suffixIcon={null}
       showSearch
       allowClear
             notFoundContent={null}

        style={this.props.style ? this.props.style : { width: "100%" }}
        options={options}
        filterOption={false}
        onSelect={this.onSelectName}
        onClear={this.onReset}
        onSearch={(q) => (!!q ? this.getNames(q) : this.onReset())}
        placeholder={placeHolder || "Find taxon"}
        autoFocus={autoFocus === false ? false : true}
        disabled={disabled}
        getPopupContainer={() => {
          console.log(`Test ${randomID}`)
          return document.getElementById(`taxon_autocomplete_${randomID}`)
        }
          
        }
        
      >
       
      </Select>
      {/* <AutoComplete
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
      </AutoComplete> */}
      
      </div> 
    );
  };
}

export default NameSearchAutocomplete;
