const fs = require('fs');
const { minify } = require('terser');
const { version } = require('../package.json');

const banner = `/*!
 * col-browser v${version}
 * MIT Licensed
 */`;

async function run() {
  const js = fs.readFileSync('umd/col-browser.js', 'utf8');
  const result = await minify(js, {
    compress: true,
    mangle: true,
    sourceMap: {
      filename: 'col-browser.min.js',
      url: 'col-browser.min.js.map'
    },
    output: { preamble: banner }
  });
  fs.writeFileSync('umd/col-browser.min.js', result.code);
  fs.writeFileSync('umd/col-browser.min.js.map', result.map);
}

run();
