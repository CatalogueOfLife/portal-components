import React from "react";

import { Form, Select } from "antd";
import _ from "lodash";


const FormItem = Form.Item;

const Option = Select.Option;

const formItemLayout = {
    labelCol: {
      xs: { span: 8 },
      sm: { span: 8 },
    },
    wrapperCol: {
      xs: { span: 16 },
      sm: { span: 16 },
    },
  };

class MultiValueFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: this.props.selected
    };
  }


  handleChange = selected => {
  
    this.setState({ selected }, () => {
      this.props.onChange(selected);
    });
  };

  render = () => {
    const {defaultValue, label, vocab} = this.props;
    const randomID = (Math.floor(Math.random() * 100) +1)*(Math.floor(Math.random() * 100) +1)*(Math.floor(Math.random() * 100) +1);

    return (
        <FormItem
       {...formItemLayout}
        label={label}
        style={{marginBottom: '8px', width: "100%"}}
      >
        <div id={`${_.snakeCase(label)}_${randomID}`}>
      <Select
        showSearch
       // style={{ width: "100%" }}
        mode="multiple"
        placeholder="Please select"
        value={defaultValue}
        onChange={this.handleChange}
        getPopupContainer={() =>
          document.getElementById(`${_.snakeCase(label)}_${randomID}`)
        }
      >
          {vocab.map((i) => {
                return (typeof i === 'string') ? <Option key={i} value={i}>{_.startCase(i)}</Option> : <Option key={i.value} value={i.value}>{i.label}</Option>
              })}
      </Select>
      </div>
      </FormItem>
    );
  };
}

export default MultiValueFilter;
