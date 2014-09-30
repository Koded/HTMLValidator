var fs = require('fs');

var request = {
  post: function(url, options, callback) {

    response = fs.readFileSync("./tests/fixtures/results/results-1.html", "utf8");

    callback(null, {
      statusCode: 200
    }, response);
  }
};

module.exports = request;