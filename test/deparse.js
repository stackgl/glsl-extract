var deparse = require('../lib/deparse.js')
  , tokenizer = require('glsl-tokenizer')
  , lang = require('cssauron-glsl')
  , parser = require('glsl-parser')
  , through = require('through')
  , duplex = require('duplexer')
  , test = require('tape')

test(
    'unit: throws exceptions on non-statically analyzable input'
  , test_throws
)

test(
    'unit: returns result of analyzable input'
  , test_returns_result
)

function test_throws(assert) {
  var parse = ast()

  parse
    .pipe(select('expr'))
    .on('data', check)

  parse.end('UNKNOWN_TOKEN + 3 / 1;')

  function check(node) {
    var thrown = 0

    try {
      deparse(node)
    } catch(err) {
      thrown++
    }

    assert.equal(thrown, 1)
    assert.end()
  }
}

function test_returns_result(assert) {
  var parse = ast()

  parse
    .pipe(select('expr'))
    .on('data', check)

  parse.end('100 + 3 / 10 | 0;')

  function check(node) {
    assert.equal(deparse(node), 100 + 3 / 10 | 0)
    assert.end()
  }
}

function select(sel) {
  sel = lang(sel)

  return through(function(node) {
    if(sel(node)) {
      this.queue(node)
    }
  })
}

function ast() {
  var tokens = tokenizer()
    , parse = parser()

  tokens.pipe(parse)

  return duplex(tokens, parse)
}
