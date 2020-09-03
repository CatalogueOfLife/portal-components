import React from "react";
import { Tree,  Alert, Spin, Button, Skeleton } from "antd";
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
import {withRouter} from "react-router-dom";


const datasetLoader = new DataLoader(ids => getDatasetsBatch(ids));
const CHILD_PAGE_SIZE = 10000; // How many children will we load at a time


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
      nodeNotFoundErr: null
    };
    this.treeRef = React.createRef();
  }

  componentDidMount = () => {
    this.loadRoot();
    this.sectorLoader = new DataLoader((ids) => getSectorsBatch(ids, this.props.catalogueKey));
    const { treeRef } = this.props;
    treeRef(this);
  };


  componentDidUpdate = (prevProps) => {
    if(prevProps.defaultExpandKey !== this.props.defaultExpandKey){
        this.reloadRoot()
      }
   
  }


  reloadRoot = () => this.setState({ rootLoading: true,
    treeData: [],
    loadedKeys: [],
    rootTotal: 0,
    error: null,
    nodeNotFoundErr: null }, this.loadRoot);
  

  loadRoot = async () => {
    const defaultExpandKey = _.get(qs.parse(_.get(location, "search")), 'taxonKey');

    if(defaultExpandKey){
     return this.expandToTaxon(defaultExpandKey)
    } else {
    return this.loadRoot_()
    }
  }

  loadRoot_ = async () => {
    const {
        showSourceTaxon,
        catalogueKey,
        pathToTaxon,
        pathToDataset
  
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
            datasetKey: catalogueKey,
            childCount: tx.childCount,
            isLeaf: tx.childCount === 0,
            childOffset: 0
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
            treeData:[...this.state.treeData, ...treeData],
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
          error: err
        });
      });
  };  

  expandToTaxon = async (defaultExpandKey) => {
    const {
        showSourceTaxon,
        catalogueKey,
        pathToTaxon,
        pathToDataset
      } = this.props;

    this.setState({rootLoading: true, treeData: []})
    const {data} = await axios(
          `${config.dataApi}dataset/${catalogueKey}/tree/${
            defaultExpandKey
          }?catalogueKey=${catalogueKey}&insertPlaceholder=true&type=CATALOGUE`
        ).then(res =>
          this.decorateWithSectorsAndDataset({
            data: { result: res.data }
          }).then(() => res)
        )

    if(data.length === 0){
      return this.setState({error: {message: `No classification found for Taxon ID: ${defaultExpandKey}`}}, this.loadRoot_)
    }    
    const tx = data[data.length-1]
    let root = {
      taxon: tx,
      key: tx.id,
      datasetKey: catalogueKey,
      childCount: tx.childCount,
      isLeaf: tx.childCount === 0,
      childOffset: 0}
      root.title = (
        <ColTreeNode
          taxon={tx}
          pathToTaxon={pathToTaxon}
          pathToDataset={pathToDataset}
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
          datasetKey: catalogueKey,
          childCount: tx.childCount,
          isLeaf: tx.childCount === 0,
          childOffset: 0}
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
  
  fetchChildPage = (dataRef, reloadAll, dontUpdateState) => {
    const { showSourceTaxon,  catalogueKey,  pathToTaxon, pathToDataset } = this.props;
    const {treeData} = this.state;
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
                isLeaf: tx.childCount === 0,
                childOffset: 0,
                parent: dataRef,
                name: tx.name
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
      )
      .then(data => {
        // reloadAll is used to force reload all children from offset 0 - used when new children have been posted
        dataRef.children =
          dataRef.children && offset !== 0 && !reloadAll
            ? [...dataRef.children, ...data]
            : data;

        if (offset + CHILD_PAGE_SIZE < childcount) {
          let moreLoading = false;
          const loadMoreFn = () => {
            moreLoading = true;
            dataRef.childOffset += CHILD_PAGE_SIZE;
            if (
              dataRef.children[dataRef.children.length - 1].key ===
              "__loadMoreBTN__"
            ) {
              dataRef.children = dataRef.children.slice(0, -1);
            }
            this.setState(
              {
                treeData: [...treeData],
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
              childCount: 0,
              isLeaf: true
            }
          ];
        }
        if(!dontUpdateState){
          this.setState({
            treeData: [...treeData],
            loadedKeys: [...new Set([...this.state.loadedKeys, dataRef.key])]
          });
        }
        
        
      });
  };

  decorateWithSectorsAndDataset = res => {
    if (!res.data.result) return res;
    const {catalogueKey} = this.props
    return Promise.all(
      res.data.result
        .filter(tx => !!tx.sectorKey)
        .map(tx =>
          this.sectorLoader.load(tx.sectorKey, catalogueKey).then(r => {
            tx.sector = r;
            return datasetLoader
              .load(r.subjectDatasetKey)
              .then(dataset => (tx.sector.dataset = dataset));
          })
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

  
  reloadLoadedKeys = async (keys, expandAll = true) => {
    this.setState({rootLoading: true})
    const {loadedKeys: storedKeys} = this.state;
    const defaultExpandKey = _.get(qs.parse(_.get(location, "search")), 'taxonKey');

    let {treeData} = this.state;
    const targetTaxon = defaultExpandKey ? this.findNode(defaultExpandKey, treeData) : null;
    const loadedKeys = keys ? [...keys] : [...storedKeys];
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
          && _.get(node, 'taxon.id') !== _.get(targetTaxon, 'taxon.id')
          && _.isArray(node.children)  
          && !node.children.find(c => _.get(c, 'taxon.id') === _.get(targetTaxon, 'taxon.id')) ){
            if (
              node.children.length - 1 === CHILD_PAGE_SIZE){
              // its the parent of the taxon we are after - if its not in the first page, insert it
              node.children = [targetTaxon, ...node.children]
              this.setState({treeData: [...this.state.treeData]}, () => {
                setTimeout(()=>{
                  if(_.get(this, 'treeRef.current')){
                    this.treeRef.current.scrollTo({ key: defaultExpandKey });
                }
                } , 100)
                              
              })
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
    const newState =  {loadedKeys, rootLoading: false};
    if (expandAll) {
      newState.expandedKeys = loadedKeys;
    }
    this.setState(newState, () => {
      if(defaultExpandKey){
        setTimeout(()=>{
          if(_.get(this, 'treeRef.current')){
            this.treeRef.current.scrollTo({ key: defaultExpandKey });
        }
        } , 100)
      }             
    })
  }


  render() {
    const {
      error,
      rootTotal,
      rootLoading,
      treeData,
      defaultExpandAll,
      nodeNotFoundErr,
      loadedKeys,
      expandedKeys
        } = this.state;
    const { location, treeType, dataset } = this.props;
    const defaultExpandKey = _.get(qs.parse(_.get(location, "search")), 'taxonKey');

    return (
      <div>
       
        {error && (
          <React.Fragment>
          {  _.get(error, 'response.data.code') !== 404 ?
          <Alert
            closable
            onClose={() => this.setState({ error: null })}
            style={{ marginTop: "8px" }}
            message={<ErrorMsg error={error} />}
            type="error"
          /> :
          <Alert
            closable
            onClose={() => this.setState({ error: null })}
            style={{ marginTop: "8px" }}
            message={<Custom404 error={error} treeType={treeType} dataset={dataset} loadRoot={this.loadRoot} />}
            type="warning"
          />

          }
          </React.Fragment>
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
        {rootLoading &&  <Skeleton paragraph={{rows: 10}} active />}
        {!rootLoading && treeData.length > 0 && (
          
              <Tree
                showLine={true}
                ref={this.treeRef}
                defaultExpandAll={defaultExpandAll}
                height={this.props.height || 500}
               // defaultExpandedKeys={defaultExpandedKeys}
                loadData={this.onLoadData}
                onLoad={loadedKeys => this.setState({loadedKeys})}
                loadedKeys={loadedKeys}
                expandedKeys={expandedKeys}
                treeData={treeData}
                filterTreeNode={node =>  node.key === defaultExpandKey}
                onExpand={(expandedKeys, obj) => {
                  this.setState({expandedKeys})
                  if (obj.expanded) {
                    if (_.get(obj, 'node.childCount') > 0 ){
                     // this.fetchChildPage(obj.node, true)
                    }
                    const params = qs.parse(_.get(location, "search"));
                    const newParams = {...params, taxonKey : obj.node.key}
                     
                    history.push({
                      pathname: location.path,
                      search: `?${qs.stringify(newParams)}`
                    });
                  } else {
                    history.push({
                      pathname: location.path,
                      search: `?${qs.stringify(
                        _.omit(qs.parse(_.get(location, "search")), 'taxonKey')
                      )}`
                    });
                  }
                }}
              >
                
              </Tree>
              
            )}
            
       {!error && treeData.length < rootTotal && <Button loading={rootLoading} onClick={this.loadRoot}>Load more </Button>}
      </div>
    );
  }
}

export default withRouter(ColTree);

