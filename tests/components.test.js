
import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import axios from 'axios'
import { Tree, Search, Taxon, Dataset, DatasetSearch, BibTex } from 'src/'
import history from 'src/history'

// Mocha replaces window.onerror with its own handler when the runner starts,
// so module-level patches are overwritten. A root-level before() hook runs
// after mocha has installed its handler, giving us a chance to wrap it and
// drop the benign "ResizeObserver loop" error before mocha ever sees it.
before(function () {
  var _onerror = window.onerror
  window.onerror = function (msg) {
    if (typeof msg === 'string' && msg.indexOf('ResizeObserver loop') !== -1) {
      return true // tell the browser the error was handled; do NOT call mocha's handler
    }
    return _onerror ? _onerror.apply(this, arguments) : undefined
  }
})

const CATALOGUE_KEY = '312578'
const TAXON_PATH = '/data/taxon/'
const SOURCE_PATH = '/data/source/'
// "V" is the Biota/root taxon used for catalogue 312578 in the demo
const ROOT_TAXON_KEY = 'V'

const waitMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const mountIn = (component) => {
  const node = document.createElement('div')
  document.body.appendChild(node)
  render(component, node)
  return node
}

const unmount = (node) => {
  unmountComponentAtNode(node)
  document.body.removeChild(node)
}

// ─── Tree ──────────────────────────────────────────────────────────────────

describe('Tree', function () {
  this.timeout(15000)
  let node
  afterEach(function () { unmount(node) })

  it('renders the tree interface', function () {
    node = mountIn(
      <Tree
        catalogueKey={CATALOGUE_KEY}
        pathToTaxon={TAXON_PATH}
        pathToDataset={SOURCE_PATH}
        showTreeOptions={true}
      />
    )
    expect(node.querySelector('.catalogue-of-life')).toExist()
  })

  it('loads root tree nodes from the production API', function () {
    node = mountIn(
      <Tree
        catalogueKey={CATALOGUE_KEY}
        pathToTaxon={TAXON_PATH}
        pathToDataset={SOURCE_PATH}
      />
    )
    return waitMs(6000).then(() => {
      expect(node.querySelector('.ant-tree')).toExist()
    })
  })
})

// ─── Search ────────────────────────────────────────────────────────────────

describe('Search', function () {
  this.timeout(15000)
  let node
  afterEach(function () { unmount(node) })

  it('renders the search form with Matching and Content controls', function () {
    node = mountIn(
      <Search catalogueKey={CATALOGUE_KEY} pathToTaxon={TAXON_PATH} />
    )
    expect(node.querySelector('.catalogue-of-life')).toExist()
    expect(node.innerHTML).toContain('Matching')
    expect(node.innerHTML).toContain('Content')
  })

  it('loads search results from the production API', function () {
    node = mountIn(
      <Search catalogueKey={CATALOGUE_KEY} pathToTaxon={TAXON_PATH} />
    )
    return waitMs(6000).then(() => {
      expect(node.querySelector('.ant-table-tbody')).toExist()
    })
  })
})

// ─── Taxon ─────────────────────────────────────────────────────────────────

describe('Taxon', function () {
  this.timeout(15000)
  let node

  beforeEach(function () {
    history.push(`${TAXON_PATH}${ROOT_TAXON_KEY}`)
  })
  afterEach(function () { unmount(node) })

  it('renders the taxon page container', function () {
    node = mountIn(
      <Taxon
        catalogueKey={CATALOGUE_KEY}
        pathToTaxon={TAXON_PATH}
        pathToSearch="/data/search"
        pathToTree="/data/tree"
        pathToDataset={SOURCE_PATH}
      />
    )
    expect(node.querySelector('.catalogue-of-life')).toExist()
  })

  it('loads taxon data from the production API', function () {
    node = mountIn(
      <Taxon
        catalogueKey={CATALOGUE_KEY}
        pathToTaxon={TAXON_PATH}
        pathToSearch="/data/search"
        pathToTree="/data/tree"
        pathToDataset={SOURCE_PATH}
      />
    )
    return waitMs(6000).then(() => {
      expect(node.innerHTML.length).toBeGreaterThan(500)
    })
  })
})

// ─── Dataset ───────────────────────────────────────────────────────────────

describe('Dataset', function () {
  this.timeout(15000)
  let node
  let sourceDatasetKey = null

  before(function () {
    return axios
      .get(`https://api.checklistbank.org/dataset/${CATALOGUE_KEY}/source?limit=1`)
      .then((res) => { sourceDatasetKey = res.data?.[0]?.key })
      .catch(() => {})
  })

  beforeEach(function () {
    history.push(`${SOURCE_PATH}${sourceDatasetKey || '1019'}`)
  })
  afterEach(function () { unmount(node) })

  it('renders the dataset page container', function () {
    node = mountIn(
      <Dataset
        catalogueKey={CATALOGUE_KEY}
        pathToTree="/data/tree"
        pathToSearch="/data/search"
      />
    )
    expect(node.querySelector('.catalogue-of-life')).toExist()
  })

  it('loads dataset info from the production API', function () {
    node = mountIn(
      <Dataset
        catalogueKey={CATALOGUE_KEY}
        pathToTree="/data/tree"
        pathToSearch="/data/search"
      />
    )
    return waitMs(6000).then(() => {
      expect(node.innerHTML.length).toBeGreaterThan(500)
    })
  })
})

// ─── DatasetSearch ─────────────────────────────────────────────────────────

describe('DatasetSearch', function () {
  this.timeout(15000)
  let node
  afterEach(function () { unmount(node) })

  it('renders the source datasets container', function () {
    node = mountIn(
      <DatasetSearch
        catalogueKey={CATALOGUE_KEY}
        pathToDataset={SOURCE_PATH}
        pathToSearch="/data/search"
      />
    )
    expect(node.querySelector('.catalogue-of-life')).toExist()
  })

  it('loads source datasets from the production API', function () {
    node = mountIn(
      <DatasetSearch
        catalogueKey={CATALOGUE_KEY}
        pathToDataset={SOURCE_PATH}
        pathToSearch="/data/search"
      />
    )
    return waitMs(6000).then(() => {
      expect(node.querySelector('.ant-table-tbody')).toExist()
    })
  })
})

// ─── BibTex ────────────────────────────────────────────────────────────────

describe('BibTex', function () {
  let node
  afterEach(function () { unmount(node) })

  it('renders a download link pointing to the production API', function () {
    node = mountIn(<BibTex datasetKey={CATALOGUE_KEY} />)
    const link = node.querySelector('a')
    expect(link).toExist()
    expect(link.href).toContain('api.checklistbank.org')
    expect(link.href).toContain(CATALOGUE_KEY)
    expect(link.href).toContain('.bib')
  })
})
