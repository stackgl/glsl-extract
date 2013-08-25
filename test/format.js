var collect = require('../lib/collect.js')
  , format = require('../lib/format.js')
  , select = require('./util-select')
  , through = require('through')
  , ast = require('./util-ast')
  , test = require('tape')

test('unit: format succeeds on non-quantified kw types', function(assert) {
  var ingress = ast()
    , structs = {}
    , attrs = []
    , unis = []

  ingress
    .pipe(collect(structs, unis, attrs))
    .pipe(through(null, onend))

  ingress.end('uniform vec3 x, y, z; attribute vec2 a, b, c; uniform float d;')

  function onend() {
    assert.deepEqual(format(unis, structs), [
        {type: 'vec3', name: 'x'}
      , {type: 'vec3', name: 'y'}
      , {type: 'vec3', name: 'z'}
      , {type: 'float', name: 'd'}
    ])

    assert.deepEqual(format(attrs, structs), [
        {type: 'vec2', name: 'a'}
      , {type: 'vec2', name: 'b'}
      , {type: 'vec2', name: 'c'}
    ])

    assert.end()
  }
})

test('unit: format succeeds on quantified kw types', function(assert) {
  var ingress = ast()
    , structs = {}
    , attrs = []
    , unis = []

  ingress
    .pipe(collect(structs, unis, attrs))
    .pipe(through(null, onend))

  ingress.end('uniform vec3 x[2], y, z[2 + 10]; uniform float u, w[2 * 2];')

  function onend() {
    assert.deepEqual(format(unis, structs), [
        {type: 'vec3', name: 'x[0]'}
      , {type: 'vec3', name: 'x[1]'}
      , {type: 'vec3', name: 'y'}
      , {type: 'vec3', name: 'z[0]'}
      , {type: 'vec3', name: 'z[1]'}
      , {type: 'vec3', name: 'z[2]'}
      , {type: 'vec3', name: 'z[3]'}
      , {type: 'vec3', name: 'z[4]'}
      , {type: 'vec3', name: 'z[5]'}
      , {type: 'vec3', name: 'z[6]'}
      , {type: 'vec3', name: 'z[7]'}
      , {type: 'vec3', name: 'z[8]'}
      , {type: 'vec3', name: 'z[9]'}
      , {type: 'vec3', name: 'z[10]'}
      , {type: 'vec3', name: 'z[11]'}
      , {type: 'float', name: 'u'}
      , {type: 'float', name: 'w[0]'}
      , {type: 'float', name: 'w[1]'}
      , {type: 'float', name: 'w[2]'}
      , {type: 'float', name: 'w[3]'}
    ])

    assert.end()
  }
})

test('unit: format fails on non-determinable quant kws', function(assert) {
  var ingress = ast()
    , structs = {}
    , attrs = []
    , unis = []

  ingress
    .pipe(collect(structs, unis, attrs))
    .pipe(through(null, onend))

  ingress.end('uniform vec3 x[2 + GARY_BUSEY];')

  function onend() {
    assert.throws(function() {
      format(unis, structs)
    })

    assert.end()
  }
})

test('unit: format succeeds on non-quant user types', function(assert) {
  var ingress = ast()
    , structs = {}
    , attrs = []
    , unis = []

  ingress
    .pipe(collect(structs, unis, attrs))
    .pipe(through(null, onend))

  ingress.end(
      'uniform struct { int a; } b;\n' +
      'struct gary { float b; vec2 c; };\n' +
      'uniform gary busey;'
  )

  function onend() {
    assert.deepEqual(format(unis, structs), [
        {type: 'int', name: 'b.a'}
      , {type: 'float', name: 'busey.b'}
      , {type: 'vec2', name: 'busey.c'}
    ])

    assert.end()
  }
})

test('unit: format succeeds on non-quant nested user types', function(assert) {
  var ingress = ast()
    , structs = {}
    , attrs = []
    , unis = []

  ingress
    .pipe(collect(structs, unis, attrs))
    .pipe(through(null, onend))

  ingress.end(
      'struct gary { float b; vec2 c; };\n' +
      'uniform struct { gary a; } b;\n'
  )

  function onend() {
    assert.deepEqual(format(unis, structs), [
        {type: 'float', name: 'b.a.b'}
      , {type: 'vec2', name: 'b.a.c'}
    ])

    assert.end()
  }
})

test('unit: format fails non-determinable quant user types', function(assert) {
  var ingress = ast()
    , structs = {}
    , attrs = []
    , unis = []

  ingress
    .pipe(collect(structs, unis, attrs))
    .pipe(through(null, onend))

  ingress.end(
      'struct gary { float b; vec2 c; };\n' +
      'uniform struct { gary a[nope + lol]; } b;\n'
  )

  function onend() {
    assert.throws(function() {
      format(unis, structs)
    })

    assert.end()
  }
})

test('unit: format succeeds on quant user types', function(assert) {
  var ingress = ast()
    , structs = {}
    , attrs = []
    , unis = []

  ingress
    .pipe(collect(structs, unis, attrs))
    .pipe(through(null, onend))

  ingress.end(
      'struct gary { float b[2]; vec2 c; };\n' +
      'uniform gary busey[2];'
  )

  function onend() {
    assert.deepEqual(format(unis, structs), [
        {type: 'float', name: 'busey[0].b[0]'}
      , {type: 'float', name: 'busey[1].b[0]'}
      , {type: 'float', name: 'busey[0].b[1]'}
      , {type: 'float', name: 'busey[1].b[1]'}
      , {type: 'vec2', name: 'busey[0].c'}
      , {type: 'vec2', name: 'busey[1].c'}
    ])

    assert.end()
  }
})

test('unit: format succeeds on quant nested user types', function(assert) {
  var ingress = ast()
    , structs = {}
    , attrs = []
    , unis = []

  ingress
    .pipe(collect(structs, unis, attrs))
    .pipe(through(null, onend))

  ingress.end(
      'struct last { int x; mat4 y; };\n' +
      'struct middle { last busey; };\n' +
      'struct first { middle gary[2]; };\n' +
      'uniform first william[2];'
  )

  function onend() {
    assert.deepEqual(format(unis, structs), [
        {type: 'int', name: 'william[0].gary[0].busey.x'}
      , {type: 'int', name: 'william[1].gary[0].busey.x'}
      , {type: 'int', name: 'william[0].gary[1].busey.x'}
      , {type: 'int', name: 'william[1].gary[1].busey.x'}
      , {type: 'mat4', name: 'william[0].gary[0].busey.y'}
      , {type: 'mat4', name: 'william[1].gary[0].busey.y'}
      , {type: 'mat4', name: 'william[0].gary[1].busey.y'}
      , {type: 'mat4', name: 'william[1].gary[1].busey.y'}
    ])

    assert.end()
  }
})
