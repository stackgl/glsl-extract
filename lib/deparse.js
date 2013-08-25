'use strict'

module.exports = deparse

var deparser = require('glsl-deparser')
  , through = require('through')

function deparse(node, defs, getctx) {
  var stream = deparser()
    , output
    , tmp

  // this mutates the node.

  tmp = node.parent
  node.parent = {}

  recurse(node, function iter(node) {
    if(node.type !== 'ident') {
      return
    }

    if(defs[node.token.data]) {
      node.data = node.token.data = defs[node.token.data]

      // TODO: this should reparse the data

      return iter(node)
    }

    var context = getctx(node.token.data)

    if(context === undefined) {
      return
    }

    node.data = node.token.data = context + ''

    return iter(node)
  })

  stream.pipe(through(write))
  stream.end(node)

  return Function('return ' + output)()

  function write(data) {
    output = data
  }
}

function recurse(node, action) {
  action(node)

  if(node.children && node.children.length) {
    for(var i = 0, len = node.children.length; i < len; ++i) {
      recurse(node.children[i], action)
    }
  }
}

