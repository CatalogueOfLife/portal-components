import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import NomStatus, { nomStatusLabel } from 'src/components/NomStatus'
import { getNomStatusVocab } from 'src/api/enumeration'

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

// Shape of the /vocab/nomstatus terms we care about.
const VOCAB = {
  acceptable: {
    name: 'acceptable',
    botanical: 'nomen legitimum',
    zoological: 'potentially valid',
  },
  established: {
    name: 'established',
    botanical: 'nomen validum',
    zoological: 'available',
  },
}

describe('nomStatusLabel', () => {
  it('renders the botanical wording for a botanical name', () => {
    expect(nomStatusLabel(VOCAB, 'acceptable', 'botanical')).toBe('nomen legitimum')
  })

  it('renders the zoological wording for a zoological name', () => {
    expect(nomStatusLabel(VOCAB, 'acceptable', 'zoological')).toBe('potentially valid')
  })

  // Regression guard: the old lookup used a comma expression, so the code was
  // discarded and every name got the zoological label.
  it('distinguishes the two codes for the same status', () => {
    expect(nomStatusLabel(VOCAB, 'established', 'botanical'))
      .not.toBe(nomStatusLabel(VOCAB, 'established', 'zoological'))
  })

  it('falls back to the zoological wording for codes without their own label', () => {
    expect(nomStatusLabel(VOCAB, 'acceptable', 'bacterial')).toBe('potentially valid')
    expect(nomStatusLabel(VOCAB, 'acceptable', undefined)).toBe('potentially valid')
  })

  it('never leaks a non-code vocabulary key as a label', () => {
    expect(nomStatusLabel(VOCAB, 'acceptable', 'name')).toBe('potentially valid')
  })

  it('shows the bare status while the vocabulary is unavailable', () => {
    expect(nomStatusLabel(null, 'acceptable', 'botanical')).toBe('acceptable')
    expect(nomStatusLabel(VOCAB, 'brand new status', 'botanical')).toBe('brand new status')
  })

  it('renders nothing without a status', () => {
    expect(nomStatusLabel(VOCAB, null, 'botanical')).toBe('')
  })
})

describe('NomStatus component', () => {
  let node
  afterEach(() => { unmount(node) })

  it('resolves the label from the live vocabulary', async () => {
    node = mountIn(<NomStatus nomStatus="acceptable" code="botanical" brackets />)
    await waitFor(() => node.innerHTML.includes('nomen legitimum'))
    expect(node.innerHTML).toContain('(nomen legitimum)')
  })

  it('renders nothing when the name has no nomenclatural status', () => {
    node = mountIn(<NomStatus nomStatus={null} code="zoological" brackets />)
    expect(node.innerHTML).toBe('')
  })
})

describe('getNomStatusVocab', () => {
  it('carries a botanical and a zoological label per term and is shared', async () => {
    const vocab = await getNomStatusVocab()
    expect(vocab.acceptable.botanical).toBe('nomen legitimum')
    expect(vocab.acceptable.zoological).toBe('potentially valid')
    // Cached: the second call resolves to the very same object.
    expect(await getNomStatusVocab()).toBe(vocab)
  })
})
