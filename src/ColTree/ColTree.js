import React, {Component} from 'react'
import history from "../history";
import axios from "axios";
import { Tree, Spin, Alert, Button} from "antd";
import ErrorMsg from "../components/ErrorMsg";
import config from "../config"
import { getSectorsBatch } from "../api/sector";
import { getDatasetsBatch } from "../api/dataset";
import DataLoader from "dataloader";
import qs from "query-string";
import _ from "lodash";
import ColTreeNode from "./ColTreeNode"
import 'antd/dist/antd.css';



const sectorLoader = new DataLoader(ids => getSectorsBatch(ids));
const datasetLoader = new DataLoader(ids => getDatasetsBatch(ids));
const TreeNode = Tree.TreeNode;
const CHILD_PAGE_SIZE = 1000; // How many children will we load at a time
const IRREGULAR_RANKS = [
  "unranked",
  "other",
  "infraspecific name",
  "infrageneric name",
  "infrasubspecific name",
  "suprageneric name"
];

class LoadMoreChildrenTreeNode extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: false };
  }

  onClick = () => {
    this.setState({ loading: true });
    this.props.onClick();
  };
  render = () => {
    const { loading } = this.state;
    return (
      <div>
        {loading && <Spin />}
        {!loading && (
          <a onClick={this.onClick}>
            <strong>Load more...</strong>
          </a>
        )}
      </div>
    );
  };
}


class ColTree extends Component {

  constructor(props) {
    super(props);

    this.state = {
      rootLoading: true,
      treeData: [],
      rootTotal: 0,
      error: null
    };
  }

  componentWillMount = () => {
    this.loadRoot();

  };

  componentDidUpdate = (prevProps) => {
    if(prevProps.defaultExpandKey !== this.props.defaultExpandKey){
      this.reloadRoot()
    }

  }

  reloadRoot = () => this.setState({ treeData: []}, this.loadRoot);

