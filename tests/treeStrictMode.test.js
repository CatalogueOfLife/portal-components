import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { vi } from 'vitest'

// React StrictMode mounts every component twice in development, so
// componentDidMount fires two overlapping root loads. Both used to merge their
// page into treeData, so every root taxon rendered twice and antd warned
// "Same 'key' exist in the Tree: CRLT8" (issue #59).

const pendingRootRequests = []
// Child pages served by the stubbed client, keyed by taxon id. Each value is
// a queue: successive requests for the same parent get the next page.
const childPages = {}

// total 5 with 4 results on page one, so the "Load more" roots button renders.
const rootPage = (offset = 0) => ({
  data: {
    total: 5,
    result: [
      { id: 'CRLT8', rank: 'domain', labelHtml: 'Archaea', childCount: 2, status: 'accepted' },
      { id: 'CRRY6', rank: 'domain', labelHtml: 'Bacteria', childCount: 2, status: 'accepted' },
      { id: 'CS5HF', rank: 'domain', labelHtml: 'Eukaryota', childCount: 2, status: 'accepted' },
      { id: '--incertae-sedis--DOMAIN', rank: 'domain', labelHtml: 'Not assigned', childCount: 0, status: 'accepted' },
    ],
    offset,
  },
})

vi.mock('src/api/client', () => {
  const client = (url) => {
    if (url.includes('vocab/rank')) {
      return Promise.resolve({ data: [{ name: 'domain' }, { name: 'species' }] })
    }
    if (url.includes('/children')) {
      const taxonId = url.split('/tree/')[1].split('/children')[0]
      const queue = childPages[taxonId]
      if (!queue || queue.length === 0) {
        return Promise.resolve({ data: { result: [], last: true } })
      }
      return Promise.resolve({ data: queue.length > 1 ? queue.shift() : queue[0] })
    }
    if (url.includes('/tree?')) {
      // Held open so the test controls exactly when each root load resolves.
      let resolve
      const promise = new Promise((r) => { resolve = r })
      pendingRootRequests.push({ url, resolve })
      return promise
    }
    return Promise.resolve({ data: {} })
  }
  return { default: client, publicClient: client, setAuth: () => {} }
})

const ColTree = (await import('src/ColTree/ColTree')).default
const { TreeCacheContext } = await import('src/ColTree/treeCache')
const { ColTreeContext } = await import('src/ColTree/ColTreeContext')

const treeCache = { datasetLoader: { load: () => Promise.resolve(null) } }

const renderTree = (node, onInstance = () => {}) => {
  const root = createRoot(node)
  act(() => {
    root.render(
      <StrictMode>
        <TreeCacheContext.Provider value={treeCache}>
          <ColTreeContext.Provider value={{ showInfo: false }}>
            <ColTree datasetKey="310463" treeRef={onInstance} />
          </ColTreeContext.Provider>
        </TreeCacheContext.Provider>
      </StrictMode>
    )
  })
  return root
}

// ColTreeNode renders <div id={taxon.id}> — duplicate ids mean duplicate keys.
const renderedTaxonIds = (node) =>
  Array.from(node.querySelectorAll('.ant-tree-treenode div[id]')).map((el) => el.id)

