import { defineConfig, transformWithEsbuild } from 'vite'
import { resolve } from 'path'

// Custom plugin to handle JSX in .js files
// The @vitejs/plugin-react only transforms .jsx/.tsx by default in SSR mode
const jsxInJs = {
  name: 'jsx-in-js',
  async transform(code, id) {
    if (!id.match(/\/src\/.*\.js$/) && !id.match(/\/tests\/.*\.js$/) && !id.match(/\/demo\/.*\.js$/)) {
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
  appType: 'spa',
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
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
    lib: {
      // One entry per public component (built from src/entries/*) plus the
      // `index` barrel. Each component is published as its own subpath in
      // package.json `exports`, so importing one never pulls in another's heavy
      // deps. Rollup hoists code shared between entries into es/chunks/*.
      entry: {
        index: resolve(__dirname, 'src/index.js'),
        tree: resolve(__dirname, 'src/entries/tree.js'),
        search: resolve(__dirname, 'src/entries/search.js'),
        taxon: resolve(__dirname, 'src/entries/taxon.js'),
        sourceDataset: resolve(__dirname, 'src/entries/sourceDataset.js'),
        sourceDatasetList: resolve(__dirname, 'src/entries/sourceDatasetList.js'),
        bibtex: resolve(__dirname, 'src/entries/bibtex.js'),
        taxonBreakdown: resolve(__dirname, 'src/entries/taxonBreakdown.js'),
        taxonDistribution: resolve(__dirname, 'src/entries/taxonDistribution.js'),
        routing: resolve(__dirname, 'src/entries/routing.js'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'react', 'react-dom', 'react-router-dom',
        /^antd/, /^lodash/, /^history/,
        /^highcharts/, /^marked/, /^query-string/,
        /^react-jss/, /^react-highlight-words/,
        /^dompurify/, /^linkify/, /^dataloader/,
        /^maplibre-gl/,
      ],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        // cssCodeSplit is false, so all CSS is extracted into one stylesheet;
        // pin its name so the package.json `./style.css` export stays valid
        // regardless of how many entries exist.
        assetFileNames: (info) =>
          info.name?.endsWith('.css') ? 'col-browser.css' : info.name,
      },
    },
    outDir: 'es',
    cssCodeSplit: false,
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    testTimeout: 15000,
    include: ['tests/**/*.test.{js,jsx}'],
  },
})
