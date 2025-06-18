import React from "react";
import axios from "axios";
import { withRouter } from "react-router-dom";
import { UpOutlined, DownOutlined } from "@ant-design/icons";
import { getDataset } from "../api/dataset";
import {
  Table,
  Alert,
  Switch,
  Checkbox,
  Row,
  Col,
  Button,
  Form,
  Radio,
} from "antd";
import config from "../config";
import qs from "query-string";
import history from "../history";
import Classification from "./Classification";
import SearchBox from "./SearchBox";
import MultiValueFilter from "./MultiValueFilter";
import RowDetail from "./RowDetail";
import _ from "lodash";
import ErrorMsg from "../components/ErrorMsg";
import NameAutocomplete from "../ColTree/NameAutocomplete";
import DatasetAutocomplete from "../components/DatasetAutocomplete";
import Citation from "../components/DatasetCitation";
import MergedDataBadge from "../components/MergedDataBadge";

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const FACET_VOCAB = [
  "rank",
  "issue",
  "status",
  "nomStatus",
  "nameType",
  "field",
  "authorship",
  "extinct",
  "environment",
];
const PAGE_SIZE = 50;
const defaultParams = {
  limit: 50,
  offset: 0,
  facet: FACET_VOCAB, //["rank", "issue", "status", "nomStatus", "nameType", "field"],
  sortBy: "taxonomic",
};

const getColumns = (pathToTaxon) => [
  {
    title: "",
    dataIndex: ["usage", "merged"],
    key: "merged",
    width: 12,
    render: (text, record) =>
      record?.usage?.merged ? <MergedDataBadge /> : "",
  },
  {
    title: "Scientific Name",
    dataIndex: ["usage", "labelHtml"],
    key: "scientificName",
    render: (text, record) => {
      const id =
        _.get(record, "usage.accepted.id") || _.get(record, "usage.id");
      return (
        <>
          <a
            href={typeof pathToTaxon === "string" ? `${pathToTaxon}${id}` : "#"}
            onClick={(e) => {
              if (typeof pathToTaxon === "string") {
                window.location.href = `${pathToTaxon}${id}`;
              } else if (typeof pathToTaxon === "function") {
                e.preventDefault();
                pathToTaxon(id);
              }
            }}
            dangerouslySetInnerHTML={{ __html: text }}
          />
        </>
      );
    },
    width: 200,
    sorter: true,
  },
  {
    title: "Status",
    dataIndex: ["usage", "status"],
    key: "status",
    width: 200,
    render: (text, record) => {
      return !["synonym", "ambiguous synonym", "misapplied"].includes(text) ? (
        text
      ) : (
        <React.Fragment key={_.get(record, "usage.id")}>
          {text} {text === "misapplied" ? "to " : "of "}
          <span
            dangerouslySetInnerHTML={{
              __html: _.get(record, "usage.accepted.labelHtml"),
            }}
          />
        </React.Fragment>
      );
    },
  },
  {
    title: "Rank",
    dataIndex: ["usage", "name", "rank"],
    key: "rank",
    width: 60,
    sorter: true,
  },
  {
    title: "Classification",
    dataIndex: ["usage", "classification"],
    key: "parents",
    width: 180,
    render: (text, record) => {
      return !_.get(record, "classification") ? (
        ""
      ) : (
        <Classification
          key={_.get(record, "usage.id")}
          classification={_.initial(record.classification)}
          truncate={true}
          datasetKey={_.get(record, "usage.name.datasetKey")}
          pathToTaxon={pathToTaxon}
        />
      );
    },
  },
];

class NameSearchPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      advancedFilters: false,
      columns: getColumns(this.props.pathToTaxon),
      params: {},
      pagination: {
        pageSize: PAGE_SIZE,
        current: 1,
        showQuickJumper: true,
        pageSizeOptions: [50, 100, 500, 1000],
      },
      loading: false,
      dataset: null,
    };
  }

  componentDidMount = async () => {
    this.parseParamsAndGetData();
    const { catalogueKey, citation } = this.props;
    try {
      const { data: dataset } = await getDataset(catalogueKey);
      this.setState({ dataset });
    } catch (err) {}
  };

  componentDidUpdate = (prevProps) => {
    const params = qs.parse(_.get(this.props, "location.search"));
    const prevParams = qs.parse(_.get(prevProps, "location.search"));
    if (!_.isEqual(params, prevParams)) {
      this.parseParamsAndGetData();
    }
  };

  getRank = () => {
    axios(`${config.dataApi}vocab/rank`).then((res) =>
      this.setState({ rank: res.data.map((r) => r.name) })
    );
  };
  parseParamsAndGetData = () => {
    const { defaultTaxonKey } = this.props;
    let params = qs.parse(_.get(this.props, "location.search"));
    if (defaultTaxonKey && !params.TAXON_ID) {
      params.TAXON_ID = defaultTaxonKey;
    }
    if (_.isEmpty(params)) {
      params = defaultParams;
      this.pushParams(defaultParams);
    } else if (!params.facet) {
      params.facet = FACET_VOCAB;
    }

    if (!params.limit) {
      params.limit = PAGE_SIZE;
    }
    if (!params.offset) {
      params.offset = 0;
    }
    this.setState(
      {
        params,
        pagination: {
          pageSize: params.limit || PAGE_SIZE,
          current:
            Number(params.offset || 0) / Number(params.limit || PAGE_SIZE) + 1,
          showQuickJumper: true,
          pageSizeOptions: [50, 100, 500, 1000],
        },
      },
      this.getData
    );
  };

  pushParams = (params) => {
    if (!params.q) {
      delete params.q;
    }
    history.push({
      pathname: _.get(this.props, "location.path"),
      search: `?${qs.stringify(params)}`,
    });
  };

  getData = () => {
    const { params } = this.state;
    this.setState({ loading: true });
    const { catalogueKey } = this.props;

    const url = `${config.dataApi}dataset/${catalogueKey}/nameusage/search`;
    const params_ = _.get(params, "status")
      ? params
      : { ...params, status: "_NOT_NULL" };
    axios(`${url}?${qs.stringify(params_)}`)
      .then((res) => {
        const pagination = { ...this.state.pagination };
        pagination.total = res.data.total;

        this.setState({
          loading: false,
          data: res.data,
          err: null,
          pagination,
        });
      })
      .catch((err) => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };
  handleTableChange = (pagination, filters, sorter) => {
    let query = _.merge(this.state.params, {
      limit: pagination.pageSize,
      offset: (pagination.current - 1) * pagination.pageSize,
      ...filters,
    });
    if (sorter && sorter.field) {
      if (sorter.field[sorter.field.length - 1] === "labelHtml") {
        query.sortBy = "name";
      } else if (sorter.field[sorter.field.length - 1] === "rank") {
        query.sortBy = "taxonomic";
      } else {
        query.sortBy = sorter.field[sorter.field.length - 1];
      }
    }
    if (sorter && sorter.order === "descend") {
      query.reverse = true;
    } else {
      query.reverse = false;
    }
    this.setState({ params: query }, () => this.pushParams(query));
  };

  updateSearch = (params) => {
    let newParams = { ...this.state.params, offset: 0, limit: 50 };
    _.forEach(params, (v, k) => {
      newParams[k] = v;
    });
    const notNullParams = Object.keys(newParams).reduce(
      (acc, cur) => (
        newParams[cur] !== null && (acc[cur] = newParams[cur]), acc
      ),
      {}
    );
    this.setState({ params: notNullParams }, () =>
      this.pushParams(notNullParams)
    );
  };

  resetSearch = () => {
    this.setState(
      {
        params: defaultParams,
      },
      () => this.pushParams(defaultParams)
    );
  };

  toggleAdvancedFilters = () => {
    this.setState({ advancedFilters: !this.state.advancedFilters });
  };

  render() {
    const {
      data: { result, facets },
      loading,
      error,
      params,
      pagination,
      advancedFilters,
      dataset,
    } = this.state;
    const { pathToTaxon, catalogueKey, defaultTaxonKey, citation } = this.props;
    const facetRanks = _.get(facets, "rank")
      ? facets.rank.map((r) => ({
          value: r.value,
          label: `${_.startCase(r.value)} (${r.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetIssues = _.get(facets, "issue")
      ? facets.issue.map((i) => ({
          value: i.value,
          label: `${_.startCase(i.value)} (${i.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetTaxonomicStatus = _.get(facets, "status")
      ? facets.status.map((s) => ({
          value: s.value,
          label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetNomStatus = _.get(facets, "nomStatus")
      ? facets.nomStatus.map((s) => ({
          value: s.value,
          label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetNomType = _.get(facets, "nameType")
      ? facets.nameType.map((s) => ({
          value: s.value,
          label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetNomField = _.get(facets, "field")
      ? facets.field.map((s) => ({
          value: s.value,
          label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetAuthorship = _.get(facets, "authorship")
      ? facets["authorship"].map((s) => ({
          value: s.value,
          label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : [];
    const facetExtinct = _.get(facets, "extinct")
      ? facets["extinct"].map((s) => ({
          value: s.value,
          label: `${s?.value === false ? "Extinct" : (s?.value === true ? "Extant" : "Unknown")} (${s.count.toLocaleString("en-GB")})`,
        }))
      : [];
    const facetEnvironment = _.get(facets, "environment")
      ? facets["environment"].map((s) => ({
          value: s.value,
          label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : [];

    return (
      <div
        className="catalogue-of-life"
        style={{
          padding: 24,
          minHeight: 280,
          margin: "16px 0",
        }}
      >
        {citation === "top" && dataset && <Citation dataset={dataset} />}

        <Row>
          {error && (
            <Alert
              style={{ marginBottom: "10px" }}
              message={<ErrorMsg error={error} />}
              type="error"
            />
          )}
        </Row>
        <Row>
          <Col xs={24} sm={24} md={12} style={{ marginBottom: "8px" }}>
            <SearchBox
              defaultValue={_.get(
                qs.parse(_.get(this.props, "location.search")),
                "q"
              )}
              onSearch={(value) => this.updateSearch({ q: value })}
              onResetSearch={(value) => this.updateSearch({ q: null })}
              style={{ marginBottom: "8px", width: "100%" }}
            />

            <NameAutocomplete
              datasetKey={catalogueKey}
              minRank="GENUS"
              defaultTaxonKey={
                _.get(params, "TAXON_ID") || defaultTaxonKey || null
              }
              onSelectName={(value) => {
                this.updateSearch({ TAXON_ID: value.key });
              }}
              onResetSearch={(value) => {
                this.updateSearch({ TAXON_ID: null });
              }}
              placeHolder="Search by higher taxon"
              sortBy="TAXONOMIC"
              autoFocus={false}
            />

            {dataset &&
              (
                dataset.origin === "xrelease") && (
                <div style={{ marginTop: "8px", marginBottom: "8px" }}>
                  <DatasetAutocomplete
                    contributesTo={Number(catalogueKey)}
                    onSelectDataset={(value) => {
                      this.updateSearch({ SECTOR_DATASET_KEY: value.key });
                    }}
                    defaultDatasetKey={
                      _.get(params, "SECTOR_DATASET_KEY") || null
                    }
                    onResetSearch={(value) => {
                      this.updateSearch({ SECTOR_DATASET_KEY: null });
                    }}
                    placeHolder="Filter by source dataset"
                    autoFocus={false}
                  />
                </div>
              )}
            <div style={{ marginTop: "10px" }}>
              <Form layout="inline">
                <FormItem label="Matching" >
                  <RadioGroup
                    size="small"
                    onChange={(evt) => {
                      this.updateSearch({ type: evt.target.value });
                    }}
                    value={params.type || "WHOLE_WORDS"}
                    optionType="button"
                    options={[
                      { value: "EXACT", label: "Exact" },
                      { value: "WHOLE_WORDS", label: "Words" },
                      { value: "PREFIX", label: "Prefix" },
                    ]}
                  ></RadioGroup>
                </FormItem>
                <FormItem label="Fuzzy">
                  <Checkbox
                    checked={params.fuzzy === true || params.fuzzy === "true"}
                    onChange={({ target: { checked } }) =>
                      this.updateSearch({ fuzzy: checked ? checked : null })
                    }
                  />
                </FormItem> 
               
              </Form>
               <FormItem label="Content"  >
                  <RadioGroup
                    style={{ marginLeft: "8px" }}
                    size="small"
                    onChange={(evt) => {
                      this.updateSearch({ sectorMode: evt.target.value.split(",")
                        .filter((v) => v !== "")});
                    }}
                    value={_.isArray(params?.sectorMode) ? params?.sectorMode?.join(",") : params?.sectorMode || ""}
                    optionType="button"
                    options={[
                      { value: "", label: "All" },
                      { value: "attach,union", label: "Base" },
                      { value: "merge", label: "Extended" },
                      
                    ]}
                  ></RadioGroup>
                </FormItem>
              
            </div>
          </Col>
          <Col xs={24} sm={24} md={12}>
            {/*             <MultiValueFilter
              defaultValue={_.get(params, "issue")}
              onChange={value => this.updateSearch({ issue: value })}
              vocab={facetIssues || []}
              label="Issues"
            /> */}

            <MultiValueFilter
              defaultValue={_.get(params, "rank")}
              onChange={(value) => this.updateSearch({ rank: value })}
              vocab={facetRanks || []}
              label="Ranks"
            />
            <MultiValueFilter
              defaultValue={_.get(params, "status")}
              onChange={(value) => this.updateSearch({ status: value })}
              vocab={facetTaxonomicStatus || []}
              label="Status"
            />
            <MultiValueFilter
                  defaultValue={_.get(params, "environment")}
                  onChange={(value) =>
                    this.updateSearch({ environment: value })
                  }
                  vocab={facetEnvironment}
                  label="Environment"
                />
                <MultiValueFilter
                  // defaultValue={_.get(params, "extinct")}
                  onChange={(value) => this.updateSearch({ extinct: value })}
                  vocab={facetExtinct}
                  label="Extinct"
                />
            {advancedFilters && (
              <React.Fragment>
                <MultiValueFilter
                  defaultValue={_.get(params, "nomstatus")}
                  onChange={(value) => this.updateSearch({ nomstatus: value })}
                  vocab={facetNomStatus || []}
                  label="Nomenclatural status"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "nameType")}
                  onChange={(value) => this.updateSearch({ nameType: value })}
                  vocab={facetNomType || []}
                  label="Name type"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "field")}
                  onChange={(value) => this.updateSearch({ field: value })}
                  vocab={facetNomField || []}
                  label="Name field"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "authorship")}
                  onChange={(value) => this.updateSearch({ authorship: value })}
                  vocab={facetAuthorship}
                  label="Authorship"
                />
              </React.Fragment>
            )}
            <div style={{ textAlign: "right", marginBottom: "8px" }}>
              <a
                style={{ marginLeft: 8, fontSize: 12 }}
                onClick={this.toggleAdvancedFilters}
              >
                Advanced{" "}
                {this.state.advancedFilters ? <UpOutlined /> : <DownOutlined />}
              </a>
            </div>
          </Col>
        </Row>
        <Row>
          <Col span={12} style={{ textAlign: "left", marginBottom: "8px" }}>
            <Button type="danger" onClick={this.resetSearch}>
              Reset all
            </Button>
          </Col>
          <Col span={12} style={{ textAlign: "right", marginBottom: "8px" }}>
            {pagination &&
              !isNaN(pagination.total) &&
              `results: ${pagination.total.toLocaleString("en-GB")}`}
          </Col>
        </Row>
        {!error && (
          <Table
            size="small"
            columns={this.state.columns}
            scroll={{ x: "max-content" }}
            dataSource={result}
            loading={loading}
            pagination={this.state.pagination}
            onChange={this.handleTableChange}
            rowKey={(record) => record.usage.id}
            showSorterTooltip={false}
            expandedRowRender={(record) => (
              <RowDetail
                {...record}
                catalogueKey={catalogueKey}
                pathToTaxon={pathToTaxon}
              />
            )}
          />
        )}
        {citation === "bottom" && dataset && <Citation dataset={dataset} />}
      </div>
    );
  }
}

export default withRouter(NameSearchPage);
