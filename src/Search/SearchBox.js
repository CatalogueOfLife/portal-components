import React from "react";
import { CloseCircleOutlined } from '@ant-design/icons';
import { Input } from "antd";
// test
const Search = Input.Search;

class SearchBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: ""
    };
  }
  componentDidMount = () => {
    if (this.props.defaultValue) {
      this.setState({ search: this.props.defaultValue });
    }
  };
  componentDidUpdate = (prevProps) => {

    if (prevProps.defaultValue !== this.props.defaultValue) {
      this.setState({ search: this.props.defaultValue});
    }
  }

  resetSearch = () => {
    this.setState({ search: "" }, () => {
      this.props.onSearch(this.state.search);
    });
  }
  render = () => {
    
    return (
      <Search
        style={this.props.style || null}
        placeholder="input search text"
        value={this.state.search}
        onSearch={value => this.props.onSearch(this.state.search)}
        onChange={event => this.setState({ search: event.target.value})}
        allowClear
        autoFocus={true}
      />
    );
  };
}

export default SearchBox;
