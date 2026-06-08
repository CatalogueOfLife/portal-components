import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { Taxon } from 'src/'

const DATASET_KEY = '310463'
const SYNONYM_KEY = '5HBYN'   // Felis catus domestica -> accepted Felis catus
const ACCEPTED_KEY = '3DXV3'  // Felis catus

const waitMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
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

describe('Synonym page', () => {
  let node
  afterEach(() => { unmount(node) })

  it('renders the synonym usage itself instead of redirecting to the accepted taxon', async () => {
    node = mountIn(
      <Taxon
        datasetKey={DATASET_KEY}
        taxonKey={SYNONYM_KEY}
        hrefForTaxon={(id) => `/data/taxon/${id}`}
        hrefForSource={(id) => `/data/source/${id}`}
      />
    )
    // The synonym's own name appears as the page heading (no redirect/blank).
    await waitFor(() => node.innerHTML.includes('Felis catus domestica'))
    expect(node.innerHTML).toContain('Felis catus domestica')
  })

  // Regression guard: a non-existent key must still land on Page404 once the
  // redirect is removed (the new /info 404 handler sets status: 404 directly).
  it('renders the 404 page for a non-existent key (no redirect)', async () => {
    node = mountIn(
      <Taxon
        datasetKey={DATASET_KEY}
        taxonKey="ZZZZZ9"
        hrefForTaxon={(id) => `/data/taxon/${id}`}
        hrefForSource={(id) => `/data/source/${id}`}
      />
    )
    await waitFor(() => node.innerHTML.includes('Sorry, this page does not exist'))
    expect(node.innerHTML).toContain('Sorry, this page does not exist')
  })

  it('shows a "synonym of" banner linking to the accepted taxon and hides the synonyms list', async () => {
    node = mountIn(
      <Taxon
        datasetKey={DATASET_KEY}
        taxonKey={SYNONYM_KEY}
        hrefForTaxon={(id) => `/data/taxon/${id}`}
        hrefForSource={(id) => `/data/source/${id}`}
      />
    )
    await waitFor(() => node.innerHTML.includes('Felis catus domestica'))
    // Banner links to the accepted taxon page.
    const acceptedLink = Array.from(node.querySelectorAll('a')).find(
      (a) => a.getAttribute('href') === `/data/taxon/${ACCEPTED_KEY}`
    )
    expect(acceptedLink).toBeTruthy()
    // The "synonym of" wording is present.
    expect(node.innerHTML).toContain('synonym of')
    // A synonym page must not render the accepted page's synonyms list.
    expect(node.innerHTML).not.toContain('Synonyms and combinations')
  })
})

describe('Accepted taxon synonym links', () => {
  let node
  afterEach(() => { unmount(node) })

  it('links each synonym entry to its own synonym page', async () => {
    node = mountIn(
      <Taxon
        datasetKey={DATASET_KEY}
        taxonKey={ACCEPTED_KEY}
        hrefForTaxon={(id) => `/data/taxon/${id}`}
        hrefForSource={(id) => `/data/source/${id}`}
      />
    )
    await waitFor(() => node.innerHTML.includes('Synonyms and combinations'))
    const synLink = Array.from(node.querySelectorAll('a')).find(
      (a) => a.getAttribute('href') === `/data/taxon/${SYNONYM_KEY}`
    )
    expect(synLink).toBeTruthy()
  })
})
