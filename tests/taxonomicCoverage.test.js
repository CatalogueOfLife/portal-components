import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { vi } from 'vitest'

// Taxonomic coverage lists a source's sectors and resolves each one to the
// taxon it contributes, via /nameusage/search. The stubbed client below answers
// that search from a small index the way the real ES search does: TAXON_ID
// matches the taxon and its descendants, SECTOR_KEY / rank filter exactly,
// type=EXACT matches the whole name and the default type any name containing
// the term. Hits come back in index order.

const usages = [
  { id: 'CS5HF', name: 'Eukaryota', rank: 'domain', parent: null, sectorKey: null },
  { id: 'N', name: 'Animalia', rank: 'kingdom', parent: 'CS5HF', sectorKey: null },
  { id: 'P', name: 'Plantae', rank: 'kingdom', parent: 'CS5HF', sectorKey: null },
  { id: 'C', name: 'Chromista', rank: 'kingdom', parent: 'CS5HF', sectorKey: null },
  // An insect genus from another source, homonym of the ITIS phylum below. It
  // is indexed first, so a fuzzy search under Animalia returns it first.
  { id: 'ARTH', name: 'Arthropoda', rank: 'phylum', parent: 'N', sectorKey: null },
  { id: 'COR', name: 'Coreidae', rank: 'family', parent: 'ARTH', sectorKey: 900 },
  { id: '8NKD3', name: 'Acanthocephala', rank: 'genus', parent: 'COR', sectorKey: 900 },
  // ITIS sector 794 attaches the phylum Acanthocephala to Animalia.
  { id: 'ACPH', name: 'Acanthocephala', rank: 'phylum', parent: 'N', sectorKey: 794 },
  { id: 'NEO', name: 'Neoacanthocephala', rank: 'order', parent: 'ACPH', sectorKey: 794 },
  // ITIS sector 801 attaches the genus Navicula, which holds a same-named
  // subgenus - indexed before the genus.
  { id: 'D6Z', name: 'Naviculaceae', rank: 'family', parent: 'C', sectorKey: null },
  { id: 'NAVS', name: 'Navicula', rank: 'subgenus', parent: 'NAVG', sectorKey: 801 },
  { id: 'NAVG', name: 'Navicula', rank: 'genus', parent: 'D6Z', sectorKey: 801 },
  // ITIS merge sector 2249 adds families below the existing kingdom Plantae.
  { id: 'BOL', name: 'Bolbocoleaceae', rank: 'family', parent: 'P', sectorKey: 2249 },
  // A union sector unites the children of its subject below Chromista.
  { id: 'CHAE', name: 'Chaetocerotaceae', rank: 'family', parent: 'C', sectorKey: 960 },
]
const byId = Object.fromEntries(usages.map((u) => [u.id, u]))

const lineage = (u) => {
  const chain = []
  for (let x = u; x; x = byId[x.parent]) chain.unshift(x)
  return chain
}

const sectors = [
  {
    id: 794, datasetKey: 316276, subjectDatasetKey: 2144, mode: 'attach',
    subject: { id: '64238', name: 'Acanthocephala' },
    target: { id: 'N', name: 'Animalia', rank: 'kingdom' },
  },
  {
    id: 801, datasetKey: 316276, subjectDatasetKey: 2144, mode: 'attach',
    subject: { id: '5XXG', name: 'Navicula' },
    target: { id: 'D6Z', name: 'Naviculaceae', rank: 'family' },
  },
  {
    id: 2249, datasetKey: 316276, subjectDatasetKey: 2144, mode: 'merge',
    subject: { id: '202422', name: 'Plantae', rank: 'kingdom' },
    target: { id: 'P', name: 'Plantae', rank: 'kingdom' },
  },
  {
    id: 960, datasetKey: 316276, subjectDatasetKey: 2144, mode: 'union',
    subject: { id: '630590', name: 'Bacillariophyta', rank: 'phylum' },
    target: { id: 'C', name: 'Chromista', rank: 'kingdom' },
  },
  {
    // A target that no longer carries an id.
    id: 950, datasetKey: 316276, subjectDatasetKey: 2144, mode: 'attach',
    subject: { id: '1047', name: 'Cryptosporidium', rank: 'genus' },
    target: { name: 'Cryptosporidiidae' },
  },
]

const requests = []

