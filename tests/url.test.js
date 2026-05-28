import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { withRouting } from '../src/url'

// Capture-leaf: renders nothing, but exposes the props it received via a
// shared object so a test can poke the imperative navigation callbacks.
const captureProps = () => {
  const captured = {}
  const Leaf = (props) => {
    useEffect(() => { Object.assign(captured, props) }, [props])
    return null
  }
  return { Leaf, captured }
}

const mount = (element) => {
  const node = document.createElement('div')
  document.body.appendChild(node)
  const root = createRoot(node)
  act(() => { root.render(element) })
  return { node, root }
}

const teardown = ({ node, root }) => {
  act(() => { root.unmount() })
  node.parentNode?.removeChild(node)
}

// jsdom marks location.assign as non-configurable, so it can't be spied on
// directly. window.location itself is replaceable, so swap in a stub for
// each test and restore afterwards.
const stubLocation = (path = '/', search = '', hash = '') => {
  const stub = {
    pathname: path,
    search,
    hash,
    href: `http://localhost${path}${search}${hash}`,
    origin: 'http://localhost',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  }
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: stub,
  })
  return stub
}

describe('withRouting navigation option', () => {
  const paths = {
    taxon:  '/data/taxon/',
    tree:   '/data/browse',
    search: '/data/search',
    source: '/data/dataset/',
  }

  let originalLocation, pushStateSpy

  beforeEach(() => {
    originalLocation = window.location
    pushStateSpy = vi.spyOn(window.history, 'pushState').mockImplementation(() => {})
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
    pushStateSpy.mockRestore()
  })

  it('defaults to navigation:"spa" (pushState) for backwards compatibility', () => {
    stubLocation('/data/taxon/')
    const { Leaf, captured } = captureProps()
    const Wrapped = withRouting(Leaf, { kind: 'taxon', mode: 'path', paths })
    const mounted = mount(<Wrapped />)

    act(() => { captured.onNavigateToTaxon('N') })

    expect(pushStateSpy).toHaveBeenCalledTimes(1)
    expect(pushStateSpy.mock.calls[0][2]).toBe('/data/taxon/N')
    expect(window.location.assign).not.toHaveBeenCalled()

    teardown(mounted)
  })

  it('navigation:"reload" calls window.location.assign instead of pushState', () => {
    const loc = stubLocation('/data/taxon/')
    const { Leaf, captured } = captureProps()
    const Wrapped = withRouting(Leaf, {
      kind: 'taxon', mode: 'path', navigation: 'reload', paths,
    })
    const mounted = mount(<Wrapped />)

    act(() => { captured.onNavigateToTaxon('N') })

    expect(loc.assign).toHaveBeenCalledTimes(1)
    expect(loc.assign).toHaveBeenCalledWith('/data/taxon/N')
    expect(pushStateSpy).not.toHaveBeenCalled()

    teardown(mounted)
  })

  it('navigation:"reload" reuses the same URL hrefForX would emit', () => {
    const loc = stubLocation('/data/taxon/')
    const { Leaf, captured } = captureProps()
    const Wrapped = withRouting(Leaf, {
      kind: 'taxon', mode: 'path', navigation: 'reload', paths,
    })
    const mounted = mount(<Wrapped />)

    const filters = { TAXON_ID: '623QT', rank: 'genus', status: ['accepted', 'provisionally accepted'] }
    const expected = captured.hrefForSearch(filters)
    expect(expected).toBe('/data/search?TAXON_ID=623QT&rank=genus&status=accepted&status=provisionally%20accepted')

    act(() => { captured.onNavigateToSearch(filters) })
    expect(loc.assign).toHaveBeenCalledWith(expected)

    teardown(mounted)
  })

  it('in-component state callbacks always use pushState, even with navigation:"reload"', () => {
    const loc = stubLocation('/data/browse')
    const { Leaf, captured } = captureProps()
    const Wrapped = withRouting(Leaf, {
      kind: 'tree', mode: 'path', navigation: 'reload', paths,
    })
    const mounted = mount(<Wrapped />)

    act(() => { captured.onExpandedTaxonKeyChange('N') })

    expect(pushStateSpy).toHaveBeenCalledTimes(1)
    expect(pushStateSpy.mock.calls[0][2]).toBe('/data/browse?taxonKey=N')
    expect(loc.assign).not.toHaveBeenCalled()

    teardown(mounted)
  })

  it('navigation:"reload" with hash mode prepends # like hrefFor does', () => {
    const loc = stubLocation('/', '', '#/data/taxon/')
    const { Leaf, captured } = captureProps()
    const Wrapped = withRouting(Leaf, {
      kind: 'taxon', mode: 'hash', navigation: 'reload', paths,
    })
    const mounted = mount(<Wrapped />)

    act(() => { captured.onNavigateToTaxon('N') })

    expect(loc.assign).toHaveBeenCalledWith('#/data/taxon/N')

    teardown(mounted)
  })
})
