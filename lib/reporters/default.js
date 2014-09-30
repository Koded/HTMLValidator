var util = require('util');

module.exports = {

  report: function(results) {

    results.forEach(function(result) {

      console.log(util.format('%s [%s] %s, %s: %s', result.file, result.severity, result.line, result.col, result.msg));

    });

  }
}