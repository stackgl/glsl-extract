var preprocess = require('../lib/preprocess.js')
  , tokenize = require('glsl-tokenizer')
  , deparse = require('glsl-deparser')
  , parse = require('glsl-parser')
  , through = require('through')
  , test = require('tape')

test('unit: unexpected eof', function(assert) {
  var input = [
      '#ifndef UNDEFINED'
    , 'int x, y;'
    , 'int arf, woof;'
    , '#else'
    , 'int a, b;'
  ].join('\n')

  assert.throws(function() {
    output(input)
  })

  var input = [
      '#ifdef UNDEFINED'
    , 'int x, y;'
    , 'int arf, woof;'
    , '#else'
    , 'int a, b;'
  ].join('\n')

  // TODO: fix this case

  if(0) {
    assert.throws(function() {
      output(input)
    })
  }

  assert.end()
})

test('unit: nested ifs', function(assert) {
  var input = [
      '#define DEFINED'
    , '#ifdef UNDEFINED'
    , '#ifdef DEFINED'
    , 'int x, y;'
    , '#endif'
    , 'int arf, woof;'
    , '#else'
    , 'int a, b;'
    , '#endif'
  ].join('\n')

  assert.equal(output(input), '\nint a, b;')

  assert.end()
})

test('unit: ifdef / ifndef / undef', function(assert) {
  var input = [
      '#ifdef UNDEFINED'
    , 'int x, y;'
    , '#else'
    , 'int a, b;'
    , '#endif'
  ].join('\n')

  assert.equal(output(input), '\nint a, b;')

  var input = [
      '#ifndef UNDEFINED'
    , 'int x, y;'
    , '#else'
    , 'int a, b;'
    , '#endif'
  ].join('\n')

  assert.equal(output(input), '\nint x, y;')

  var input = [
      '#define ANYTHING'
    , '#ifdef ANYTHING'
    , 'int x, y;'
    , '#else'
    , 'int a, b;'
    , '#endif'
  ].join('\n')

  assert.equal(output(input), '\nint x, y;')

  var input = [
      '#define ANYTHING'
    , '#ifndef ANYTHING'
    , 'int x, y;'
    , '#else'
    , 'int a, b;'
    , '#endif'
  ].join('\n')

  assert.equal(output(input), '\nint a, b;')

  var input = [
      '#define ANYTHING'
    , '#undef ANYTHING'
    , '#ifndef ANYTHING'
    , 'int x, y;'
    , '#else'
    , 'int a, b;'
    , '#endif'
  ].join('\n')

  assert.equal(output(input), '\nint x, y;')

  var input = [
      '#define ANYTHING'
    , '#undef ANYTHING'
    , '#ifdef ANYTHING'
    , 'int x, y;'
    , '#else'
    , 'int a, b;'
    , '#endif'
  ].join('\n')

  assert.equal(output(input), '\nint a, b;')

  assert.end()
})


function output(input, getctx) {
  var ingress = tokenize()
    , output = []

  ingress
    .pipe(preprocess(getctx))
    .pipe(parse())
    .pipe(deparse())
    .pipe(through(ondata))

  ingress.end(input)

  return output.join('')

  function ondata(str) {
    output.push(str)
  }
}
