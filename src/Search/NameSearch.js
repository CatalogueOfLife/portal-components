import React from "react";
import client from "../api/client";
import { UpOutlined, DownOutlined } from "@ant-design/icons";
import { LinkTo } from "../router";
import { getDatasetSimple } from "../api/dataset";
import { getTaxGroup } from "../api/enumeration";
import { readSetting, writeSetting } from "../storage";

// Only the Content filter (All/Base/Extended) is remembered across visits —
// never the query, search fields, or other filters.
const CONTENT_TYPE_KEY = "search-content-type";
import {
  Table,
  Alert,
  Row,
  Col,
  Button,
  Form,
  Radio,
  Select,
} from "antd";
import config from "../config";
import qs from "query-string";
import Classification from "./Classification";
import SearchBox from "./SearchBox";
import MultiValueFilter from "./MultiValueFilter";
import RowDetail from "./RowDetail";
import { forEach, get, initial, isArray, isEmpty, isEqual, merge, startCase } from "lodash-es";
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
  "group",
  "authorshipYear",
];
const PAGE_SIZE = 50;
const FACET_LIMIT = 50;
const defaultParams = {
  limit: 50,
  offset: 0,
  facet: FACET_VOCAB, //["rank", "issue", "status", "nomStatus", "nameType", "field"],
  facetLimit: FACET_LIMIT,
  sortBy: "relevance",
};

