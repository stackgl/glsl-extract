'use strict'

module.exports = collect_storages

var tokenizer = require('glsl-tokenizer')
  , lang = require('cssauron-glsl')
  , parser = require('glsl-parser')
  , through = require('through')

var check_storage = lang(':root > stmt > decl')
  , is_struct = lang('stmt > decl > struct')
  , is_preprocessor = lang('preprocessor')

function collect_storages(structs, uniforms, attributes, definitions) {
  var stream = through(write)

  return stream

  function inject(src) {
    var ingress = tokenizer()

    ingress.pipe(parser()).pipe(through(write))

    ingress.end(src)
  }

  function write(node) {
    if(node.type === 'ident') {
      if(definitions[node.token.data]) {
        inject(definitions[node.token.data] + ';')
      }

      return
    }

    if(is_struct(node)) {
      if(node.children[0].type === 'ident') {
        structs[node.children[0].data] = node
      }

      structs[node.token.data] = node.parent
    }

    if(is_preprocessor(node)) {
      var match = /^#\s*define\s+([\w\d_]+)(\s+(.*))?$/.exec(node.token.data)

      if(match) {
        definitions[match[1]] = match[2]
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

