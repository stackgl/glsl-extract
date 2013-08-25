'use strict'

module.exports = preprocess

var tokenizer = require('glsl-tokenizer')
  , parser = require('glsl-parser')
  , through = require('through')

var REPLACE = 0
  , MACRO = 1

function preprocess(_getctx) {
  var stream = through(write)
    , registry = {}

  var $state = $init
    , collected = []
    , paren_lvl = 0
    , if_lvl = 0
    , macro_call

  return stream

  function write(token) {
    $state = $state(token)
  }

  function getctx(str) {
    var ret = _getctx(str)

    if(ret === null || ret === undefined) {
      return ret
    }

    return {text: ret + ''}
  }

  function define_macro(match) {
    var name = match[1]
      , args = match[2]
      , as = match[3]

    as = as
      .replace(/^\s+/, '')
      .replace(/\s+$/, '')

    args = args.split(',').map(function(xs) {
      return xs
        .replace(/^\s+/, '')
        .replace(/\s+$/, '')
    })

    registry[name] = {
        type: MACRO
      , text: as
      , args: args
    }
  }

  function define_replace(match) {
    var name = match[1]
      , as = match[2]

    as = as
      .replace(/^\s+/, '')
      .replace(/\s+$/, '')

    registry[name] = {
        type: REPLACE
      , text: as
    }
  }

  function $init(token) {
    var injector
      , value

    if(token.type === 'ident') {
      value = registry[token.data]

      value = value ||
        (token.data.slice(0, 3) === 'GL_' ? getctx(token.data) : null)

      if(value) {
        if(value.type === MACRO) {
          macro_call = value

          return $await_call
        }

        injector = tokenizer()

        injector
          .on('data', inject_token)
          .on('error', onerror)
          .end(value.text)

        return $state
      }

    }

    if(token.type === 'preprocessor') {
      return onpreprocessor(token)
    }

    stream.queue(token)

    return $state
  }

  function $ignore_until_endif(token) {
    if(token.type === 'eof') {
      stream.emit('error', new Error('unexpected eof'))
    }

    if(token.type !== 'preprocessor') {
      return $state
    }

    if(/^#\s*endif/.test(token.data)) {
      return !--if_lvl ? $init : $state
    }

    if(/^#\s*if/.test(token.data)) {
      ++if_lvl
    }

    return $state
  }

  function $ignore_until_alternate(token) {
    if(token.type === 'eof') {
      stream.emit('error', new Error('unexpected eof'))
    }

    if(token.type !== 'preprocessor') {
      return $state
    }

    if(/^#\s*endif/.test(token.data)) {
      return !--if_lvl ? $init : $state
    }

    if(/^#\s*elif/.test(token.data) && if_lvl === 1) {
      var inject = tokenizer()
        , result
        , rest

      rest = token.data.replace(/^#\s*elif\s*/, '')


      inject
        .pipe(defined_to_op())
        .pipe(parser())
      .on('data', function(node) {
        if(!node.parent) {
          result = node
        }
      })
      inject.end(rest + ';')

      if(!!if_eval(result)) {
        return $init
      }

      return $ignore_until_alternate
    }

    if(/^#\s*else/.test(token.data) && if_lvl === 1) {
      return $init
    }

    if(/^#\s*if/.test(token.data)) {
      ++if_lvl

      return $state
    }

    return $state
  }

  function $await_call(token) {
    if(token.data === '(') {
      paren_lvl = 1
      collected = [[]]

      return $collect
    }

    stream.queue(token)

    return $init
  }

  function $collect(token) {
    if(token.data === '(') {
      ++paren_lvl
    }

    if(token.data === ')') {
      --paren_lvl
    }

    if(token.data === ',' && paren_lvl === 1) {
      collected[collected.length] = []
    }

    if(!paren_lvl) {
      $state = $init

      var injector = tokenizer()

      injector
        .on('data', macro_inject_token)
        .on('error', onerror)
        .end(macro_call.text)

      return $state
    }

    collected[collected.length - 1].push(token)

    return $collect
  }

  function onerror(err) {
    stream.emit('error', err)
  }

  function macro_inject_token(token) {
    if(token.type === 'eof') {
      return
    }

    if(token.type !== 'ident') {
      return write(token)
    }

    var idx = macro_call.args.indexOf(token.data)
      , output

    if(idx === -1) {
      return write(token)
    }

    output = collected[idx].slice()

    while(output.length) {
      write(output.shift())
    }
  }

  function inject_token(token) {
    if(token.type === undefined) {
      token.type = 'ident'
    }

    if(token.type === 'eof') {
      return
    }

    write(token)
  }

  function onpreprocessor(token) {
    var bits = token.data.replace(/^#\s*/, '').split(' ')
      , directive = bits[0]
      , rest

    rest = bits.slice(1).join(' ')
      .replace(/^\s+/, '')
      .replace(/\s+$/, '')

    if(directive === 'define') {
      var match = /^([\w\d_]+)\(([^)]+)\)\s(.*)$/.exec(rest)

      if(match) {
        define_macro(match)

        return $init
      }

      match = /^([\w\d_]+)(.*)$/.exec(rest)

      if(!match) {
        stream.emit('error', new Error('cannot parse #define'))

        return $init
      }

      define_replace(match)

      return $init
    }

    if(directive === 'undef') {
      delete registry[rest]

      return $init
    }

    if(directive === 'endif') {
      return $init
    }

    if(directive === 'else' || directive === 'elif') {
      if_lvl = 1

      return $ignore_until_endif
    }

    if(directive.slice(0, 2) !== 'if') {
      return $state
    }

    if_lvl = 1

    if(directive === 'ifdef') {
      return rest in registry ? $state : $ignore_until_alternate
    }

    if(directive === 'ifndef') {
      return !(rest in registry) ? $state : $ignore_until_alternate
    }

    var inject = tokenizer()
      , result

    inject
      .pipe(defined_to_op())
      .pipe(parser())
    .on('data', function(node) {
      if(!node.parent) {
        result = node
      }
    })
    inject.end(rest + ';')

    return !!if_eval(result) ? $state : $ignore_until_alternate
  }

  // tiny runtime:
  function if_eval(node) {
    if(node.type === 'ident') {
      return (registry[node.token.data] || getctx(node.token.data) || {}).text
    }

    if(node.type === 'literal') {
      return node.token.data === 'true' ? true :
            node.token.data === 'false' ? false :
            node.token.data | 0
    }

    if(node.type !== 'binary' && node.type !== 'unary') {
      return node.children.every(if_eval)
    }

    var children = node.children || []
      , lhs = children[0]
      , rhs = children[1]
      , _ = if_eval

    if(node.type === 'unary') {
      switch(node.token.data) {
        case 'defined': return !!(lhs.token.data in registry)
        case '+': return +_(lhs)
        case '-': return -_(lhs)
        case '~': return ~_(lhs)
        case '!': return !_(lhs)
        case '(': return _(lhs)
      }
    }

    switch(node.token.data) {
      case '+':   return _(lhs) + _(rhs)
      case '-':   return _(lhs) - _(rhs)
      case '^':   return _(lhs) ^ _(rhs)
      case '*':   return _(lhs) * _(rhs)
      case '/':   return _(lhs) / _(rhs)
      case '%':   return _(lhs) % _(rhs)
      case '>>':  return _(lhs) >> _(rhs)
      case '<<':  return _(lhs) << _(rhs)
      case '<':   return _(lhs) < _(rhs)
      case '>':   return _(lhs) > _(rhs)
      case '<=':  return _(lhs) <= _(rhs)
      case '>=':  return _(lhs) >= _(rhs)
      case '==':  return _(lhs) === _(rhs)
      case '!=':  return _(lhs) !== _(rhs)
      case '|':   return _(lhs) | _(rhs)
      case '||':  return _(lhs) || _(rhs)
      case '&':   return _(lhs) & _(rhs)
      case '&&':  return _(lhs) && _(rhs)
    }
  }
}

function defined_to_op() {
  return through(function(token) {
    if(token.type === 'ident' && token.data === 'defined') {
      token.type = 'operator'
    }

    this.queue(token)
  })
}
