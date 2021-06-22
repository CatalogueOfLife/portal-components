import React from "react";
import { Tree, Alert, Spin, Button, Skeleton } from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../config";
import ColTreeNode from "./ColTreeNode";
import ErrorMsg from "../components/ErrorMsg";
import { getSectorsBatch } from "../api/sector";
import { getDatasetsBatch } from "../api/dataset";
import DataLoader from "dataloader";
import history from "../history";
import qs from "query-string";
import { withRouter } from "react-router-dom";

const CHILD_PAGE_SIZE = 1000; // How many children will we load at a time

class LoadMoreChildrenTreeNode extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: false };
  }

  onClick = () => {
    this.setState({ loading: true }, () => this.props.onClick().then(() => this.setState({ loading: false })))
  };
  render = () => {
    const { loading} = this.state;
    return (
      <React.Fragment>
        {loading && <Spin />}
        {!loading && (
          <a onClick={this.onClick}>
            <strong>Load more...</strong>
          </a>
        )}
      </React.Fragment>
    );
  };
}

class ColTree extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      rootLoading: true,
      treeData: [],
      loadedKeys: [],
      expandedKeys: [],
      rootTotal: 0,
      error: null,
      nodeNotFoundErr: null,
    };
    this.treeRef = React.createRef();
  }

  componentDidMount = () => {
    const { catalogueKey } = this.props;
    this.loadRoot();
    this.datasetLoader = new DataLoader((ids) =>
      getDatasetsBatch(ids, catalogueKey)
    );

    this.sectorLoader = new DataLoader((ids) =>
      getSectorsBatch(ids, catalogueKey)
    );
    const { treeRef } = this.props;
    treeRef(this);
  };

  componentDidUpdate = (prevProps) => {
    if (prevProps.defaultExpandKey !== this.props.defaultExpandKey || prevProps.hideExtinct !== this.props.hideExtinct) {
      this.reloadRoot();
    }
  };

  reloadRoot = () =>
    this.setState(
      {
        rootLoading: true,
        treeData: [],
        loadedKeys: [],
        rootTotal: 0,
        error: null,
        nodeNotFoundErr: null,
      },
      this.loadRoot
    );

  loadRoot = async () => {
    const defaultExpandKey = _.get(
      qs.parse(_.get(location, "search")),
      "taxonKey"
    );
    const { defaultTaxonKey } = this.props;
    if (defaultExpandKey) {
      return this.expandToTaxon(defaultExpandKey);
    } else if (defaultTaxonKey) {
      return this.expandToTaxon(defaultTaxonKey);
    } else {
      return this.loadRoot_();
    }
  };

  loadRoot_ = async () => {
    const {
      showSourceTaxon,
      catalogueKey,
      pathToTaxon,
      pathToDataset,
      hideExtinct
    } = this.props;
    this.setState({ rootLoading: true, treeData: [] });
    return axios(
      `${config.dataApi}dataset/${catalogueKey}/tree?catalogueKey=${catalogueKey}&type=CATALOGUE&limit=${CHILD_PAGE_SIZE}&offset=${this.state.treeData.length}${hideExtinct ? `&extinct=false&extinct=`:''}`
    )
      .then(this.decorateWithSectorsAndDataset)
      .then((res) => {
        const mainTreeData = res.data.result || [];
        const rootTotal = res.data.total;
        const treeData = mainTreeData.map((tx) => {
          let dataRef = {
            taxon: tx,
            key: tx.id,
            datasetKey: catalogueKey,
            childCount: tx.childCount,
            isLeaf: tx.childCount === 0,
            childOffset: 0,
          };
          dataRef.title = (
            <ColTreeNode
              taxon={tx}
              pathToTaxon={pathToTaxon}
              pathToDataset={pathToDataset}
              catalogueKey={catalogueKey}
              showSourceTaxon={showSourceTaxon}
              reloadChildren={() => this.fetchChildPage(dataRef, true)}
            />
          );
          dataRef.ref = dataRef;
          return dataRef;
        });

        this.setState({
          rootTotal: rootTotal,
          rootLoading: false,
          treeData: [...this.state.treeData, ...treeData],
          expandedKeys:
            treeData.length < 10 ? treeData.map((n) => n.taxon.id) : [],
          error: null,
        });
        if (treeData.length === 1) {
          this.fetchChildPage(treeData[treeData.length - 1]);
        }
      })
      .catch((err) => {
        this.setState({
          treeData: [],
          rootLoading: false,
          expandedKeys: [],
          error: err,
        });
      });
  };

  expandToTaxon = async (defaultExpandKey) => {
    const {
      showSourceTaxon,
      catalogueKey,
      pathToTaxon,
      pathToDataset,
      hideExtinct
    } = this.props;

    this.setState({ rootLoading: true, treeData: [] });
    const { data } = await axios(
      `${config.dataApi}dataset/${catalogueKey}/tree/${defaultExpandKey}?catalogueKey=${catalogueKey}&insertPlaceholder=true&type=CATALOGUE${hideExtinct ? `&extinct=false`:''}`
    ).then((res) =>
      this.decorateWithSectorsAndDataset({
        data: { result: res.data },
      }).then(() => res)
    );

    if (data.length === 0) {
      return this.setState(
        {
          error: {
            message: `No classification found for Taxon ID: ${defaultExpandKey}`,
          },
        },
        this.loadRoot_
      );
    }
    const tx = data[data.length - 1];
    let root = {
      taxon: tx,
      key: tx.id,
      datasetKey: catalogueKey,
      childCount: tx.childCount,
      isLeaf: tx.childCount === 0,
      childOffset: 0,
    };
    root.title = (
      <ColTreeNode
        taxon={tx}
        pathToTaxon={pathToTaxon}
        pathToDataset={pathToDataset}
        catalogueKey={catalogueKey}
        showSourceTaxon={showSourceTaxon}
        reloadChildren={() => this.fetchChildPage(root, true)}
      />
    );

    const root_ = root;
    for (let i = data.length - 2; i >= 0; i--) {
      const tx = data[i];
      const node = {
        taxon: tx,
        key: tx.id,
        datasetKey: catalogueKey,
        childCount: tx.childCount,
        isLeaf: tx.childCount === 0,
        childOffset: 0,
      };
      node.ref = node;
      node.title = (
        <ColTreeNode
          taxon={tx}
          pathToTaxon={pathToTaxon}
          pathToDataset={pathToDataset}
          catalogueKey={catalogueKey}
          showSourceTaxon={showSourceTaxon}
          reloadChildren={() => this.fetchChildPage(node, true)}
        />
      );

      root.children = [node];
      root = node;
    }

    const treeData = [root_];

    const loadedKeys = [...data.map((t) => t.id).reverse()];

    this.setState({ treeData }, () =>
      this.reloadLoadedKeys(loadedKeys, defaultExpandKey)
    );
  };

  fetchChildPage = async (dataRef, reloadAll, dontUpdateState) => {
    const {
      showSourceTaxon,
      catalogueKey,
      pathToTaxon,
      pathToDataset,
      hideExtinct
    } = this.props;
    const { treeData } = this.state;
    const childcount = _.get(dataRef, "childCount");
    const limit = CHILD_PAGE_SIZE;
    const offset = _.get(dataRef, "childOffset");
    const res = 
    await axios(
      `${config.dataApi}dataset/${catalogueKey}/tree/${
        dataRef.taxon.id //taxonKey
      }/children?limit=${limit}&offset=${offset}&insertPlaceholder=true&catalogueKey=${catalogueKey}&type=CATALOGUE${hideExtinct ? `&extinct=false`:''}`
    )
    await this.decorateWithSectorsAndDataset(res);
      
      const data = res.data.result
          ? res.data.result.map((tx) => {
              let childDataRef = {
                taxon: tx,
                key: tx.id,
                datasetKey: catalogueKey,
                childCount: tx.childCount,
                isLeaf: tx.childCount === 0,
                childOffset: 0,
                parent: dataRef,
                name: tx.name,
              };

              childDataRef.title = (
                <ColTreeNode
                  taxon={tx}
                  pathToTaxon={pathToTaxon}
                  pathToDataset={pathToDataset}
                  catalogueKey={catalogueKey}
                  showSourceTaxon={showSourceTaxon}
                  reloadChildren={() => this.fetchChildPage(childDataRef, true)}
                />
              );
              childDataRef.ref = childDataRef;

              return childDataRef;
            })
          : []
      
    
        // reloadAll is used to force reload all children from offset 0 - used when new children have been posted
        dataRef.children =
          dataRef.children && offset !== 0 && !reloadAll
            ? [...dataRef.children, ...data]
            : data;
        // If extinct are filtered out, you cannot rely on childCount
        if(res.data.last && dataRef.childCount > dataRef.children.length){
          dataRef.childCount = dataRef.children.length;
        }
        if (offset + CHILD_PAGE_SIZE < childcount) {
          const loadMoreFn = () => {
            dataRef.childOffset += CHILD_PAGE_SIZE;
            if (
              dataRef.children[dataRef.children.length - 1].key ===
              "__loadMoreBTN__"
            ) {
              dataRef.children = dataRef.children.slice(0, -1);
            }
            return this.fetchChildPage(dataRef, false);
           /*  this.setState(
              {
                treeData: [...treeData],
                defaultExpandAll: false,
              },
              () => {
                this.fetchChildPage(dataRef, false);
              }
            ); */
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
              childCount: 0,
              isLeaf: true,
            },
          ];
        }
        if (!dontUpdateState) {
          this.setState({
            treeData: [...treeData],
            loadedKeys: [...new Set([...this.state.loadedKeys, dataRef.key])],
          });
        }
      
  };

  decorateWithSectorsAndDataset = (res) => {
    if (!res.data.result) return res;
    return Promise.all(
      res.data.result
        .filter((tx) => !!tx.sectorDatasetKey)
        .map((tx) => this.datasetLoader
        .load(tx.sectorDatasetKey)
        .then((dataset) => (tx.sector = {id: tx.sectorKey, subjectDatasetKey: tx.sectorDatasetKey, dataset: dataset}))
        )
    ).then(() => res);
  };

  onLoadData = (treeNode, reloadAll = false) => {
    if (reloadAll) {
      treeNode.childOffset = 0;
    }
    return this.fetchChildPage(treeNode.ref, reloadAll);
  };

  findNode = (id, nodeArray) => {
    let node = null;

    node = nodeArray.find((n) => _.get(n, "taxon.id") === id);

    if (node) {
      return node;
    } else {
      const children = nodeArray.map((n) => _.get(n, "children") || []);
      const flattenedChildren = _.flatten(children); //.flat();
      if (flattenedChildren.length === 0) {
        return null;
      } else {
        return this.findNode(id, flattenedChildren);
      }
    }
  };

  pageThroughChildrenUntilTaxonFound = async (parentNode, taxonId) => {
    let node; 
    while(!node && parentNode.children.length < parentNode.childCount){
      parentNode.childOffset += CHILD_PAGE_SIZE;
      if (
        parentNode.children[parentNode.children.length - 1].key ===
        "__loadMoreBTN__"
      ) {
        parentNode.children = parentNode.children.slice(0, -1);
      }
      await this.fetchChildPage(parentNode, false, true);
      node = this.findNode(taxonId, parentNode.children);
    }
    if(!node){
      node = parentNode.children.find(
        (c) => _.get(c, 'taxon.id') ? c.taxon.id.indexOf("incertae-sedis") > -1 : false
      );
    }
    return node;
  }

  reloadLoadedKeys = async (keys, expandKey, expandAll = true) => {
    this.setState({ rootLoading: true });
    const { loadedKeys: storedKeys } = this.state;
    // const defaultExpandKey = _.get(qs.parse(_.get(location, "search")), 'taxonKey');

    let { treeData } = this.state;
    const targetTaxon = expandKey ? this.findNode(expandKey, treeData) : null;
    const loadedKeys = keys ? [...keys] : [...storedKeys];
    for (let index = 0; index < loadedKeys.length; index++) {
      let node = this.findNode(loadedKeys[index], treeData);
      if (!node && targetTaxon && loadedKeys[index - 1]) {
        // If the node is not found look for insertae sedis nodes in the children of the parent and insert the 'Not assigned' between the parent and the node
        const parentNode = this.findNode(loadedKeys[index - 1], treeData);
        if (
          parentNode &&
          _.isArray(_.get(parentNode, "children")) &&
          parentNode.children.length > 0
        ) {
          
          node = await this.pageThroughChildrenUntilTaxonFound(parentNode, loadedKeys[index])
         if(node){
          loadedKeys.splice(index, 0, node.taxon.id);
         } else {
          // It has gone missing from the tree
          this.setState(
            {
              nodeNotFoundErr: (
                <span>Cannot find taxon {expandKey} in tree &#128549;</span>
              ),
              rootLoading: false
            },
            () => {
              if (
                this.props.treeType === "CATALOGUE" &&
                typeof this.props.addMissingTargetKey === "function"
              ) {
                this.props.addMissingTargetKey(expandKey);
              }
            }
          );
        }
          
          
        }
      }
      if (node) {
        await this.fetchChildPage(node, true, true);
        let targetNode = node.children.find(
          (c) => _.get(c, "taxon.id") === _.get(targetTaxon, "taxon.id")
        );
        if (
          targetTaxon &&
          index === loadedKeys.length - 2 &&
          _.get(node, "taxon.id") !== _.get(targetTaxon, "taxon.id") &&
          _.isArray(node.children) &&
          !targetNode
        ) {
          if (node.children.length < node.childCount) {
            // its the parent of the taxon we are after - if its not in the first page, insert it
            targetNode = await this.pageThroughChildrenUntilTaxonFound(node, _.get(targetTaxon, "taxon.id"))
            // node.children = [targetTaxon, ...node.children];
            if(targetNode){
              this.setState({ treeData: [...this.state.treeData] }, () => {
                setTimeout(() => {
                  const elmnt = document.getElementById(expandKey);
                  elmnt.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  /* if (_.get(this, "treeRef.current")) {
                    this.treeRef.current.scrollTo({ key: expandKey });
                  } */
                }, 100);
              });
            } else {
              // It has gone missing from the tree
              this.setState(
                {
                  nodeNotFoundErr: (
                    <span>Cannot find taxon {expandKey} in tree &#128549;</span>
                  ),
                  rootLoading: false
                },
                () => {
                  if (
                    this.props.treeType === "CATALOGUE" &&
                    typeof this.props.addMissingTargetKey === "function"
                  ) {
                    this.props.addMissingTargetKey(expandKey);
                  }
                }
              );
            }
            
          } 
        }
      }
    }
    const newState = { loadedKeys, rootLoading: false };
    if (expandAll) {
      newState.expandedKeys = loadedKeys;
    }
    this.setState(newState, () => {
      if (expandKey) {
        setTimeout(() => {
          const elmnt = document.getElementById(expandKey);
                elmnt.scrollIntoView({ behavior: 'smooth', block: 'center' });
/*           if (_.get(this, "treeRef.current")) {
            this.treeRef.current.scrollTo({ key: expandKey });
          } */
        }, 100);
      }
    });
  };

  render() {
    const {
      error,
      rootTotal,
      rootLoading,
      treeData,
      defaultExpandAll,
      nodeNotFoundErr,
      loadedKeys,
      expandedKeys,
    } = this.state;
    const { location, treeType, dataset, height } = this.props;
    console.log(height);
    const defaultExpandKey = _.get(
      qs.parse(_.get(location, "search")),
      "taxonKey"
    );

    return (
      <div>
        {error && (
          <React.Fragment>
            {_.get(error, "response.data.code") !== 404 ? (
              <Alert
                closable
                onClose={() => this.setState({ error: null })}
                style={{ marginTop: "8px" }}
                message={<ErrorMsg error={error} />}
                type="error"
              />
            ) : (
              <Alert
                closable
                onClose={() => this.setState({ error: null })}
                style={{ marginTop: "8px" }}
                message={
                  <Custom404
                    error={error}
                    treeType={treeType}
                    dataset={dataset}
                    loadRoot={this.loadRoot}
                  />
                }
                type="warning"
              />
            )}
          </React.Fragment>
        )}
        {nodeNotFoundErr && (
          <Alert
            closable
            onClose={() => this.setState({ nodeNotFoundErr: null })}
            style={{ marginTop: "8px" }}
            message={nodeNotFoundErr}
            type="warning"
          />
        )}
        {rootLoading && <Skeleton paragraph={{ rows: 10 }} active />}
        {!rootLoading && treeData.length > 0 && (
          <Tree
            ref={this.treeRef}
            defaultExpandAll={defaultExpandAll}
           // height={height || 600}
            // defaultExpandedKeys={defaultExpandedKeys}
            loadData={this.onLoadData}
            onLoad={(loadedKeys) => this.setState({ loadedKeys })}
            loadedKeys={loadedKeys}
            expandedKeys={expandedKeys}
            treeData={treeData}
            filterTreeNode={(node) => node.key === defaultExpandKey}
            onExpand={(expandedKeys, obj) => {
              this.setState({ expandedKeys });
              if (obj.expanded) {
                const params = qs.parse(_.get(location, "search"));
                const newParams = { ...params, taxonKey: obj.node.key };

                history.push({
                  pathname: location.path,
                  search: `?${qs.stringify(newParams)}`,
                });
              } else {
                history.push({
                  pathname: location.path,
                  search: `?${qs.stringify(
                    _.omit(qs.parse(_.get(location, "search")), "taxonKey")
                  )}`,
                });
              }
            }}
          ></Tree>
        )}

        {!error && treeData.length < rootTotal && (
          <Button loading={rootLoading} onClick={this.loadRoot}>
            Load more{" "}
          </Button>
        )}
      </div>
    );
  }
}

export default withRouter(ColTree);
