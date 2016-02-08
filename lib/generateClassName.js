'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clearCache = clearCache;
exports.generateClassName = generateClassName;

var _DiskCache = require('./DiskCache');

var _DiskCache2 = _interopRequireDefault(_DiskCache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var invalidChars = /[^_a-z0-9-]/ig;

var cacheName = 'classnames';

var digitsStr =
//   0       8       16      24      32      40      48      56     63
//   v       v       v       v       v       v       v       v      v
"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";
var digits = digitsStr.split('');
var digitsMap = {};
for (var i = 0; i < digits.length; i++) {
  digitsMap[digits[i]] = i;
}

function getCache(options) {
  return new _DiskCache2.default(cacheName, options);
}

function clearCache(options) {
  getCache(options).clear();
}

function fromInt(int32) {
  var result = '';
  while (true) {
    result = digits[int32 & 0x3f] + result;
    int32 >>>= 6;
    if (int32 === 0) break;
  }
  return result;
}

function hashString(str) {
  var i = str.length;
  var hash = 5381 + i;

  while (i) {
    hash = hash * 33 ^ str.charCodeAt(--i);
  }

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
  var cache = getCache(options);

  if (options.compressClassNames) {
    return cache.fetch(identifier, function (keys) {
      return options.prefix + '_' + fromInt(keys.length);
    });
  }
  return identifier;
}