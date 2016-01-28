'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateClassName = generateClassName;
var invalidChars = /[^_a-z0-9-]/ig;

var id = 0;

var cache = {};

function hashString(str) {
  var i = str.length;
  var hash = 5381 + i;

  while (i) {
    hash = hash * 33 ^ str.charCodeAt(--i);
  }

  /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
   * integers. Since we want the results to be always positive, convert the
   * signed int to an unsigned by doing an unsigned bitshift. */
  return hash >>> 0;
}

function sortObject(obj) {
  return Object.keys(obj).sort().reduce(function (acc, key) {
    var val = obj[key];
    if (val || val === 0) acc[key] = val;
    return acc;
  }, {});
}

function generateClassName(obj, className, options) {
  var identifier = options.prefix + options.filename.replace(invalidChars, '-') + '-' + options.sheetId + '-' + className;
  if (options.compressClassNames) {
    cache[identifier] = cache[identifier] || options.prefix + '_' + (++id).toString(36);
    return cache[identifier];
  }
  return identifier;
}