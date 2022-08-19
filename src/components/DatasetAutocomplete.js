import React from 'react';
import axios from 'axios';
import config from "../config";
import { CloseCircleOutlined } from '@ant-design/icons';
import { AutoComplete, Input, Button } from 'antd';
import _ from 'lodash'
import {debounce} from 'lodash';
import Highlighter from "react-highlight-words";

const Option = AutoComplete.Option;

class DatasetAutocomplete extends React.Component {

    constructor(props) {
        super(props);

        this.getDatasets = debounce(this.getDatasets, 500);

        this.state = {
            datasets: [],
            value: '',
            randomID: (Math.floor(Math.random() * 100) +1)*(Math.floor(Math.random() * 100) +1)*(Math.floor(Math.random() * 100) +1)
        }
    }

    

    componentDidMount = () => {
        const {defaultDatasetKey} = this.props;
        if(defaultDatasetKey){
            this.setDefaultValue(defaultDatasetKey)
        }
    }

    componentDidUpdate = (prevProps) => {
        const { defaultDatasetKey} = this.props;
        if(defaultDatasetKey && defaultDatasetKey !== prevProps.defaultDatasetKey){
            this.setDefaultValue(defaultDatasetKey)
        } else if(prevProps.defaultDatasetKey && !defaultDatasetKey){
            this.setState({value: ''})
        }
    }

    componentWillUnmount() {
        this.getDatasets.cancel();
    }

    setDefaultValue = (defaultDatasetKey) => {
        axios(`${config.dataApi}dataset/${defaultDatasetKey}`)
            .then(res => {
                this.setState({value: _.get(res, 'data.title') || ''})
                this.props.onSelectDataset(res.data)
            })
    }

    getDatasets = (q) => {
        const {contributesTo} = this.props;
        axios(`${config.dataApi}dataset?q=${q}&limit=30${contributesTo ? '&contributesTo='+contributesTo : ''}`)
            .then((res) => {
                this.setState({ datasets: res.data.result})
            })
            .catch((err) => {
                this.setState({ datasets: [], err })
            })
    }
    onSelectDataset = (val, obj) => {
        this.setState({value: val})
        this.props.onSelectDataset({key: obj.key, title: val})
    }
    onReset = () => {
        this.setState({ value: "", names: [] }, this.props.onResetSearch);
    }
    render = () => {
        const {value, randomID} = this.state;
        const {style} = this.props
       // const randomID = (Math.floor(Math.random() * 100) +1)*(Math.floor(Math.random() * 100) +1)*(Math.floor(Math.random() * 100) +1);
        

          const options = this.state.datasets ? this.state.datasets.map((o) => {
              const text = `${o.alias || o.title} [${o.key}]`;
              return {
                key: o.key,
                value: text,
                label: (
                    <Highlighter
                  highlightStyle={{ fontWeight: "bold", padding: 0 }}
                  searchWords={value.split(" ")}
                  autoEscape
                  textToHighlight={text}
                />
                ),
                data: o
              }
            
          }) : [];

        return <div id={`dataset_autocomplete_${randomID}`}><AutoComplete
            onSelect={this.onSelectDataset}
            onSearch={(q) => (!!q ? this.getDatasets(q) : this.onReset())}
            options={options}
            placeholder={this.props.placeHolder || "Find dataset"}
            style={style ? style : { width: '100%' }}
            onChange={(value) => this.setState({value})}
            value={value}
            optionLabelProp="value"
            getPopupContainer={() =>
                document.getElementById(`dataset_autocomplete_${randomID}`)
              }
        >
            <Input.Search allowClear />
        </AutoComplete></div>
    }

}

export default DatasetAutocomplete;