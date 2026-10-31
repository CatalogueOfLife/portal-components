import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { vi } from 'vitest'

// Loading a page with a Tree on it must leave the host page where it is: opening
// the default root used to scroll the window to it, and the search box always
// took the focus. Only a taxon that was asked for is worth scrolling to.

const taxon = (id) => ({ id, rank: 'domain', labelHtml: id, childCount: 0, status: 'accepted' })

vi.mock('src/api/client', () => {
  const client = (url) => {
    if (url.includes('vocab/rank')) return Promise.resolve({ data: [{ name: 'domain' }] })
    if (url.includes('/children')) return Promise.resolve({ data: { result: [], last: true } })
    if (url.includes('/tree?')) {
      return Promise.resolve({ data: { total: 2, result: [taxon('CRLT8'), taxon('CS5HF')] } })
    }
    // The classification of the taxon to expand to, here simply the root itself.
    const match = url.match(/\/tree\/([^?]+)\?/)
    if (match) return Promise.resolve({ data: [taxon(match[1])] })
    return Promise.resolve({ data: {} })
  }
  return { default: client, publicClient: client, setAuth: () => {} }
})

const Tree = (await import('src/ColTree')).default

describe('Tree on page load', () => {
  let node
  let root
  let scrollIntoView

  // Everything the load does, including the 100ms delay before the tree scrolls.
  const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 200)))

  const render = async (props) => {
    await act(async () => {
      root = createRoot(node)
      root.render(<Tree datasetKey="310463" {...props} />)
    })
    await settle()
  }

  beforeEach(() => {
    // jsdom has no scrollIntoView.
    scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    node = document.createElement('div')
    document.body.appendChild(node)
  })

  afterEach(() => {
    act(() => root.unmount())
    node.remove()
    delete Element.prototype.scrollIntoView
  })

  it('opens defaultTaxonKey without scrolling the page', async () => {
    await render({ defaultTaxonKey: 'CS5HF' })

    expect(node.querySelector('[id="CS5HF"]')).toBeTruthy()
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('scrolls to an explicit expandedTaxonKey', async () => {
    await render({ expandedTaxonKey: 'CS5HF' })

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.contexts[0].id).toBe('CS5HF')
  })

  it('scrolls to expandedTaxonKey when a defaultTaxonKey is set too', async () => {
    await render({ defaultTaxonKey: 'CRLT8', expandedTaxonKey: 'CS5HF' })

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.contexts[0].id).toBe('CS5HF')
  })

  it('focuses the search box by default', async () => {
    await render({})

    expect(document.activeElement.tagName).toBe('INPUT')
  })

  it('leaves the focus alone with autoFocus={false}', async () => {
    await render({ autoFocus: false })

    expect(node.querySelector('input')).toBeTruthy()
    expect(document.activeElement).toBe(document.body)
  })
})
