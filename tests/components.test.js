import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import axios from 'axios'
import { Tree, Search, Taxon, Dataset, DatasetSearch, BibTex } from 'src/'
import history from 'src/history'

const CATALOGUE_KEY = '312578'
const TAXON_PATH = '/data/taxon/'
const SOURCE_PATH = '/data/source/'
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

describe('Tree', () => {
  let node
  afterEach(() => { unmount(node) })

  it('renders the tree interface', () => {
    node = mountIn(
      <Tree
        catalogueKey={CATALOGUE_KEY}
        pathToTaxon={TAXON_PATH}
        pathToDataset={SOURCE_PATH}
        showTreeOptions={true}
      />
    )
    expect(node.querySelector('.catalogue-of-life')).toBeTruthy()
  })

  it('loads root tree nodes from the production API', () => {
    node = mountIn(
      <Tree
        catalogueKey={CATALOGUE_KEY}
        pathToTaxon={TAXON_PATH}
        pathToDataset={SOURCE_PATH}
      />
    )
    return waitMs(6000).then(() => {
      expect(node.querySelector('.ant-tree')).toBeTruthy()
    })
  })
})

// ─── Search ────────────────────────────────────────────────────────────────

describe('Search', () => {
  let node
  afterEach(() => { unmount(node) })

  it('renders the search form with Matching and Content controls', () => {
    node = mountIn(
      <Search catalogueKey={CATALOGUE_KEY} pathToTaxon={TAXON_PATH} />
    )
    expect(node.querySelector('.catalogue-of-life')).toBeTruthy()
    expect(node.innerHTML).toContain('Matching')
    expect(node.innerHTML).toContain('Content')
  })

  it('loads search results from the production API', () => {
    node = mountIn(
      <Search catalogueKey={CATALOGUE_KEY} pathToTaxon={TAXON_PATH} />
    )
    return waitMs(6000).then(() => {
      expect(node.querySelector('.ant-table-tbody')).toBeTruthy()
    })
  })
})

// ─── Taxon ─────────────────────────────────────────────────────────────────

describe('Taxon', () => {
  let node

  beforeEach(() => {
    history.push(`${TAXON_PATH}${ROOT_TAXON_KEY}`)
  })
  afterEach(() => { unmount(node) })

  it('renders the taxon page container', () => {
    node = mountIn(
      <Taxon
        catalogueKey={CATALOGUE_KEY}
        pathToTaxon={TAXON_PATH}
        pathToSearch="/data/search"
        pathToTree="/data/tree"
        pathToDataset={SOURCE_PATH}
      />
    )
    expect(node.querySelector('.catalogue-of-life')).toBeTruthy()
  })

  it('loads taxon data from the production API', () => {
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

describe('Dataset', () => {
  let node
  let sourceDatasetKey = null

  beforeAll(async () => {
    try {
      const res = await axios.get(`https://api.checklistbank.org/dataset/${CATALOGUE_KEY}/source?limit=1`)
      sourceDatasetKey = res.data?.[0]?.key
    } catch (e) {
      // ignore — fallback key used below
    }
  })

  beforeEach(() => {
    history.push(`${SOURCE_PATH}${sourceDatasetKey || '1019'}`)
  })
  afterEach(() => { unmount(node) })

  it('renders the dataset page container', () => {
    node = mountIn(
      <Dataset
        catalogueKey={CATALOGUE_KEY}
        pathToTree="/data/tree"
        pathToSearch="/data/search"
      />
    )
    expect(node.querySelector('.catalogue-of-life')).toBeTruthy()
  })

  it('loads dataset info from the production API', () => {
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

describe('DatasetSearch', () => {
  let node
  afterEach(() => { unmount(node) })

  it('renders the source datasets container', () => {
    node = mountIn(
      <DatasetSearch
        catalogueKey={CATALOGUE_KEY}
        pathToDataset={SOURCE_PATH}
        pathToSearch="/data/search"
      />
    )
    expect(node.querySelector('.catalogue-of-life')).toBeTruthy()
  })

  it('loads source datasets from the production API', () => {
    node = mountIn(
      <DatasetSearch
        catalogueKey={CATALOGUE_KEY}
        pathToDataset={SOURCE_PATH}
        pathToSearch="/data/search"
      />
    )
    return waitMs(6000).then(() => {
      expect(node.querySelector('.ant-table-tbody')).toBeTruthy()
    })
  })
})

// ─── BibTex ────────────────────────────────────────────────────────────────

describe('BibTex', () => {
  let node
  afterEach(() => { unmount(node) })

  it('renders a download link pointing to the production API', () => {
    node = mountIn(<BibTex datasetKey={CATALOGUE_KEY} />)
    const link = node.querySelector('a')
    expect(link).toBeTruthy()
    expect(link.href).toContain('api.checklistbank.org')
    expect(link.href).toContain(CATALOGUE_KEY)
    expect(link.href).toContain('.bib')
  })
})
