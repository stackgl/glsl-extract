var jsl = require('jsl/rules')
  , test = require('tape')

var extract = require('../index')

test('lint', jsl.test(__filename))

require('./collect.js')
require('./deparse.js')
require('./format.js')