  loadRoot = () => {
    const {
      showSourceTaxon,
      catalogueKey,
      defaultExpandKey,
      pathToTaxon
    } = this.props;
    const {location} = history;
    // const defaultExpandKey = _.get(qs.parse(_.get(location, "search")), 'taxonKey');

    this.setState({rootLoading: true})
    let p = defaultExpandKey
      ? axios(
          `${config.dataApi}dataset/${catalogueKey}/tree/${
            defaultExpandKey
          }?catalogueKey=${catalogueKey}`
        )
          .then(res => {
            // Load the siblings of the default expanded taxon
            return _.get(res, "data[1]")
              ? axios(
                  `${config.dataApi}dataset/${catalogueKey}/tree/${
                    _.get(res, "data[1].id") //taxonKey
                  }/children?limit=${CHILD_PAGE_SIZE}&offset=0&insertPlaceholder=true&catalogueKey=${
                    catalogueKey
                  }`
                )
                  .then(this.decorateWithSectorsAndDataset)
                  .then(children => {
                    // Remove the the default expanded taxon as it will be loaded
                    if (
                      children.data.result &&
                      children.data.result.length > 0
                    ) {
                      res.data[1].children = children.data.result.filter(
                        i => i.id !== defaultExpandKey
                      );
                    }
                    return res;
                  })
              : res;
          })
          .then(res =>
            this.decorateWithSectorsAndDataset({
              data: { result: res.data }
            }).then(() => res)
          )
      : Promise.resolve(false);
    var defaultExpandedNodes;
    return Promise.all([
      axios(
        `${config.dataApi}dataset/${catalogueKey}/tree?catalogueKey=${
          catalogueKey
        }&limit=${CHILD_PAGE_SIZE}&offset=${this.state.treeData.length}`
      ).then(this.decorateWithSectorsAndDataset),
      p
    ])
      .then(values => {
        const mainTreeData = values[0].data.result;
        const rootTotal = values[0].data.total;
        const defaultExpanded = values[1] ? values[1].data : null;
        const treeData = mainTreeData.map(tx => {
          let dataRef = {
            taxon: tx,
            key: tx.id,
            datasetKey: catalogueKey,
            childCount: tx.childCount,
            childOffset: 0
          };
          dataRef.title = (
            <ColTreeNode
              taxon={tx}
              pathToTaxon={pathToTaxon}
              catalogueKey={catalogueKey}
              showSourceTaxon={showSourceTaxon}
              reloadSelfAndSiblings={this.loadRoot}
              reloadChildren={() => this.fetchChildPage(dataRef, true)}
            />
          );
          return dataRef;
        });

        if (defaultExpanded && defaultExpanded.length == 0) {
          this.setState(
            {
              nodeNotFoundErr: (
                <span>
                  Cannot find taxon {defaultExpandKey} in tree &#128549;
                </span>
              )
            }
          );
        }
        if (defaultExpanded && defaultExpanded.length > 0) {
          defaultExpandedNodes = _.map(defaultExpanded, "id");
          let root_ = _.find(treeData, [
            "key",
            defaultExpanded[defaultExpanded.length - 1].id
          ]);
          const nodes = defaultExpanded
            .slice(0, defaultExpanded.length - 1)
            .reverse();

          nodes.reduce((root, tx) => {
            let node = {
              taxon: tx,
              key: tx.id,
              childCount: tx.childCount,
              childOffset: 0
            };
            
            node.title = (
              <ColTreeNode
                taxon={tx}
                pathToTaxon={pathToTaxon}
                catalogueKey={catalogueKey}
                showSourceTaxon={showSourceTaxon}
                reloadChildren={() => this.fetchChildPage(node, true)}
              />
            );

            root.children = _.get(root, "taxon.children")
              ? [
                  ...root.taxon.children.map(c => {
                    let ref = {
                      taxon: c,
                      key: c.id,
                      childCount: c.childCount,
                      childOffset: 0

                    }; 
                   
                    ref.title = (
                      <ColTreeNode
                        taxon={c}
                        pathToTaxon={pathToTaxon}
                        catalogueKey={catalogueKey}
                        showSourceTaxon={showSourceTaxon}       
                        reloadChildren={() => this.fetchChildPage(ref, true)}
                      />
                    );
                    return ref;
                  }),
                  node
                ].sort((a, b) => {
                  if (a.taxon.rank === b.taxon.rank) {
                    return a.taxon.name < b.taxon.name
                      ? -1
                      : a.taxon.name > b.taxon.name
                      ? 1
                      : 0;
                  } else {
                    return (
                      this.props.rank.indexOf(a.taxon.rank) -
                      this.props.rank.indexOf(b.taxon.rank)
                    );
                  }
                })
              : [node];
            return node;
          }, root_);
        }
        if (defaultExpandedNodes && defaultExpandKey) {
          this.setState({
            rootTotal: rootTotal,
            rootLoading: false,
            treeData:[...this.state.treeData,...treeData],
            defaultExpandAll: !defaultExpanded && treeData.length < 10,
            error: null,
            defaultExpandedKeys: defaultExpandedNodes
          });
        } else {
          this.setState({
            rootTotal: rootTotal,
            rootLoading: false,
            treeData:[...this.state.treeData, ...treeData],
            defaultExpandAll: treeData.length < 10,
            error: null
          });
          if (treeData.length === 1) {
            this.fetchChildPage(treeData[treeData.length - 1]);
          }
        }
      })
      .catch(err => {
        this.setState({
          treeData: [],
          rootLoading: false,
          defaultExpandedKeys: null,
          error: err
        });
      });
  };

  fetchChildPage = (dataRef, reloadAll) => {
    const { showSourceTaxon, catalogueKey, pathToTaxon} = this.props;
    const childcount = _.get(dataRef, "childCount");
    const limit = CHILD_PAGE_SIZE;
    const offset = _.get(dataRef, "childOffset");

    return axios(
      `${config.dataApi}dataset/${catalogueKey}/tree/${
        dataRef.taxon.id //taxonKey
      }/children?limit=${limit}&offset=${offset}&insertPlaceholder=true&catalogueKey=${
        catalogueKey
      }`
    )

      .then(this.decorateWithSectorsAndDataset)
      .then(res =>
        res.data.result
          ? res.data.result.map(tx => {
              let childDataRef = {
                taxon: tx,
                key: tx.id,
                datasetKey: catalogueKey,
                childCount: tx.childCount,
                childOffset: 0,
                parent: dataRef,
                name: tx.name
              };

              childDataRef.title = (
                <ColTreeNode
                  taxon={tx}
                  pathToTaxon={pathToTaxon}
                  catalogueKey={catalogueKey}
                  reloadChildren={() => this.fetchChildPage(childDataRef, true)}
                  showSourceTaxon={showSourceTaxon}
                />
              );

              return childDataRef;
            })
          : []
      )
      .then(data => {
        // reloadAll is used to force reload all children from offset 0 - used when new children have been posted
        dataRef.children =
          dataRef.children && offset !== 0 && !reloadAll
            ? [...dataRef.children, ...data]
            : data;

        if (offset + CHILD_PAGE_SIZE < childcount) {
          const loadMoreFn = () => {
            dataRef.childOffset += CHILD_PAGE_SIZE;
            if (
              dataRef.children[dataRef.children.length - 1].key ===
              "__loadMoreBTN__"
            ) {
              dataRef.children = dataRef.children.slice(0, -1);
            }
            this.setState(
              {
                treeData: [...this.state.treeData],
                defaultExpandAll: false
              },
              () => {
                this.fetchChildPage(dataRef, false);
              }
            );
          };
          dataRef.children = [
            ...dataRef.children,
            {
              title: (
                <LoadMoreChildrenTreeNode
                  onClick={loadMoreFn}
                  key="__loadMoreBTN__"
                />
              ),
              key: "__loadMoreBTN__",
              childCount: 0
            }
          ];
        }
        this.setState({
          treeData: [...this.state.treeData],
          defaultExpandAll: false
        });
      });
  };

