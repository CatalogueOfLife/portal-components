import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import IdentifierList, { parseIdentifier } from 'src/components/IdentifierList'
import { getIdentifierScopeVocab } from 'src/api/enumeration'
import config from 'src/config'

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

// Shape of the /vocab/identifier-scope entries, keyed by scope.
const VOCAB = {
  wfo: {
    scope: 'wfo',
    title: 'World Flora Online',
    resolver: 'https://www.worldfloraonline.org/taxon/{id}',
  },
  silva: { scope: 'silva', title: 'SILVA' },
}

describe('parseIdentifier', () => {
  it('links a scope with a resolver', () => {
    expect(parseIdentifier('wfo:wfo-0000123', VOCAB)).toEqual({
      scope: 'wfo',
      value: 'wfo-0000123',
      title: 'World Flora Online',
      href: 'https://www.worldfloraonline.org/taxon/wfo-0000123',
    })
  })

  it('keeps a known scope without resolver unlinked', () => {
    expect(parseIdentifier('silva:AB123', VOCAB)).toEqual({
      scope: 'silva',
      value: 'AB123',
      title: 'SILVA',
      href: undefined,
    })
  })

  it('links clb<datasetKey> scopes to the ChecklistBank name usage', () => {
    expect(parseIdentifier('clb1010:X Y', VOCAB)).toEqual({
      scope: 'clb',
      value: 'X Y',
      title: 'ChecklistBank dataset 1010',
      href: `${config.clbPortal}/dataset/1010/nameusage/X%20Y`,
    })
  })

  it('treats identifiers without a scope prefix as a bare value', () => {
    expect(parseIdentifier('12345', VOCAB)).toEqual({ value: '12345' })
    expect(parseIdentifier(':12345', VOCAB)).toEqual({ value: ':12345' })
  })

  it('falls back to the raw scope when the vocabulary is not loaded', () => {
    expect(parseIdentifier('wfo:wfo-1', null)).toEqual({
      scope: 'wfo',
      value: 'wfo-1',
      title: 'wfo',
      href: undefined,
    })
  })
})

describe('IdentifierList', () => {
  let node
  afterEach(() => { unmount(node) })

  it('renders each identifier as a chip, linking resolvable ones', async () => {
    const vocab = await getIdentifierScopeVocab()
    const scope = Object.values(vocab).find((e) => e.resolver).scope
    node = mountIn(<IdentifierList identifiers={[`${scope}:42`, 'plain']} />)
    await waitFor(() => node.querySelector('a.col-identifier'))
    const chips = node.querySelectorAll('.col-identifier')
    expect(chips.length).toBe(2)
    const link = node.querySelector('a.col-identifier')
    expect(link.getAttribute('href')).toBe(vocab[scope].resolver.replace('{id}', '42'))
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.querySelector('.col-identifier-scope').textContent).toBe(scope)
    expect(link.querySelector('.col-identifier-value').textContent).toBe('42')
  })
})
