module.exports = {
  type: 'react-component',
  npm: {
    esModules: true,
    umd: {
      global: 'ColBrowser',
      entry: './src/umd.js',
      externals: {
        react: 'React'
      }
    }
  }
}