  decorateWithSectorsAndDataset = res => {
    if (!res.data.result) return res;

    return Promise.all(
      res.data.result
        .filter(tx => !!tx.sectorKey)
        .map(tx =>
          sectorLoader.load(tx.sectorKey).then(r => {
            tx.sector = r;
            return datasetLoader
              .load(r.subjectDatasetKey)
              .then(dataset => (tx.sector.dataset = dataset));
          })
        )
    ).then(() => res);
  };

  onLoadData = (treeNode, reloadAll = false) => {
    const {
      props: { dataRef }
    } = treeNode;
    if (reloadAll) {
      dataRef.childOffset = 0;
    }

    return this.fetchChildPage(dataRef, reloadAll);
  };


  renderTreeNodes = data => {
    return data.map(item => {
      if (item.children) {
        return (
          <TreeNode
            datasetKey={item.datasetKey}
            title={item.title}
            key={item.key}
            dataRef={item}
            isLeaf={item.childCount === 0}
          >
            {this.renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return (
        <TreeNode
          {...item}
          datasetKey={item.datasetKey}
          title={item.title}
          key={item.key}
          dataRef={item}
          isLeaf={item.childCount === 0}
        />
      );
    });
  };

  render() {
    const {
      error,
      rootTotal,
      rootLoading,
      treeData,
      defaultExpandAll,
      defaultExpandedKeys,
      nodeNotFoundErr
    } = this.state;
    const location = history.location;
    const defaultExpandKey = _.get(qs.parse(_.get(location, "search")), 'taxonKey');

    return (
      <div>
        {error && (         
          <Alert
            closable
            onClose={() => this.setState({ error: null })}
            style={{ marginTop: "8px" }}
            message={<ErrorMsg error={error} />}
            type="error"
          />      
        )}
        {nodeNotFoundErr && (
          <Alert
            closable
            onClose={() => this.setState({ ernodeNotFoundErrror: null })}
            style={{ marginTop: "8px" }}
            message={nodeNotFoundErr}
            type="warning"
          />
        )}
        {treeData.length > 0 && (
              <Tree
                showLine={true}
                defaultExpandAll={defaultExpandAll}
                defaultExpandedKeys={defaultExpandedKeys}

                loadData={this.onLoadData}
                filterTreeNode={node =>
                  node.props.dataRef.key === defaultExpandKey
                }
                 onExpand={(expandedKeys, obj) => {
                  if (obj.expanded) {
                    if (_.get(obj, 'node.props.dataRef.childCount') && _.get(obj, 'node.props.dataRef.childCount') > 0 && !_.get(obj, 'node.props.dataRef.children')){
                      this.fetchChildPage(obj.node.props.dataRef, true)
                    }
                    const params = qs.parse(_.get(location, "search"));
                    const newParams ={ 
                      ...params,
                      taxonKey: obj.node.props.dataRef.key
                    }
                    history.push({
                      pathname: location.path,
                      search: `?${qs.stringify(newParams)}`
                    });
                  } else {
                    
                    history.push({
                      pathname: location.path,
                      search: `?${qs.stringify(
                        _.omit(qs.parse(_.get(location, "search")), ["taxonKey"])
                      )}`
                    });
                  }
                }} 
              >
                {this.renderTreeNodes(treeData)}
              </Tree>
              
            )}
            
        
       {!error && treeData.length < rootTotal && <Button loading={rootLoading} onClick={this.loadRoot}>Load more </Button>}
      </div>
    );
  }
}

export default ColTree;
