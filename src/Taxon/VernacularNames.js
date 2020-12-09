import React from "react";
import { Table } from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../config";
import ReferencePopover from "./ReferencePopover";

import { getCountries } from "../api/enumeration";

class VernacularNamesTable extends React.Component {
  constructor(props) {
    super(props);
    const {references} = this.props;
    this.state = {
      data: this.props.data ? [...this.props.data] : [],
      countryAlpha3: {},
      countryAlpha2: {},
      columns: [
        {
          title: "Original name",
          dataIndex: "name",
          key: "name",
        },
        {
          title: "Transliterated name",
          dataIndex: "latin",
          key: "latin",
        },
        {
          title: "Language",
          dataIndex: "language",
          key: "language",

          render: (text, record) =>
            record.languageName ? record.languageName : text,
        },
        {
          title: "Country of use",
          dataIndex: "country",
          key: "country",

          render: (text, record) =>
            record.countryTitle ? record.countryTitle : text,
        },
        {
          title: "",
          dataIndex: "referenceId",
          key: "referenceId",

          render: (text, record) => {
            return text ? (
              <ReferencePopover
                referenceId={text}
                references={references}
                datasetKey={this.props.datasetKey}
                placement="left"
              ></ReferencePopover>
            ) : (
              ""
            );
          },
        },
      ],
    };
  }
  componentDidMount = () => {
    const { data } = this.props;

    getCountries()
      .then((res) => {
        const countryAlpha3 = {};
        const countryAlpha2 = {};
        res.forEach((c) => {
          countryAlpha3[c.alpha3] = c;
          countryAlpha2[c.alpha2] = c;
        });
        const newData = data.map((d) =>
          this.decorateWithCountryByCode(d, countryAlpha2, countryAlpha3)
        );
        this.setState({ data: newData });
        return Promise.all(newData.map(this.decorateWithLanguageByCode));
      })
      .then(() => {
        this.state.data.sort((a, b) =>
          a.languageName > b.languageName ? 1 : -1
        );
        this.setState({ data: [...this.state.data] });
      });
  };

  decorateWithCountryByCode = (name, countryAlpha2, countryAlpha3) => {
    if (countryAlpha2 && name.country && name.country.length === 2) {
      return {
        ...name,
        countryTitle: _.get(countryAlpha2, `[${name.country}].title`) || "",
      };
    } else if (countryAlpha3 && name.country && name.country.length === 3) {
      return {
        ...name,
        countryTitle: _.get(countryAlpha3, `[${name.country}].title`) || "",
      };
    } else {
      return name;
    }
  };

  decorateWithLanguageByCode = (name) => {
    return !name.language
      ? Promise.resolve()
      : axios(`${config.dataApi}vocab/language/${name.language}`)
          .then((res) => {
            name.languageName = res.data;
          })
          .catch((error) => console.log(error));
  };
  render() {
    const { style } = this.props;
    const { data, columns } = this.state;

    return (
      <Table
        style={style}
        className="colplus-taxon-page-list"
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
        size="middle"
      />
    );
  }
}

export default VernacularNamesTable;