const getColumns = () => [
  {
    title: "",
    dataIndex: ["usage", "merged"],
    key: "merged",
    width: 12,
    render: (text, record) =>
      record?.usage?.merged ? <MergedDataBadge datasetKey={record?.usage?.datasetKey} verbatimSourceKey={record?.usage?.verbatimSourceKey} /> : "",
  },
  {
    title: "Scientific Name",
    dataIndex: ["usage", "labelHtml"],
    key: "scientificName",
    render: (text, record) => {
      const id =
        get(record, "usage.accepted.id") || get(record, "usage.id");
      return (
        <LinkTo to="taxon" args={id}>
          <span dangerouslySetInnerHTML={{ __html: text }} />
        </LinkTo>
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
        <React.Fragment key={get(record, "usage.id")}>
          {text} {text === "misapplied" ? "to " : "of "}
          <span
            dangerouslySetInnerHTML={{
              __html: get(record, "usage.accepted.labelHtml"),
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
      return !get(record, "classification") ? (
        ""
      ) : (
        <Classification
          key={get(record, "usage.id")}
          classification={initial(record.classification)}
          truncate={true}
          datasetKey={get(record, "usage.name.datasetKey")}
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
      columns: getColumns(),
      params: {},
      taxGroups: [],
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
    const { datasetKey } = this.props;
    // Single dataset lookup. Stores both the descriptor (used by the
    // citation footer when enabled) and the lowercase origin, which gates
    // the source-dataset and Content filter UI.
    try {
      const { data: dataset } = await getDatasetSimple(datasetKey);
      this.setState({
        dataset,
        datasetOrigin: (dataset?.origin || "").toLowerCase(),
      });
    } catch (err) {}
    try {
      const taxGroups = await getTaxGroup();
      this.setState({ taxGroups });
    } catch (err) {}
  };

  componentDidUpdate = (prevProps) => {
    if (!isEqual(prevProps.filters, this.props.filters)) {
      this.parseParamsAndGetData();
    }
  };

  getRank = () => {
    client(`${config.dataApi}vocab/rank`).then((res) =>
      this.setState({ rank: res.data.map((r) => r.name) })
    );
  };
  parseParamsAndGetData = () => {
    const { defaultTaxonKey, filters } = this.props;
    let params = { ...(filters || {}) };
    if (defaultTaxonKey && !params.TAXON_ID) {
      params.TAXON_ID = defaultTaxonKey;
    }
    if (isEmpty(params)) {
      // Fresh visit (clean URL): start from the defaults, but restore the
      // remembered Content filter (All/Base/Extended) if one was saved.
      params = { ...defaultParams };
      const storedContentType = readSetting(CONTENT_TYPE_KEY, undefined);
      if (storedContentType !== undefined && storedContentType !== null) {
        params.sectorMode = storedContentType;
      }
      this.pushParams(params);
    } else if (!params.facet) {
      params.facet = FACET_VOCAB;
    }
    if (!params.facetLimit) {
      params.facetLimit = FACET_LIMIT;
    }

    // fuzzy is no longer a separate API parameter; it's now the FUZZY type value
    delete params.fuzzy;

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
    const next = { ...params };
    if (!next.q) delete next.q;
    if (this.props.onFiltersChange) this.props.onFiltersChange(next);
  };

  getData = () => {
    const { params } = this.state;
    this.setState({ loading: true });
    const { datasetKey } = this.props;

    const url = `${config.dataApi}dataset/${datasetKey}/nameusage/search`;
    const params_ = get(params, "status")
      ? params
      : { ...params, status: "_NOT_NULL" };
    client(`${url}?${qs.stringify(params_)}`)
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
    let query = merge(this.state.params, {
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
    // Remember the Content filter (All/Base/Extended) across visits.
    if ("sectorMode" in params) writeSetting(CONTENT_TYPE_KEY, params.sectorMode);
    let newParams = { ...this.state.params, offset: 0, limit: 50 };
    forEach(params, (v, k) => {
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
      taxGroups,
    } = this.state;
    const { datasetKey, defaultTaxonKey, citation } = this.props;
    const facetRanks = get(facets, "rank")
      ? facets.rank.map((r) => ({
          value: r.value,
          label: `${startCase(r.value)} (${r.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetIssues = get(facets, "issue")
      ? facets.issue.map((i) => ({
          value: i.value,
          label: `${startCase(i.value)} (${i.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetTaxonomicStatus = get(facets, "status")
      ? facets.status.map((s) => ({
          value: s.value,
          label: `${startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetNomStatus = get(facets, "nomStatus")
      ? facets.nomStatus.map((s) => ({
          value: s.value,
          label: `${startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetNomType = get(facets, "nameType")
      ? facets.nameType.map((s) => ({
          value: s.value,
          label: `${startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetNomField = get(facets, "field")
      ? facets.field.map((s) => ({
          value: s.value,
          label: `${startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetAuthorship = get(facets, "authorship")
      ? facets["authorship"].map((s) => ({
          value: s.value,
          label: `${startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : [];
    const extinctLabel = (v) => {
      if (v === "1" || v === true || v === "true") return "Extinct";
      if (v === "0" || v === false || v === "false") return "Extant";
      return "Unknown";
    };
    const facetExtinct = get(facets, "extinct")
      ? facets["extinct"].map((s) => ({
          value: s.value,
          label: `${extinctLabel(s?.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : [];
    const facetEnvironment = get(facets, "environment")
      ? facets["environment"].map((s) => ({
          value: s.value,
          label: `${startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : [];
    const facetGroup = get(facets, "group")
      ? facets["group"].map((s) => ({
          value: s.value,
          label: `${startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : [];
    const facetAuthorshipYear = get(facets, "authorshipYear")
      ? facets["authorshipYear"].map((s) => ({
          value: s.value,
          label: `${s.value} (${s.count.toLocaleString("en-GB")})`,
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
              defaultValue={get(this.props.filters || {}, "q")}
              onSearch={(value) => this.updateSearch({ q: value })}
              onResetSearch={(value) => this.updateSearch({ q: null })}
              style={{ marginBottom: "8px", width: "100%" }}
            />

            <NameAutocomplete
              datasetKey={datasetKey}
              minRank="GENUS"
              defaultTaxonKey={
                get(params, "TAXON_ID") || defaultTaxonKey || null
              }
              onSelectName={(value) => {
                this.updateSearch({ TAXON_ID: value.key });
              }}
              onResetSearch={(value) => {
                this.updateSearch({ TAXON_ID: null });
              }}
              placeHolder="Filter by higher taxon"
              sortBy="relevance"
              autoFocus={false}
            />

            {(this.state.datasetOrigin === "xrelease" ||
              this.state.datasetOrigin === "release") && (
                <div style={{ marginTop: "8px", marginBottom: "8px" }}>
                  <DatasetAutocomplete
                    contributesTo={Number(datasetKey)}
                    onSelectDataset={(value) => {
                      this.updateSearch({ SECTOR_DATASET_KEY: value.key });
                    }}
                    defaultDatasetKey={
                      get(params, "SECTOR_DATASET_KEY") || null
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
                      { value: "FUZZY", label: "Fuzzy" },
                    ]}
                  ></RadioGroup>
                </FormItem>
               
              </Form>
              <Form layout="inline">
                {(this.state.datasetOrigin === "xrelease" ||
                  this.state.datasetOrigin === "project") && (
                  <FormItem label="Content">
                    <RadioGroup
                      style={{ marginLeft: "8px" }}
                      size="small"
                      onChange={(evt) => {
                        this.updateSearch({ sectorMode: evt.target.value.split(",")
                          .filter((v) => v !== "")});
                      }}
                      value={isArray(params?.sectorMode) ? params?.sectorMode?.join(",") : params?.sectorMode || ""}
                      optionType="button"
                      options={[
                        { value: "", label: "All" },
                        { value: "attach,union", label: "Base" },
                        { value: "merge", label: "Extended" },
                      ]}
                    ></RadioGroup>
                  </FormItem>
                )}
                <FormItem>
                  <Select
                    mode="multiple"
                    allowClear
                    size="small"
                    style={{ minWidth: 200 }}
                    placeholder="Search fields"
                    value={isArray(params?.content) ? params.content : (params?.content ? [params.content] : [])}
                    onChange={(value) => this.updateSearch({ content: value.length ? value : null })}
                    options={[
                      { value: "SCIENTIFIC_NAME", label: "Scientific name" },
                      { value: "AUTHORSHIP", label: "Authorship" },
                      { value: "VERNACULAR_NAME", label: "Vernacular name" },
                    ]}
                  />
                </FormItem>
              </Form>
              
            </div>
          </Col>
          <Col xs={24} sm={24} md={12}>
            {/*             <MultiValueFilter
              defaultValue={get(params, "issue")}
              onChange={value => this.updateSearch({ issue: value })}
              vocab={facetIssues || []}
              label="Issues"
            /> */}

            <MultiValueFilter
              defaultValue={get(params, "rank")}
              onChange={(value) => this.updateSearch({ rank: value })}
              vocab={facetRanks || []}
              label="Ranks"
            />
            <MultiValueFilter
              defaultValue={get(params, "status")}
              onChange={(value) => this.updateSearch({ status: value })}
              vocab={facetTaxonomicStatus || []}
              label="Status"
            />
            <MultiValueFilter
                  defaultValue={get(params, "environment")}
                  onChange={(value) =>
                    this.updateSearch({ environment: value })
                  }
                  vocab={facetEnvironment}
                  label="Environment"
                />
                <MultiValueFilter
                  // defaultValue={get(params, "extinct")}
                  onChange={(value) => this.updateSearch({ extinct: value })}
                  vocab={facetExtinct}
                  label="Extinct"
                />
            {advancedFilters && (
              <React.Fragment>
                <MultiValueFilter
                  defaultValue={get(params, "nomstatus")}
                  onChange={(value) => this.updateSearch({ nomstatus: value })}
                  vocab={facetNomStatus || []}
                  label="Nomenclatural status"
                />
                <MultiValueFilter
                  defaultValue={get(params, "nameType")}
                  onChange={(value) => this.updateSearch({ nameType: value })}
                  vocab={facetNomType || []}
                  label="Name type"
                />
                <MultiValueFilter
                  defaultValue={get(params, "field")}
                  onChange={(value) => this.updateSearch({ field: value })}
                  vocab={facetNomField || []}
                  label="Name field"
                />
                <MultiValueFilter
                  defaultValue={get(params, "authorship")}
                  onChange={(value) => this.updateSearch({ authorship: value })}
                  vocab={facetAuthorship}
                  label="Authorship"
                />
                <MultiValueFilter
                  defaultValue={get(params, "group")}
                  onChange={(value) => this.updateSearch({ group: value })}
                  vocab={facetGroup}
                  label="Taxonomic group"
                />
                <MultiValueFilter
                  defaultValue={get(params, "authorshipYear")}
                  onChange={(value) => this.updateSearch({ authorshipYear: value })}
                  vocab={facetAuthorshipYear}
                  label="Authorship year"
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
            <Button type="primary" danger onClick={this.resetSearch}>
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
                datasetKey={datasetKey}
              />
            )}
          />
        )}
        {citation === "bottom" && dataset && <Citation dataset={dataset} />}
      </div>
    );
  }
}

export default NameSearchPage;
