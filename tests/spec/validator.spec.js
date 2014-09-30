var fs = require('fs');
var rewire = require('rewire');
var _ = require("lodash");
var yaml = require('js-yaml');
var rmrf = require('rmrf');

describe("HTML Validator", function() {

  var response;
  var html;
  var app;
  var request;
  var validator = rewire('../../lib/html-validator.js');

  beforeEach(function() {

    var config;

    response = fs.readFileSync("./tests/fixtures/results/results-1.html", "utf8");
    html = fs.readFileSync("./tests/fixtures/html/html-1.html", "utf8");
    config = fs.readFileSync("./tests/fixtures/config/config-1.yaml", "utf8");

    config = yaml.safeLoad(config);

    rmrf(config.cache);

    request = require('../mocks/request.mock.js');
    spyOn(request, 'post').andCallThrough();

    validator.__set__('request', request);

    app = validator(config);

  });

  it("should correctly parse the HTML results", function(done) {
    app.parseUnicornResponse('', response, function(err, results) {
      expect(results.length).toBe(141);
      done();
    });
  });

  it("should return the severity of the result", function(done) {
    app.parseUnicornResponse('', response, function(err, results) {

      var groups = _.groupBy(results, function(item) {
        return item.severity;
      });

      expect(groups.warning.length).toBe(91);
      expect(groups.error.length).toBe(50);

      done();
    });
  });

  it("should contain valid results", function(done) {

    app.parseUnicornResponse('', response, function(err, results) {
      expect(results[0]).toEqual( {
        severity: 'error',
        file: '',
        line: '10',
        col: '65',
        code: '<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">',
        msg: 'Bad value X-UA-Compatible for attribute http-equiv on element meta.'
      });

      done();
    });
  });

  it("should return results from a cache", function(done) {
    /*
     * Make first request
     */
    app.unicornRequest(html, function(err, result) {
      /*
       * Make second request
       */
      app.unicornRequest(html, function(err, result) {
        expect(request.post.callCount).toBe(1);
        done();
      });
    });
  });

  it("should exclude whitelisted problems from the results", function() {

  });

  it("should exclude whitelisted problems from specific results", function() {

  });

});