
module.exports = {
  type: 'react-component',
  webpack : {
    
        rules: {
          less : {
            loader: "less-loader",
            options: {
              javascriptEnabled: true
            }
          }
        }
     
  },
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
