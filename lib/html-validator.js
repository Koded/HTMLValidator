/*
 * Core modules
 */
var path = require('path');
var util = require('util');
var querystring = require('querystring');

/*
 * NPM modules
 */
var glob = require("glob");
var fs = require('fs-extra');
var _ = require("lodash");
var cheerio = require("cheerio");
var chalk = require("chalk");
var async = require('async');
var http = require('http');
var request = require('request');
var minimatch = require("minimatch");
var Promise = require('es6-promise').Promise;

/*
 * App modules
 */

var Result = require('./result.js');
var logger = require('./utils/logger.js');
var cache = require('./utils/cache.js');

/*
 * Module Vars
 */
var config = {};
var reporter;
var timeoutErrors = 0;

/*
 * Constants
 */
var EOL = require('os').EOL;

var cwd;

/**
 *
 * @param html
 * @param callback
 */
var unicornRequest = function(html, callback) {

  var responseCache = cache(config.cache);
  var postData;

  /*
   * Check the cache
   */

  var response = responseCache.get(html);

  if ( response !== false ) {
    callback(null, response);
    return;
  }

  postData = {
    form: {
      'ucn_text': html,
      'ucn_task': 'conformance',
      'ucn_text_mime': 'text/html',
      'charset': 'UTF-8',
      'doctype': 'HTML5'
    },
    timeout: 120000
  };

  request.post(
    config.unicorn.host + config.unicorn.path,
    postData,
    function (err, response, body) {
      if (!err && response.statusCode == 200) {
        responseCache.set(html, body);
        callback(null, body);
      }
      else {
        callback(err, {});
      }
    }
  );
};

/**
 *
 * @param file
 * @param response
 * @param callback
 */
var parseUnicornResponse = function(file, response, callback) {

  var $ = cheerio.load(response);
  var elem;
  var results = [];
  var result;

  var levels = [
    {
      label: 'error',
      class: '.errors'
    },
    {
      label: 'warning',
      class: '.warnings'
    }
  ];

  levels.forEach(function(severity) {

    $('tr', severity.class).each(function(index, value) {

      elem = $(this);

      if (!$('.linenumber', elem).text()) {
        return;
      }

      result = new Result(
        file,
        severity.label,
        $('.linenumber', elem).text().trim(),
        $('.colnumber', elem).text().trim(),
        $('.codeContext', elem).text().trim(),
        $('.message .msg', elem).text().trim()
      );

      results.push(result);
    });
  });

  callback(null, results);
};

/**
 *
 * @param file
 * @param callback
 */
var validate = function(file, callback) {

  var html;
  var filename;
  var logContents;

  return new Promise(function(resolve, reject) {
    fs.readFile(file, function(err, data) {

      html = data.toString();

      unicornRequest(html, function(err, response) {

        if ( err ) {
          timeoutErrors++;
          reject(err)
        }

        parseUnicornResponse(file, response, function(err, results) {

          results = filterResults(file, results);

          reporter.report(results);

          resolve({
            file: file,
            results: results
          });
        });
      });
    });
  });
};

var filterResults = function(file, results) {

  /*
   * Combine global whitelist rules and any path specific rules
   */

  var allRules = [];
  var filteredResults = [];

  _.each(config.whitelist, function(rules, pattern) {
    if ( minimatch(path.resolve(file), pattern, { matchBase: true, dot: true} ) ) {
      allRules = allRules.concat(rules);
    }
  });

  _.each(results, function(result) {
    hasMatch = false;
    _.each(allRules, function(rule) {
      if ( result.msg.match(rule) ) {
        hasMatch = true;
        return;

      }
    });

    if ( !hasMatch ) {
      filteredResults.push(result);
    }
  });

  return filteredResults;

};

/**
 *
 * @param files
 */
var validateAll = function(files, callback) {

  var allFiles;
  var promises = [];

  console.time('validation-time');

  timeoutErrors = 0;

  files.forEach(function(srcFiles) {
    glob.sync(srcFiles).forEach(function(srcFile) {
      promises.push(validate(srcFile));
    });
  });

  Promise.all(promises).then(function(results) {
    var total = 0;

    results.forEach(function(result) {
      total += result.results.length;
    });

    console.timeEnd('validation-time');
    callback(total);

  }, function(e) {
    console.log(e);
  });
};


/*
 * Expose an API
 */
module.exports = function(_config) {

  config = _.defaults(_config, {
    reporter: 'default',
    timeout: 20000
  });

  reporter = require('./reporters/' + config.reporter + '.js');

  return {
    validateAll: validateAll,
    parseUnicornResponse: parseUnicornResponse,
    unicornRequest: unicornRequest
  }

};