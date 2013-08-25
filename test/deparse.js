var deparse = require('../lib/deparse.js')
  , select = require('./util-select')
  , ast = require('./util-ast')
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