const search = (params) => {
  const q = params.get('q')
  const exact = (params.get('type') || '').toUpperCase() === 'EXACT'
  const hits = usages.filter((u) => {
    if (params.has('TAXON_ID') && !lineage(u).some((a) => a.id === params.get('TAXON_ID'))) return false
    if (params.has('SECTOR_KEY') && String(u.sectorKey) !== params.get('SECTOR_KEY')) return false
    if (params.has('rank') && u.rank !== params.get('rank')) return false
    if (q) {
      const name = u.name.toLowerCase()
      if (exact ? name !== q.toLowerCase() : !name.includes(q.toLowerCase())) return false
    }
    return true
  })
  return {
    offset: 0,
    limit: 10,
    total: hits.length,
    result: hits.map((u) => ({
      id: u.id,
      usage: {
        id: u.id,
        name: { scientificName: u.name, rank: u.rank },
        status: 'accepted',
        sectorKey: u.sectorKey,
      },
      classification: lineage(u).map((a) => ({ id: a.id, name: a.name, rank: a.rank })),
    })),
  }
}

vi.mock('src/api/client', () => {
  const client = (url) => {
    requests.push(url)
    const u = new URL(url)
    if (u.pathname.endsWith('/sector')) {
      return Promise.resolve({ data: { offset: 0, limit: 1000, total: sectors.length, result: sectors } })
    }
    if (u.pathname.endsWith('/nameusage/search')) {
      return Promise.resolve({ data: search(u.searchParams) })
    }
    return Promise.resolve({ data: {} })
  }
  return { default: client, publicClient: client, setAuth: () => {} }
})

const TaxonomicCoverage = (await import('src/SourceDataset/TaxonomicCoverage')).default

const renderCoverage = async (node) => {
  const root = createRoot(node)
  act(() => {
    root.render(<TaxonomicCoverage dataset={{ key: 2144 }} datasetKey="316276" />)
  })
  // every stubbed request resolves immediately; let the chain settle
  for (let i = 0; i < 50 && node.querySelector('.ant-skeleton'); i++) {
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
  }
  expect(node.querySelector('.ant-skeleton')).toBeNull()
  return root
}

// One line per classification path: "<path>: <taxon>, <taxon>".
const lines = (node) => Array.from(node.children).map((div) => div.textContent.trim())
const entry = (node, name) =>
  Array.from(node.querySelectorAll('span')).find((s) => s.children.length === 0 && s.textContent === name)
const isXrTag = (el) => el.matches('.ant-tag') && el.textContent.trim() === 'XR'
const xrTags = (node) => Array.from(node.querySelectorAll('.ant-tag')).filter(isXrTag)
// Whether the element right before a taxon is (or wraps) an XR tag.
const badged = (el) => {
  const prev = el.previousElementSibling
  return !!prev && (isXrTag(prev) || Array.from(prev.querySelectorAll('.ant-tag')).some(isXrTag))
}

describe('TaxonomicCoverage', () => {
  let node
  let root

  beforeEach(() => {
    requests.length = 0
    node = document.createElement('div')
    document.body.appendChild(node)
  })

  afterEach(() => {
    if (root) act(() => { root.unmount() })
    if (node.parentNode) node.parentNode.removeChild(node)
    root = null
  })

  it('marks the taxa a merge sector contributes as XR, and only those', async () => {
    root = await renderCoverage(node)

    expect(xrTags(node)).toHaveLength(1)
    const plantae = entry(node, 'Plantae')
    expect(plantae).toBeTruthy()
    expect(badged(plantae)).toBe(true)
    expect(badged(entry(node, 'Acanthocephala'))).toBe(false)
  })

  it('represents a union sector by its target, which the union leaves in place, without an XR tag', async () => {
    root = await renderCoverage(node)

    const chromista = entry(node, 'Chromista')
    expect(chromista).toBeTruthy()
    expect(badged(chromista)).toBe(false)
  })

  it('resolves an attach sector to its own subject, not a homonym from another sector under the target', async () => {
    root = await renderCoverage(node)

    expect(lines(node)).toContain('Animalia: Acanthocephala')
    expect(lines(node).join('\n')).not.toContain('Coreidae')
  })

  it('picks the sector root directly below the target when the sector holds a same-named taxon', async () => {
    root = await renderCoverage(node)

    expect(lines(node)).toContain('Chromista > Naviculaceae: Navicula')
    expect(lines(node).join('\n')).not.toContain('Naviculaceae > Navicula:')
  })

  it('does not search for a sector whose target has no id', async () => {
    root = await renderCoverage(node)

    const searches = requests.filter((url) => url.includes('/nameusage/search'))
    expect(searches.length).toBeGreaterThan(0)
    expect(searches.filter((url) => url.includes('Cryptosporidium'))).toEqual([])
  })
})
