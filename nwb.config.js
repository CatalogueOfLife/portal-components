
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
        },
        extractCSS: {
          filename: '[name].css'
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
