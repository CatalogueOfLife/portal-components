import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { configure, BibTex } from 'src/'
import ColBrowser from 'src/umd'
import config from 'src/config'

const DATASET_KEY = '3LXR'

const hrefOf = (component) => {
  const node = document.createElement('div')
  document.body.appendChild(node)
  const root = createRoot(node)
  act(() => { root.render(component) })
  const href = node.querySelector('a').getAttribute('href')
  act(() => { root.unmount() })
  node.remove()
  return href
}

describe('configure', () => {
  let original

  beforeEach(() => { original = { ...config } })
  afterEach(() => { configure(original) })

  it('points API requests at the configured base URL', () => {
    configure({ dataApi: 'https://api.dev.checklistbank.org/' })

    expect(hrefOf(<BibTex datasetKey={DATASET_KEY} />)).toBe(
      `https://api.dev.checklistbank.org/dataset/${DATASET_KEY}.bib`
    )
  })

  it('adds the missing trailing slash to dataApi', () => {
    configure({ dataApi: 'https://api.dev.checklistbank.org' })

    expect(hrefOf(<BibTex datasetKey={DATASET_KEY} />)).toBe(
      `https://api.dev.checklistbank.org/dataset/${DATASET_KEY}.bib`
    )
  })

  it('strips a trailing slash from the portal and GBIF base URLs', () => {
    configure({ gbifApi: 'https://api.gbif.org/' })

    expect(config.gbifApi).toBe('https://api.gbif.org')
  })

  it('leaves untouched keys at their previous value', () => {
    configure({ dataApi: 'https://api.dev.checklistbank.org/' })

    expect(config.gbifApi).toBe(original.gbifApi)
    expect(config.clbPortal).toBe(original.clbPortal)
  })

  it('is exposed on the UMD global', () => {
    expect(typeof ColBrowser.configure).toBe('function')
  })
})
