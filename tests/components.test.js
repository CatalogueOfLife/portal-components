import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { publicClient } from 'src/api/client'
import { Tree, Search, Taxon, SourceDataset, SourceDatasetList, BibTex } from 'src/'

const CATALOGUE_KEY = '310463'
// The "Content" (sector-mode) filter only renders for project/xrelease
// datasets; 310463 is a release, so it is correctly hidden there. Key 3 is
// the COL project dataset (origin "project") where the filter does show.
const PROJECT_KEY = '3'
const TAXON_PATH = '/data/taxon/'
const SOURCE_PATH = '/data/source/'
const ROOT_TAXON_KEY = 'V'

const waitMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Poll until predicate is truthy or the timeout elapses (condition-based
// waiting — beats a fixed sleep for async, network-dependent state).
const waitFor = async (predicate, { timeout = 8000, interval = 100 } = {}) => {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeout) throw new Error('waitFor: condition not met within timeout')
    await waitMs(interval)
  }
}

const mountIn = (component) => {
  const node = document.createElement('div')
  document.body.appendChild(node)
  const root = createRoot(node)
  act(() => { root.render(component) })
  node.__root = root
  return node
}

const unmount = (node) => {
  if (node.__root) act(() => { node.__root.unmount() })
  if (node.parentNode) node.parentNode.removeChild(node)
}

// ─── Tree ──────────────────────────────────────────────────────────────────