describe('ColTree under StrictMode', () => {
  let node
  let root

  beforeEach(() => {
    pendingRootRequests.length = 0
    Object.keys(childPages).forEach((k) => delete childPages[k])
    node = document.createElement('div')
    document.body.appendChild(node)
  })

  afterEach(() => {
    if (root) act(() => { root.unmount() })
    if (node.parentNode) node.parentNode.removeChild(node)
    root = null
  })

  it('renders every root taxon exactly once when the double mount fires two root loads', async () => {
    root = renderTree(node)

    // StrictMode's double mount means componentDidMount ran twice.
    expect(pendingRootRequests.length).toBe(2)
    // Both loads page from the start; neither is a "Load more" continuation.
    pendingRootRequests.forEach((req) => expect(req.url).toContain('offset=0'))

    // Let the first load commit its roots before the second one comes back —
    // that ordering is what used to produce the duplicates.
    await act(async () => { pendingRootRequests[0].resolve(rootPage()) })
    await act(async () => { pendingRootRequests[1].resolve(rootPage()) })

    const ids = renderedTaxonIds(node)
    expect(ids).toEqual(['CRLT8', 'CRRY6', 'CS5HF', '--incertae-sedis--DOMAIN'])
  })

  it('still appends the next page when "Load more" pages in more roots', async () => {
    root = renderTree(node)
    await act(async () => { pendingRootRequests[0].resolve(rootPage()) })
    await act(async () => { pendingRootRequests[1].resolve(rootPage()) })

    const loadMore = Array.from(node.querySelectorAll('button')).find(
      (b) => b.textContent.trim() === 'Load more'
    )
    expect(loadMore).toBeTruthy()

    pendingRootRequests.length = 0
    await act(async () => { loadMore.click() })
    expect(pendingRootRequests.length).toBe(1)
    expect(pendingRootRequests[0].url).toContain('offset=4')

    await act(async () => {
      pendingRootRequests[0].resolve({
        data: {
          total: 5,
          result: [
            { id: 'XTRA1', rank: 'domain', labelHtml: 'Extra', childCount: 0, status: 'accepted' },
          ],
        },
      })
    })

    expect(renderedTaxonIds(node)).toEqual([
      'CRLT8', 'CRRY6', 'CS5HF', '--incertae-sedis--DOMAIN', 'XTRA1',
    ])
  })

  // Every parent with more children than one page gets a synthetic
  // "Load more..." child. Those used to all share the key "__loadMoreBTN__",
  // so two such parents collided in the same tree.
  it('gives each parent its own "Load more" child key', async () => {
    const keyWarnings = []
    const consoleError = vi.spyOn(console, 'error').mockImplementation((...args) => {
      if (String(args[0]).includes("Same 'key' exist in the Tree")) keyWarnings.push(args[0])
    })

    let tree
    root = renderTree(node, (instance) => { tree = instance })
    await act(async () => { pendingRootRequests[0].resolve(rootPage()) })
    await act(async () => { pendingRootRequests[1].resolve(rootPage()) })

    // Two roots whose children are paged (last: false), so both get a
    // "Load more..." node.
    childPages.CRLT8 = [
      { result: [{ id: 'ARCH1', rank: 'phylum', labelHtml: 'Arch1', childCount: 0, status: 'accepted' }], last: false },
    ]
    childPages.CRRY6 = [
      { result: [{ id: 'BACT1', rank: 'phylum', labelHtml: 'Bact1', childCount: 0, status: 'accepted' }], last: false },
    ]

    const [archaea, bacteria] = tree.state.treeData
    await act(async () => { await tree.fetchChildPage(archaea) })
    await act(async () => { await tree.fetchChildPage(bacteria) })
    await act(async () => { tree.setState({ expandedKeys: ['CRLT8', 'CRRY6'] }) })

    const loadMoreKeys = [archaea, bacteria].map((p) => p.children[p.children.length - 1].key)
    expect(loadMoreKeys[0]).not.toBe(loadMoreKeys[1])
    expect(keyWarnings).toEqual([])

    consoleError.mockRestore()
  })

  it('replaces the "Load more" child node when it pages in the next batch', async () => {
    let tree
    root = renderTree(node, (instance) => { tree = instance })
    await act(async () => { pendingRootRequests[0].resolve(rootPage()) })
    await act(async () => { pendingRootRequests[1].resolve(rootPage()) })

    childPages.CRLT8 = [
      { result: [{ id: 'ARCH1', rank: 'phylum', labelHtml: 'Arch1', childCount: 0, status: 'accepted' }], last: false },
      { result: [{ id: 'ARCH2', rank: 'phylum', labelHtml: 'Arch2', childCount: 0, status: 'accepted' }], last: true },
    ]

    const archaea = tree.state.treeData[0]
    await act(async () => { await tree.fetchChildPage(archaea) })
    await act(async () => { tree.setState({ expandedKeys: ['CRLT8'] }) })

    const loadMore = Array.from(node.querySelectorAll('a')).find(
      (a) => a.textContent.trim() === 'Load more...'
    )
    expect(loadMore).toBeTruthy()

    await act(async () => { loadMore.click() })

    // Page two appended, and the "Load more..." node dropped since it was last.
    expect(archaea.children.map((c) => c.key)).toEqual(['ARCH1', 'ARCH2'])
  })
})