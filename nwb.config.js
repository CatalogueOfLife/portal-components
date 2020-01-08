module.exports = {
  type: 'react-component',
  npm: {
    esModules: true,
    umd: {
      global: 'ColTreeBrowser',
      externals: {
        react: 'React'
      }
    }
  }
}
