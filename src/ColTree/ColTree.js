import React, {Component} from 'react'
import history from "../history";
import {withRouter} from "react-router-dom";
import axios from "axios";
import { Tree, Spin, Alert, Button, Skeleton} from "antd";
import ErrorMsg from "../components/ErrorMsg";
import config from "../config"
import { getSectorsBatch } from "../api/sector";
import { getDatasetsBatch } from "../api/dataset";
import DataLoader from "dataloader";
import qs from "query-string";
import _ from "lodash";
import ColTreeNode from "./ColTreeNode"
import ColTreeActions from "./ColTreeActions"

const sectorLoader = new DataLoader(ids => getSectorsBatch(ids));
const datasetLoader = new DataLoader(ids => getDatasetsBatch(ids));
const TreeNode = Tree.TreeNode;
const CHILD_PAGE_SIZE = 1000; // How many children will we load at a time


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
      loadedKeys: [],
      expandedKeys: [],
      rootTotal: 0,
      error: null
    };
  }

  componentDidMount = () => {
    this.loadRoot();
    ColTreeActions.on('refreshTree', this.reloadRoot);
    this.sectorLoader = new DataLoader((ids) => getSectorsBatch(ids, this.props.catalogueKey));

  };

  componentDidUpdate = (prevProps) => {
    if(prevProps.defaultExpandKey !== this.props.defaultExpandKey){
      this.reloadRoot()
    }

  }

  componentWillUnmount = () => {
    
    ColTreeActions.removeListener(refreshEvent, this.reloadRoot);
  };

  reloadRoot = () => this.setState({ treeData: []}, this.loadRoot);


  loadRoot = async () => {
    const {location} = this.props;
    const defaultExpandKey = _.get(qs.parse(_.get(location, "search")), 'taxonKey');

    if(defaultExpandKey){
      this.expandToTaxon(defaultExpandKey)
    } else {
      this.loadRoot_()
    }
  }

  loadRoot_ = async () => {
    const {
      showSourceTaxon,
      catalogueKey,
      pathToTaxon

    } = this.props;
    this.setState({rootLoading: true, treeData: []})
    return axios(
      `${config.dataApi}dataset/${catalogueKey}/tree?catalogueKey=${
        catalogueKey
      }&type=CATALOGUE&limit=${CHILD_PAGE_SIZE}&offset=${this.state.treeData.length}`
    ).then(this.decorateWithSectorsAndDataset)
      .then(res => {
        const mainTreeData = res.data.result || [];
        const rootTotal = res.data.total;
        const treeData = mainTreeData.map(tx => {
          let dataRef = {
            taxon: tx,
            key: tx.id,
            childCount: tx.childCount,
            childOffset: 0
          };
          dataRef.title = (
            <ColTreeNode
              taxon={tx}
              pathToTaxon={pathToTaxon}
              catalogueKey={catalogueKey}
              showSourceTaxon={showSourceTaxon}
              reloadChildren={() => this.fetchChildPage(dataRef, true)}
            />
          );
          return dataRef;
        });
      
          this.setState({
            rootTotal: rootTotal,
            rootLoading: false,
            treeData:[...treeData],
            expandedKeys: treeData.length < 10 ? treeData.map(n => n.taxon.id): [],
            error: null
          });
          if (treeData.length === 1) {
            this.fetchChildPage(treeData[treeData.length - 1]);
          }
        
      })
      .catch(err => {
        this.setState({
          treeData: [],
          rootLoading: false,
          expandedKeys: [],
          loadedKeys: [],
          error: err
        });
      });
  };  
 
  findNode = (id, nodeArray) => {    
    let node = null;

    node = nodeArray.find((n)=> _.get(n, 'taxon.id') === id );

    if(node){
      return node;
    } else {
      const children = nodeArray.map(n => _.get(n, 'children') || [])
      const flattenedChildren = children.flat()
      if (flattenedChildren.length === 0){
        return null;
      } else {
        return this.findNode(id, flattenedChildren)
      }
    }
  
  }

  expandToTaxon = async (defaultExpandKey) => {
    const {
      showSourceTaxon,
      catalogueKey,
      pathToTaxon
    } = this.props;

    this.setState({rootLoading: true, treeData: []})
    const {data} = await axios(
          `${config.dataApi}dataset/${catalogueKey}/tree/${
            defaultExpandKey
          }?catalogueKey=${catalogueKey}&type=CATALOGUE`
        ).then(res =>
          this.decorateWithSectorsAndDataset({
            data: { result: res.data }
          }).then(() => res)
        )
    if(!data || data.length === 0) {
      this.setState({error: {message: "The taxon was not found :-("}, rootLoading: false})
    } else {     
    const tx = data[data.length-1]
    let root = {
      taxon: tx,
      key: tx.id,
      childCount: tx.childCount,
      childOffset: 0}
      root.title = (
        <ColTreeNode
          taxon={tx}
          pathToTaxon={pathToTaxon}
          catalogueKey={catalogueKey}
          showSourceTaxon={showSourceTaxon}
          reloadChildren={() => this.fetchChildPage(root, true)}
        />
      )

      const root_ = root;
      for(let i= data.length-2; i >= 0; i--){
        const tx = data[i];
        const node  = {
          taxon: tx,
          key: tx.id,
          childCount: tx.childCount,
          childOffset: 0}
          node.title = (
            <ColTreeNode
              taxon={tx}
              pathToTaxon={pathToTaxon}
              catalogueKey={catalogueKey}
              showSourceTaxon={showSourceTaxon}
              reloadChildren={() => this.fetchChildPage(node, true)}
            />
          )

          root.children = [node];
          root = node;
      }

    const treeData = [
     root_
    ]

     const loadedKeys = [...data.map(t => t.id).reverse()]

     this.setState({treeData}, () => this.reloadLoadedKeys(loadedKeys))
  }
  }

  reloadLoadedKeys = async (keys) => {
    const {loadedKeys: storedKeys} = this.state;
    const defaultExpandKey = _.get(qs.parse(_.get(location, "search")), 'taxonKey');

    let {treeData} = this.state;
    const targetTaxon = defaultExpandKey ? this.findNode(defaultExpandKey, treeData) : null;
    const loadedKeys = [...keys] || [...storedKeys];
    for (let index = 0; index < loadedKeys.length; index++) {
      let node = this.findNode(loadedKeys[index], treeData);
      if (!node && targetTaxon && loadedKeys[index-1]){
        // If the node is not found look for insertae sedis nodes in the children of the parent and insert the 'Not assigned' between the parent and the node 
        const parentNode = this.findNode(loadedKeys[index-1], treeData);
        if(parentNode && _.isArray(_.get(parentNode, 'children')) && parentNode.children.length > 0) {
          node = parentNode.children.find(c => c.taxon.id.indexOf('incertae-sedis') > -1)
          loadedKeys.splice(index, 0, node.taxon.id)
        } 
      }
      if(node){
        await this.fetchChildPage(node, true, true)
        if(targetTaxon 
          && index === loadedKeys.length - 2 
          && _.isArray(node.children)  
          && !node.children.find(c => _.get(c, 'taxon.id') === _.get(targetTaxon, 'taxon.id')) ){
            if (
              node.children.length - 1 === CHILD_PAGE_SIZE){
              // its the parent of the taxon we are after - if its not in the first page, insert it
              node.children = [targetTaxon, ...node.children]
              this.setState({treeData: [...this.state.treeData]})
            } else {
              // It has gone missing from the tree
                this.setState(
                  {
                    nodeNotFoundErr: (
                      <span>
                        Cannot find taxon {defaultExpandKey} in tree &#128549;
                      </span>
                    )
                  },
                  () => {
                    if (
                      this.props.treeType === "CATALOGUE" &&
                      typeof this.props.addMissingTargetKey === "function"
                    ) {
                      this.props.addMissingTargetKey(defaultExpandKey);
                    }
                  }
                ); 
            }
        }
      }
    }
    this.setState({expandedKeys: loadedKeys, loadedKeys, rootLoading: false})
  }

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
      }&type=CATALOGUE`
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
          this.sectorLoader.load(tx.sectorKey).then(r => {
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
      nodeNotFoundErr,
      loadedKeys,
      expandedKeys
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
                onLoad={loadedKeys => this.setState({loadedKeys})}
                loadedKeys={loadedKeys}
                expandedKeys={expandedKeys}
                loadData={this.onLoadData}
                filterTreeNode={node =>
                  node.props.dataRef.key === defaultExpandKey
                }
                 onExpand={(expandedKeys, obj) => {
                  this.setState({expandedKeys})

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
            
       {treeData.length === 0 &&  rootLoading && <Skeleton active paragraph={{ rows: 8 }} />} 
       {!error && treeData.length > 0 && treeData.length < rootTotal && <Button loading={rootLoading} onClick={this.loadRoot}>Load more </Button>}
      </div>
    );
  }
}

export default withRouter(ColTree);
