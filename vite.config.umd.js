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
  build: {
    lib: {
      entry: resolve(__dirname, 'src/umd.js'),
      name: 'ColBrowser',
      formats: ['umd'],
      fileName: () => 'col-browser.js',
    },
    rollupOptions: {
      external: ['react'],
      output: {
        globals: { react: 'React' },
        assetFileNames: (info) =>
          info.name?.endsWith('.css') ? 'main.css' : info.name,
      },
    },
    outDir: 'umd',
    sourcemap: true,
    cssCodeSplit: false,
    minify: false,
  },
})
