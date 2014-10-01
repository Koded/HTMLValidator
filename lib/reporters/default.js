var util = require('util');
var path = require('path');

module.exports = {

  report: function(results) {

    results.forEach(function(result) {

      console.log(util.format('%s [%s] %s, %s: %s', path.resolve(result.file), result.severity, result.line, result.col, result.msg));

    });

  }
}