module.exports = ast

var tokenizer = require('glsl-tokenizer')
  , parser = require('glsl-parser')
  , duplex = require('duplexer')

function ast() {
  var tokens = tokenizer()
    , parse = parser()

  tokens.pipe(parse)

  return duplex(tokens, parse)
}
