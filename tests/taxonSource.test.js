import { describe, it, expect, afterEach } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { Taxon } from 'src/'

const DATASET_KEY = '310463'
const TAXON_KEY = '3DXV3'        // Felis catus
const SOURCE_DATASET_KEY = '2144' // its source dataset
const SOURCE_ID = '183798'        // its id within that source dataset

const waitMs = (ms) => new Promise((r) => setTimeout(r, ms))
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
  if (node && node.__root) act(() => { node.__root.unmount() })
  if (node && node.parentNode) node.parentNode.removeChild(node)
}

describe('Taxon Source section', () => {
  let node
  afterEach(() => { unmount(node) })

  it('links the source dataset alias (not the bare source id) to the source record in CLB', async () => {
    node = mountIn(
      <Taxon
        datasetKey={DATASET_KEY}
        taxonKey={TAXON_KEY}
        hrefForTaxon={(id) => `/data/taxon/${id}`}
        hrefForSource={(id) => `/data/source/${id}`}
      />
    )
    const clbHref = `https://www.checklistbank.org/dataset/${SOURCE_DATASET_KEY}/taxon/${SOURCE_ID}`
    await waitFor(() =>
      Array.from(node.querySelectorAll('a')).some(
        (a) => a.getAttribute('href') === clbHref
      )
    )
    const clbLink = Array.from(node.querySelectorAll('a')).find(
      (a) => a.getAttribute('href') === clbHref
    )
    // The CLB link's text is the dataset alias, not the raw source id.
    expect(clbLink.textContent.trim().length).toBeGreaterThan(0)
    expect(clbLink.textContent.trim()).not.toBe(SOURCE_ID)
    // The dataset title still links to the portal source page.
    const sourceLink = Array.from(node.querySelectorAll('a')).find(
      (a) => a.getAttribute('href') === `/data/source/${SOURCE_DATASET_KEY}`
    )
    expect(sourceLink).toBeTruthy()
  })
})
