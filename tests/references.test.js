import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import References from 'src/Taxon/References'
import ReferencePopover from 'src/Taxon/ReferencePopover'
import { referenceHref } from 'src/components/ReferenceLink'

const waitMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const waitFor = async (predicate, { timeout = 8000, interval = 50 } = {}) => {
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

describe('References', () => {
  let node
  afterEach(() => { unmount(node) })

  // The link of a parsed reference (e.g. a BHL page) lives in csl.URL, not in
  // the citation string, so linkifying the citation alone drops it.
  it('links csl.URL when the citation does not contain it', () => {
    const url = 'https://www.biodiversitylibrary.org/page/33216443'
    node = mountIn(
      <References
        data={{
          r1: {
            id: 'r1',
            citation: 'Horn, W. De novis Cicindelidarum speciebus. (1900).',
            csl: { URL: url },
          },
        }}
      />
    )
    const links = [...node.querySelectorAll('a')].filter((a) => a.getAttribute('href') === url)
    expect(links.length).toBe(1)
    expect(links[0].getAttribute('target')).toBe('_blank')
  })

  it('does not add a second link when the citation already contains the URL', () => {
    const url = 'https://example.org/ref'
    node = mountIn(
      <References
        data={{ r1: { id: 'r1', citation: `Some ref. ${url}`, csl: { URL: url } } }}
      />
    )
    const links = [...node.querySelectorAll('a')].filter((a) => a.getAttribute('href') === url)
    expect(links.length).toBe(1)
  })
})

describe('referenceHref', () => {
  it('prefers csl.URL', () => {
    expect(referenceHref({ csl: { URL: 'https://a.org/x', DOI: '10.1/x' } })).toBe('https://a.org/x')
  })

  it('falls back to a doi.org link, normalising DOI prefixes', () => {
    expect(referenceHref({ csl: { DOI: '10.1234/abc' } })).toBe('https://doi.org/10.1234/abc')
    expect(referenceHref({ csl: { DOI: 'doi:10.1234/abc' } })).toBe('https://doi.org/10.1234/abc')
    expect(referenceHref({ csl: { DOI: 'https://dx.doi.org/10.1234/abc' } })).toBe('https://doi.org/10.1234/abc')
  })

  it('returns nothing without URL or DOI', () => {
    expect(referenceHref({ citation: 'x' })).toBeUndefined()
    expect(referenceHref(undefined)).toBeUndefined()
  })
})

describe('References DOI fallback', () => {
  let node
  afterEach(() => { unmount(node) })

  it('links the DOI when there is no URL', () => {
    node = mountIn(
      <References data={{ r1: { id: 'r1', citation: 'A ref.', csl: { DOI: '10.1234/abc' } } }} />
    )
    expect(node.querySelector('a[href="https://doi.org/10.1234/abc"]')).not.toBeNull()
  })
})

describe('ReferencePopover link', () => {
  let node
  afterEach(() => { unmount(node) })

  it('shows the reference link in the popover', async () => {
    const url = 'https://www.biodiversitylibrary.org/page/33216443'
    node = mountIn(
      <ReferencePopover
        datasetKey="3LXR"
        referenceId="r1"
        references={{ r1: { id: 'r1', citation: 'Horn, W. (1900).', csl: { URL: url } } }}
        trigger="click"
      />
    )
    act(() => { node.querySelector('.anticon').dispatchEvent(new MouseEvent('click', { bubbles: true })) })
    await waitFor(() => node.querySelector(`a[href="${url}"]`))
    expect(node.querySelector(`a[href="${url}"]`).getAttribute('target')).toBe('_blank')
  })
})
