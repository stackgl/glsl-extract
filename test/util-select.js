module.exports = select

var lang = require('cssauron-glsl')
  , through = require('through')

function select(sel) {
  sel = lang(sel)

  return through(function(node) {
    if(sel(node)) {
      this.queue(node)
    }
  })
}


