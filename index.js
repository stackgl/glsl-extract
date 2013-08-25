'use strict'

module.exports = extract

var tokenizer = require('glsl-tokenizer')
  , utf8stream = require('utf8-stream')
  , parser = require('glsl-parser')
  , through = require('through')

var preprocess = require('./lib/preprocess')

var collect = require('./lib/collect')
  , format = require('./lib/format')

function extract(program, getcontext) {
  if(typeof program === 'string') {
    program = string_to_stream(program)
  }

  if(arguments.length < 2) {
    getcontext = function(ctxt) {
      return parseInt(ctxt)
    }
  }

  var pause = through()

  pause.pause()
  program.pipe(pause)

  return continuable

  function continuable(ready) {
    var attributes = []
      , uniforms = []
      , structs = {}

    pause
      .pipe(utf8stream())
      .pipe(tostring())
      .pipe(tokenizer())
      .pipe(preprocess(getcontext))
      .pipe(parser())
      .pipe(collect(structs, uniforms, attributes))
      .pipe(through(null, output_all))

    pause.resume()

    function output_all() {
      try {
        ready(null, {
            uniforms: format(uniforms, structs)
          , attributes: format(attributes, structs)
        })
      } catch(err) {
        ready(err)
      }
    }
  }
}

function string_to_stream(str) {
  var stream = through()

  process.nextTick(function() {
    stream.end(Buffer.isBuffer(str) ? str : new Buffer(str, 'utf8'))
  })

  return stream
}

function tostring() {
  var stream = through(write)

  return stream

  function write(buf) {
    stream.queue(buf.toString('utf8'))
  }
}
