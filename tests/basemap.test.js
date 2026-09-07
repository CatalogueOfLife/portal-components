import { cartoTransformRequest, resolveBasemapStyle } from 'src/Taxon/DistributionsMap/basemap'
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

describe('cartoTransformRequest', () => {
  let original

  beforeEach(() => { original = { ...config } })
  afterEach(() => { configure(original) })

  const GLYPHS = 'https://tiles.basemaps.cartocdn.com/fonts/Open%20Sans%20Regular/0-255.pbf'
  const TILE = 'https://tiles-a.basemaps.cartocdn.com/vectortiles/carto.streets/v1/4/8/5.mvt'

  it('is undefined with no key, so MapLibre keeps its default', () => {
    expect(cartoTransformRequest()).toBeUndefined()
    expect(cartoTransformRequest('')).toBeUndefined()
  })

  it('follows the global configure() key', () => {
    configure({ cartoKey: 'abc123' })

    expect(cartoTransformRequest()(TILE).url).toBe(`${TILE}?key=abc123`)
  })

  it('keys the style, tiles, glyphs and sprites alike', () => {
    const t = cartoTransformRequest('abc123')

    expect(t(POSITRON).url).toBe(`${POSITRON}?key=abc123`)
    expect(t(TILE).url).toBe(`${TILE}?key=abc123`)
    expect(t(GLYPHS).url).toBe(`${GLYPHS}?key=abc123`)
  })

  it('leaves non-CARTO hosts untouched', () => {
    const t = cartoTransformRequest('abc123')
    const gbif = 'https://api.gbif.org/v2/map/occurrence/density/4/8/5@1x.png?srs=EPSG%3A3857'

    expect(t(gbif).url).toBe(gbif)
    expect(t('https://api.checklistbank.org/dataset/3').url).toBe(
      'https://api.checklistbank.org/dataset/3'
    )
  })

  it('does not match a lookalike host', () => {
    const t = cartoTransformRequest('abc123')
    const evil = 'https://cartocdn.com.example.test/tiles/4/8/5.png'

    expect(t(evil).url).toBe(evil)
  })

  it('preserves an existing query string', () => {
    const t = cartoTransformRequest('abc123')

    expect(t(`${TILE}?v=2`).url).toBe(`${TILE}?v=2&key=abc123`)
  })

  it('leaves a key already baked into the URL alone', () => {
    const t = cartoTransformRequest('abc123')

    expect(t(`${POSITRON}?key=preset`).url).toBe(`${POSITRON}?key=preset`)
  })

  it('passes a non-URL through untouched', () => {
    const t = cartoTransformRequest('abc123')

    expect(t('not-a-url').url).toBe('not-a-url')
  })
})
