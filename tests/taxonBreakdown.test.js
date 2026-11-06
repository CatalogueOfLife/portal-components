import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { vi } from 'vitest'

// The breakdown endpoint answers one object that decides the chart: what the
// nodes count, which ranks form the rings and the total. A node without an id
// is the remainder of its parent. The chart must draw exactly that and fire no
// rank facet search of its own.

const requests = []
let response

vi.mock('src/api/client', () => {
  const client = (url) => {
    requests.push(url)
    return Promise.resolve({ data: response })
  }
  return { default: client, publicClient: client, setAuth: () => {} }
})

let options
vi.mock('highcharts-react-official', () => ({
  default: (props) => {
    options = props.options
    return null
  },
}))

const { default: TaxonBreakdown } = await import('src/Taxon/TaxonBreakdown')

const arthropoda = {
  taxon: { id: 't2', name: 'Arthropoda', rank: 'phylum' },
  counts: { class: 1, order: 2, species: 9 },
  countRank: 'species',
  ranks: ['class', 'order'],
  total: 9,
  children: [
    {
      id: 't3', name: 'Insecta', rank: 'class', count: 7,
      children: [
        { id: 't4', name: 'Coleoptera', rank: 'order', count: 3, children: [] },
        { id: 't5', name: 'Lepidoptera', rank: 'order', count: 4, children: [] },
      ],
    },
    { rank: 'class', count: 2, children: [] },
  ],
}

const render = async (props) => {
  const div = document.createElement('div')
  const root = createRoot(div)
  await act(async () => {
    root.render(
      <TaxonBreakdown
        taxon={{ id: 't2', name: { scientificName: 'Arthropoda', rank: 'phylum' } }}
        datasetKey="3LR"
        dataset={{ title: 'COL' }}
        {...props}
      />
    )
  })
  return { div, root }
}

beforeEach(() => {
  requests.length = 0
  options = null
})

test('draws the two rings of the object with the remainders', async () => {
  response = arthropoda
  const { root } = await render({ level: 2 })
  expect(requests).toEqual([expect.stringContaining('dataset/3LR/taxon/t2/breakdown?level=2')])
  expect(requests.some((u) => u.includes('nameusage/search'))).toBe(false)

  const [inner, outer] = options.series
  expect(inner.name).toBe('Species')
  expect(inner.data.map((d) => [d.name, d.y, d._id])).toEqual([
    ['Insecta', 7, 't3'],
    ['Not assigned class', 2, undefined],
  ])
  // largest first; the outer ring stays aligned: the remainder slice of the inner ring gets a gap
  expect(outer.data.map((d) => [d.name, d.y])).toEqual([
    ['Lepidoptera', 4],
    ['Coleoptera', 3],
    ['Not assigned', 2],
  ])
  act(() => root.unmount())
})

test('one ring and genera as the counted rank', async () => {
  response = {
    ...arthropoda,
    countRank: 'genus',
    ranks: ['class'],
    total: 9,
    children: [{ id: 't3', name: 'Insecta', rank: 'class', count: 9 }],
  }
  const { root } = await render({})
  expect(requests[0]).toContain('breakdown?level=1')
  expect(options.series).toHaveLength(1)
  expect(options.series[0].name).toBe('Genera')
  expect(options.series[0].data.map((d) => [d.name, d.y])).toEqual([['Insecta', 9]])
  act(() => root.unmount())
})

test('renders nothing when there is nothing to chart', async () => {
  response = { taxon: arthropoda.taxon, counts: {}, countRank: null, ranks: [], total: 0, children: [] }
  const { div, root } = await render({})
  expect(options).toBeNull()
  expect(div.innerHTML).toBe('')
  act(() => root.unmount())
})
