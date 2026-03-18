
const path = require('path');

module.exports = {
  type: 'react-component',
  karma: {
    browsers: ['ChromeHeadlessNoSandbox'],
    plugins: [
      require('karma-chrome-launcher'),
    ],
    extra: {
      customLaunchers: {
        ChromeHeadlessNoSandbox: {
          base: 'ChromeHeadless',
          flags: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
        },
      },
    },
  },
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
