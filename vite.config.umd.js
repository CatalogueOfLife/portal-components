import { defineConfig, transformWithEsbuild } from 'vite'
import { resolve } from 'path'

const jsxInJs = {
  name: 'jsx-in-js',
  async transform(code, id) {
    if (!id.match(/\/src\/.*\.js$/) && !id.match(/\/demo\/.*\.js$/)) {
      return null
    }
    return transformWithEsbuild(code, id + '.jsx', {
      jsx: 'automatic',
      jsxImportSource: 'react',
    })
  },
}

export default defineConfig({
  plugins: [jsxInJs],
  css: {
    preprocessorOptions: {
      less: { javascriptEnabled: true, math: 'always' },
    },
  },
  define: {
    // esbuild (used for CJS transforms) only accepts literals — keep this simple
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/umd.js'),
      name: 'ColBrowser',
      formats: ['umd'],
      fileName: () => 'col-browser.js',
    },
    rollupOptions: {
      // React 19 no longer ships a UMD build, so we can't expect consumers
      // to load it from a CDN; bundle it (and react-dom/client) into the
      // UMD bundle and re-expose them as ColBrowser.React / ColBrowser.ReactDOM
      // (see src/umd.js). maplibre-gl is still UMD on jsDelivr, so it stays
      // external and is loaded separately by Taxon / TaxonDistribution consumers.
      external: ['maplibre-gl'],
      output: {
        globals: { 'maplibre-gl': 'maplibregl' },
        assetFileNames: (info) =>
          info.name?.endsWith('.css') ? 'main.css' : info.name,
        // Inject browser polyfills for Node globals inside the UMD wrapper.
        // setImmediate: used by some scheduler code.
        // Buffer: used by the btoa npm package to encode Basic Auth credentials.
        intro: `
var setImmediate = typeof globalThis.setImmediate !== 'undefined' ? globalThis.setImmediate : function(fn) { return setTimeout(fn, 0); };
var Buffer = (function() {
  function BBuffer(s) { this._s = s; }
  BBuffer.prototype.toString = function(e) { return e === 'base64' ? btoa(this._s) : this._s; };
  BBuffer.from = function(s) { return new BBuffer(s); };
  BBuffer.isBuffer = function() { return false; };
  return BBuffer;
})();
        `,
      },
    },
    outDir: 'umd',
    sourcemap: true,
    cssCodeSplit: false,
    minify: false,
  },
})
