var fs = require('fs')

//var test_data = fs.readFileSync('test.glsl', 'utf8')

var extract = require('./index')

extract(fs.createReadStream('test.glsl'), getctx)(function(err, info) {
  console.log(err ? err.stack : err, info)
})

function getctx(data) {
  return data === 'GL_MAX_HATS' ? 'AMERICA' : void 0
}
