'use strict'

module.exports = collect_storages

var lang = require('cssauron-glsl')
  , through = require('through')

var check_storage = lang(':root > stmt > decl')
  , is_struct = lang('stmt > decl > struct')

function collect_storages(structs, uniforms, attributes) {
  var stream = through(write)

  return stream

  function write(node) {
    if(node.type === 'ident') {
      return
    }

    if(is_struct(node)) {
      if(node.children[0].type === 'ident' && node.children[0].data) {
        structs[node.children[0].data] = node
      }
    }

    if(!check_storage(node)) {
      return
    }

    var type = node.children[1].token.data

    if(type === 'uniform') {
      uniforms.push(node)
    } else if(type === 'attribute') {
      attributes.push(node)
    }
  }
}

