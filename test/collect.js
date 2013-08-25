var collect = require('../lib/collect.js')
  , through = require('through')
  , ast = require('./util-ast')
  , test = require('tape')

var types = [
    'double'
  , 'float'
  , 'int'
  , 'bool'
  , 'mat2'
  , 'mat3'
  , 'mat4'
  , 'vec2'
  , 'vec3'
  , 'vec4'
  , 'ivec2'
  , 'ivec3'
  , 'ivec4'
  , 'bvec2'
  , 'bvec3'
  , 'bvec4'
  , 'sampler1D'
  , 'sampler2D'
  , 'sampler3D'
  , 'samplerCube'
  , 'sampler1DShadow'
  , 'sampler2DShadow'
  , 'struct { int x; }'
  , 'user_defined_type'
]

test('unit: collects vanilla structs', function(assert) {
  var nodes = ast()
    , structs = {}

  var expect = 'name_' + ((Math.random() * 10) | 0)

  nodes
    .pipe(collect(structs, [], []))
    .pipe(through(null, check))

  nodes.end('struct ' + expect + ' { int x; vec3 y; };')

  function check() {
    // we really only care that we've
    // registered the struct for the future.
    assert.deepEqual(Object.keys(structs), [expect])
    assert.end()
  }
})

test('unit: does not collect anonymous structs', function(assert) {
  var nodes = ast()
    , structs = {}

  nodes
    .pipe(collect(structs, [], []))
    .pipe(through(null, check))

  nodes.end('struct { int x; vec3 y; } x;')

  function check() {
    assert.deepEqual(Object.keys(structs), [])
    assert.end()
  }
})

test('unit: collects attributes and uniforms', function(assert) {
  var nodes = ast()
    , structs = {}
    , attrs = []
    , unis = []

  var expect = 'name_' + (Math.random() * 10 | 0)

  var source = types.map(function(type, idx) {
    return 'uniform ' + type + ' ' + expect + '_' + idx + ';'
  })

  source = source.concat(types.map(function(type, idx) {
    idx += types.length

    return 'attribute ' + type + ' ' + expect + '_' + idx + ';'
  }))

  source = 'struct user_defined_type { int x; };\n' + source.join('\n')

  nodes
    .pipe(collect(structs, attrs, unis))
    .pipe(through(null, check))

  nodes.end(source)

  function check() {
    assert.deepEqual(Object.keys(structs), ['user_defined_type'])
    assert.equal(attrs.length, types.length)
    assert.equal(unis.length, types.length)

    for(var i = 0, len = types.length; i < len; ++i) {
      assert.equal(
          attrs[i].children[4].token.data
        , types[i].split(' ')[0]
        , 'caught attribute ' + types[i]
      )
    }

    for(var i = 0, len = types.length; i < len; ++i) {
      assert.equal(
          unis[i].children[4].token.data
        , types[i].split(' ')[0]
        , 'caught uniform ' + types[i]
      )
    }

    assert.end()
  }
})
