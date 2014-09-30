var Table = require('cli-table');

module.exports = {

  report: function(results) {

    if ( results.length == 0 ) {
      return;
    }

    console.log(results[0].file);

    var table = new Table({
      head: ['Line', 'Column', 'Severity', 'Message', 'Evidence']
    });

    results.forEach(function(result) {

      table.push([
        result.line,
        result.col,
        result.severity,
        result.msg,
        result.code
      ]);

    });

    console.log(table.toString());

  }
};