describe('Tree', () => {
  let node
  afterEach(() => { unmount(node) })

  it('renders the tree interface', () => {
    node = mountIn(
      <Tree
        datasetKey={CATALOGUE_KEY}
        hrefForTaxon={(id) => `${TAXON_PATH}${id}`}
        hrefForSource={(id) => `${SOURCE_PATH}${id}`}
        showTreeOptions={true}
      />
    )
    expect(node.querySelector('.catalogue-of-life')).toBeTruthy()
  })

  it('loads root tree nodes from the production API', () => {
    node = mountIn(
      <Tree
        datasetKey={CATALOGUE_KEY}
        hrefForTaxon={(id) => `${TAXON_PATH}${id}`}
        hrefForSource={(id) => `${SOURCE_PATH}${id}`}
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

  it('renders the search form with Fuzzy and Content controls', async () => {
    // Use a project dataset so the origin-gated "Content" filter renders.
    node = mountIn(
      <Search datasetKey={PROJECT_KEY} pathToTaxon={TAXON_PATH} />
    )
    expect(node.querySelector('.catalogue-of-life')).toBeTruthy()
    // The "Fuzzy" toggle is unconditional, present on the first render.
    const fuzzyBtn = Array.from(node.querySelectorAll('button')).find(
      (b) => b.textContent.trim() === 'Fuzzy'
    )
    expect(fuzzyBtn).toBeTruthy()
    // "Content" only appears once the dataset origin loads asynchronously.
    await waitFor(() => node.innerHTML.includes('Content'))
    expect(node.innerHTML).toContain('Content')
  })

  it('renders the "Reset all" button with antd 6 danger styling', () => {
    node = mountIn(
      <Search datasetKey={CATALOGUE_KEY} pathToTaxon={TAXON_PATH} />
    )
    const resetBtn = Array.from(node.querySelectorAll('button')).find(
      (b) => b.textContent.trim() === 'Reset all'
    )
    expect(resetBtn).toBeTruthy()
    // antd 6 emits the red color via ant-btn-color-dangerous, not the legacy ant-btn-danger
    expect(resetBtn.className).toContain('ant-btn-color-dangerous')
  })

  it('loads search results from the production API', () => {
    node = mountIn(
      <Search datasetKey={CATALOGUE_KEY} pathToTaxon={TAXON_PATH} />
    )
    return waitMs(6000).then(() => {
      expect(node.querySelector('.ant-table-tbody')).toBeTruthy()
    })
  })
})

// ─── Taxon ─────────────────────────────────────────────────────────────────

describe('Taxon', () => {
  let node
  afterEach(() => { unmount(node) })

  it('renders the taxon page container', () => {
    node = mountIn(
      <Taxon
        datasetKey={CATALOGUE_KEY}
        taxonKey="6W3C4"
        hrefForTaxon={(id) => `${TAXON_PATH}${id}`}
        hrefForSearch={() => `/data/search`}
        hrefForTree={() => `/data/tree`}
        hrefForSource={(id) => `${SOURCE_PATH}${id}`}
      />
    )
    expect(node.querySelector('.catalogue-of-life')).toBeTruthy()
  })

  it('loads taxon data from the production API', () => {
    node = mountIn(
      <Taxon
        datasetKey={CATALOGUE_KEY}
        taxonKey="6W3C4"
        hrefForTaxon={(id) => `${TAXON_PATH}${id}`}
        hrefForSearch={() => `/data/search`}
        hrefForTree={() => `/data/tree`}
        hrefForSource={(id) => `${SOURCE_PATH}${id}`}
      />
    )
    return waitMs(6000).then(() => {
      expect(node.innerHTML.length).toBeGreaterThan(500)
    })
  })
})

// ─── SourceDataset ─────────────────────────────────────────────────────────

describe('SourceDataset', () => {
  let node
  let sourceDatasetKey = null

  beforeAll(async () => {
    try {
      const res = await publicClient.get(`https://api.checklistbank.org/dataset/${CATALOGUE_KEY}/source?limit=1`)
      sourceDatasetKey = res.data?.[0]?.key
    } catch (e) {
      // ignore — fallback key used below
    }
  })

  afterEach(() => { unmount(node) })

  it('renders the dataset page container', () => {
    node = mountIn(
      <SourceDataset
        datasetKey={CATALOGUE_KEY}
        sourceDatasetKey={sourceDatasetKey || '1010'}
        hrefForTree={() => '/data/tree'}
        hrefForSearch={() => '/data/search'}
      />
    )
    expect(node.querySelector('.catalogue-of-life')).toBeTruthy()
  })

  it('loads dataset info from the production API', () => {
    node = mountIn(
      <SourceDataset
        datasetKey={CATALOGUE_KEY}
        sourceDatasetKey={sourceDatasetKey || '1010'}
        hrefForTree={() => '/data/tree'}
        hrefForSearch={() => '/data/search'}
      />
    )
    return waitMs(6000).then(() => {
      expect(node.innerHTML.length).toBeGreaterThan(500)
    })
  })
})

// ─── SourceDatasetList ─────────────────────────────────────────────────────────

describe('SourceDatasetList', () => {
  let node
  afterEach(() => { unmount(node) })

  it('renders the source datasets container', () => {
    node = mountIn(
      <SourceDatasetList
        datasetKey={CATALOGUE_KEY}
        hrefForSource={(id) => `${SOURCE_PATH}${id}`}
        hrefForSearch={() => '/data/search'}
      />
    )
    expect(node.querySelector('.catalogue-of-life')).toBeTruthy()
  })

  it('loads source datasets from the production API', () => {
    node = mountIn(
      <SourceDatasetList
        datasetKey={CATALOGUE_KEY}
        hrefForSource={(id) => `${SOURCE_PATH}${id}`}
        hrefForSearch={() => '/data/search'}
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

  it('renders source-within-catalogue url with the new sourceDatasetKey prop', () => {
    node = mountIn(<BibTex datasetKey={CATALOGUE_KEY} sourceDatasetKey="1010" />)
    const link = node.querySelector('a')
    expect(link).toBeTruthy()
    expect(link.href).toContain(`dataset/${CATALOGUE_KEY}/source/1010.bib`)
  })

  it('still accepts the deprecated catalogueKey prop, swapping legacy datasetKey to sourceDatasetKey', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      // Legacy call: datasetKey is the source, catalogueKey is the catalogue.
      // The shim must swap so the URL ends up as dataset/{catalogue}/source/{source}.bib.
      node = mountIn(<BibTex datasetKey="1010" catalogueKey={CATALOGUE_KEY} />)
      const link = node.querySelector('a')
      expect(link).toBeTruthy()
      expect(link.href).toContain(`dataset/${CATALOGUE_KEY}/source/1010.bib`)
      expect(warn).toHaveBeenCalled()
      expect(warn.mock.calls[0][0]).toMatch(/catalogueKey.*deprecated/)
    } finally {
      warn.mockRestore()
    }
  })
})
