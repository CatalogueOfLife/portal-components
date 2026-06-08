import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import MergedDataBadge from 'src/components/MergedDataBadge'

// Minimal fetch Response stand-in (same shape api/client expects).
const makeRes = (data = {}) => ({
  ok: true,
  status: 200,
  url: 'https://api.example/x',
  headers: { get: (h) => (h.toLowerCase() === 'content-type' ? 'application/json' : null) },
  json: async () => data,
  text: async () => JSON.stringify(data),
})

const waitMs = (ms) => new Promise((r) => setTimeout(r, ms))
// Poll inside act() so React commits state updates from the async fetches the
// popover fires when it opens.
const waitFor = async (predicate, { timeout = 5000, interval = 50 } = {}) => {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeout) throw new Error('waitFor: condition not met within timeout')
    await act(async () => { await waitMs(interval) })
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

// A merged usage whose source key lives ONLY on the verbatim record
// (usage.sourceDatasetKey is null) — the Search-view case from portal#296.
const VERBATIM = {
  id: 293017239,
  datasetKey: 312578,
  sourceDatasetKey: 2011,
  sourceId: 'urn:lsid:marinespecies.org:taxname:1555585',
  sourceEntity: 'name usage',
  issues: [],
}
const SOURCE_DATASET = { key: 2011, alias: 'WoRMS', title: 'World Register of Marine Species' }

describe('MergedDataBadge (XR icon) source resolution', () => {
  let node
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      const u = String(url)
      if (u.includes('/verbatimsource/')) return Promise.resolve(makeRes(VERBATIM))
      if (/\/dataset\/2011(?:\?|$)/.test(u)) return Promise.resolve(makeRes(SOURCE_DATASET))
      return Promise.resolve(makeRes({}))
    }))
  })
  afterEach(() => {
    unmount(node)
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows the source dataset title (not the raw entity) and links the sourceId to CLB when only verbatimSourceKey is given', async () => {
    node = mountIn(
      <MergedDataBadge datasetKey="312578" verbatimSourceKey="293017239" />
    )
    const tag = node.querySelector('.ant-tag')
    expect(tag).toBeTruthy()
    await act(async () => { tag.click() })
    // Popover opened (every branch renders the "Source:" label).
    await waitFor(() => document.body.textContent.includes('Source:'))
    // The source dataset title is resolved from the verbatim record's sourceDatasetKey...
    await waitFor(() => document.body.textContent.includes('World Register of Marine Species'))
    // ...and the raw "name usage" entity name is no longer used as the source label.
    expect(document.body.textContent).not.toContain('name usage')
    // The sourceId is linked to ChecklistBank.
    const clbLink = Array.from(document.querySelectorAll('a')).find(
      (a) =>
        (a.getAttribute('href') || '').includes('checklistbank.org/dataset/2011/') &&
        (a.getAttribute('href') || '').includes('marinespecies.org')
    )
    expect(clbLink).toBeTruthy()
  })
})
