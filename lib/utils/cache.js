var sh = require("shorthash");
var fs = require("fs");
var path = require("path");

module.exports = function(location) {

  var getHash = function(value) {
    return sh.unique(value);
  };

  var get = function(key) {
    var contents;

    key = getHash(key);
    var cacheFilePath = path.join(location, key);

    if ( !fs.existsSync(cacheFilePath) ) {
      return false;
    }

    contents = fs.readFileSync(cacheFilePath, 'utf8');

    return contents;

  };

  var set = function(key, value) {

    if ( !fs.existsSync(location) ) {
      fs.mkdirSync(location);
    }

    fs.writeFileSync(path.join(location, getHash(key)), value);
  };

  return {
    get: get,
    set: set
  }


};