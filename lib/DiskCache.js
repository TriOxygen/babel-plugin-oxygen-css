'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var hasOwnProperty = Object.prototype.hasOwnProperty;

function remove(filePath) {
  if (_fs2.default.existsSync(filePath)) {
    _fs2.default.unlinkSync(filePath);
  }
}

function load(filePath) {
  if (!_fs2.default.existsSync(filePath)) {
    _mkdirp2.default.sync(_path2.default.dirname(filePath));
    store({}, filePath);
    return {};
  }

  var data = _fs2.default.readFileSync(filePath, { encoding: 'utf8' });

  return JSON.parse(data);
}

function store(data, filePath) {
  _fs2.default.writeFileSync(filePath, JSON.stringify(data));
}

var DiskCache = function () {
  function DiskCache(name, options) {
    _classCallCheck(this, DiskCache);

    this.filePath = _path2.default.resolve(_path2.default.join(options.cacheDir, 'oxygen-css', name + '.json'));

    this.fetch.bind(this);
    this.clear.bind(this);
  }

  _createClass(DiskCache, [{
    key: 'fetch',
    value: function fetch(key, miss) {
      var cache = load(this.filePath);
      if (hasOwnProperty.call(cache, key)) {
        return cache[key];
      }
      cache[key] = miss(Object.keys(cache));
      store(cache, this.filePath);
      return cache[key];
    }
  }, {
    key: 'clear',
    value: function clear() {
      remove(this.filePath);
    }
  }]);

  return DiskCache;
}();

exports.default = DiskCache;
module.exports = exports['default'];