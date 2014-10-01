#!/usr/bin/env node

var path = require('path');

/*
 * NPM modules
 */
var program = require('commander');
var yaml = require("js-yaml");
var fs = require('fs-extra');
var _ = require('lodash');


/*
 * App modules
 */
var html = require('./lib/html-validator.js');
var logger = require('./lib/utils/logger.js');

/*
 * Config
 */
var packageJson = require('./package.json');


/**
 * Initialise
 */
(function() {

  var config;

  program
    .version(packageJson.version)
    .option('-c, --config <file>', 'set the path to the config file. defaults to ./htmldoc.yaml')
    .option('-u, --urls <urls>', 'comma seperated list of urls to test')
    .option('-r, --reporter <default|table>', 'The results reporter to use')
    .option('-C, --cache <path>', 'Path to the HMTL cache')
    .option('-v, --verbose', 'Show additional log messages')
    .option('-V, --version', 'Show current version')
    .parse(process.argv);

  var configYaml = program.config || './config.yaml';

  try {
    config = yaml.safeLoad(fs.readFileSync(configYaml, 'utf8'));
  } catch (e) {

    logger.log(e, logger.LOG_CRITICAL);
  }

  config = _.defaults(config, {
    reporter: 'default',
    cache: '/tmp'
  });

  config.reporter = program.reporter ? program.reporter : config.reporter;
  config.cache = program.cache ? program.cache : config.cache;

  /*
   * Change to the directory the config yaml
   */
  process.chdir(path.dirname(configYaml));

  html(config).validateAll(config.files);

})();