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
    esbuild: {
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
      entry: resolve(__dirname, 'src/index.js'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: [
        'react', 'react-dom', 'react-router-dom',
        /^antd/, /^axios/, /^lodash/, /^history/,
        /^highcharts/, /^marked/, /^query-string/,
        /^react-jss/, /^react-highlight-words/,
        /^dompurify/, /^linkify/, /^dataloader/, /^btoa/,
      ],
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
