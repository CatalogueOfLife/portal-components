import { defineConfig, transformWithEsbuild } from 'vite'
import { resolve } from 'path'

// JSX-in-.js transform — same plugin shape as vite.config.js / vite.config.umd.js
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

// Static build of the demo SPA for GitHub Pages.
// Served from https://catalogueoflife.github.io/portal-components/, hence base.
// Uses hash-based routing internally so no SPA 404 fallback is needed.
export default defineConfig({
  base: '/portal-components/',
  plugins: [jsxInJs],
  appType: 'spa',
  optimizeDeps: {
    esbuildOptions: { loader: { '.js': 'jsx' } },
  },
  css: {
    preprocessorOptions: {
      less: { javascriptEnabled: true, math: 'always' },
    },
  },
  resolve: {
    alias: { src: resolve(__dirname, 'src') },
  },
  build: {
    outDir: 'dist-demo',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
})
