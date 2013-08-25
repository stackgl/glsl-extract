# glsl-extract

extract attribute and uniform data from glsl files, no matter how nested.

```javascript
var extract = require('glsl-extract')

extract(fs.createReadStream('test.glsl'))(function(err, info) {
  {attributes, uniforms} = info
  for(var def of uniforms) {
    {name, type} = def  // where "name" is the full dotted, array'd
                        // gl.getUniformLocation lookup path and
                        // type is the declared type.
  }
})

extract("also works with just text")(function(err, info) {
  // should execute on same frame.
})

```

# api

### extract(ReadableStream | String | Buffer[, getContextFunction) -> Continuable

Given a readable stream, string, or buffer, return a continuable that will trigger
parsing. The continuable will call its callback with `err` (if any), and `data`,
where `data` is comprised of `{attributes:[GLSLLocation], uniforms:[GLSLLocation]}`.

### GLSLLocation

A GLSLLocation is just a plain object containing `name` (the appropriate name to
pass to `gl.getUniformLocation`) and `type` (one of the primitive GLSL types).

# license

MIT
