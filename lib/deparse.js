'use strict'

module.exports = deparse

var deparser = require('glsl-deparser')
  , through = require('through')

function deparse(node) {
  var stream = deparser()
    , output
    , tmp

  // this mutates the node.

  tmp = node.parent
  node.parent = {}

  stream.pipe(through(write))
  stream.end(node)

  return Function('return ' + output)()

  function write(data) {
    output = data
  }
}
