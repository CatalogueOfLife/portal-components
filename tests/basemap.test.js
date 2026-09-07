import { resolveBasemapStyle } from 'src/Taxon/DistributionsMap/basemap'
import { configure } from 'src/'
import config from 'src/config'

const POSITRON = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

describe('resolveBasemapStyle', () => {
  let original

  beforeEach(() => { original = { ...config } })
  afterEach(() => { configure(original) })

  it('defaults to the keyless CARTO Positron style', () => {
    expect(resolveBasemapStyle()).toBe(POSITRON)
  })

  it('follows the global configure() default', () => {
    const keyed = `${POSITRON}?api_key=abc123`
    configure({ basemapStyle: keyed })

    expect(resolveBasemapStyle()).toBe(keyed)
  })

  it('prefers the per-instance prop over the configured default', () => {
    configure({ basemapStyle: `${POSITRON}?api_key=abc123` })
    const maptiler = 'https://api.maptiler.com/maps/basic-v2/style.json?key=xyz'

    expect(resolveBasemapStyle(maptiler)).toBe(maptiler)
  })

  it('accepts an inline style object as the prop', () => {
    const style = { version: 8, sources: {}, layers: [] }

    expect(resolveBasemapStyle(style)).toBe(style)
  })

  it('accepts an inline style object as the configured default', () => {
    const style = { version: 8, sources: {}, layers: [] }
    configure({ basemapStyle: style })

    expect(resolveBasemapStyle()).toBe(style)
  })
})
