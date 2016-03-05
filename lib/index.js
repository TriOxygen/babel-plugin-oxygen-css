'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = plugin;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _fs = require('fs');

var _path = require('path');

var _mkdirp = require('mkdirp');

var _buildCSS = require('./buildCSS');

var _buildCSS2 = _interopRequireDefault(_buildCSS);

var _transformToRuleSets = require('./transformToRuleSets');

var _transformToRuleSets2 = _interopRequireDefault(_transformToRuleSets);

var _transformObjectExpressionIntoStyleSheetObject = require('./transformObjectExpressionIntoStyleSheetObject');

var _transformObjectExpressionIntoStyleSheetObject2 = _interopRequireDefault(_transformObjectExpressionIntoStyleSheetObject);

var _generateClassName = require('./generateClassName');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var KEY = 'OXYGEN_STYLE';

var DEFAULT_OPTIONS = {
  identifier: 'oxygenCss',
  vendorPrefixes: false,
  minify: false,
  compressClassNames: false,
  mediaMap: {},
  context: null,
  bundleFile: 'bundle.css',
  cacheDir: 'tmp/cache/'
};

function plugin(context) {
  context[KEY] = {
    cache: {},
    visiting: {}
  };

  return {
    visitor: visitor(context)
  };
}

function visitor(context) {
  var t = context.types;

  return {
    Program: {
      enter: function enter() {
        var filename = (0, _path.relative)(process.cwd(), this.file.opts.filename);
        this.opts = buildOptions(this.opts, filename);
        this.oxygenCss = { filename: filename, stylesheets: {}, declarations: 0 };
        context[KEY].visiting[filename] = true;
      },
      exit: function exit() {
        var filename = this.oxygenCss.filename;


        if (!context[KEY].visiting[filename]) return;

        if (this.oxygenCss.declarations > 0) {
          context[KEY].cache[filename] = this.oxygenCss;
        } else {
          delete context[KEY].cache[filename];
        }
        if (Object.keys(context[KEY].cache).length > 0 && this.opts.bundleFile) {
          var bundleFile = (0, _path.join)(process.cwd(), this.opts.bundleFile);
          (0, _mkdirp.sync)((0, _path.dirname)(bundleFile));
          var bundleCSS = (0, _buildCSS2.default)(context[KEY].cache, this.opts);
          (0, _fs.writeFileSync)(bundleFile, bundleCSS, { encoding: 'utf8' });
        }
        context[KEY].visiting[filename] = false;
      }
    },

    CallExpression: function CallExpression(path) {
      if (!t.isIdentifier(path.node.callee, { name: this.opts.identifier })) {
        return;
      }

      (0, _assert2.default)(t.isVariableDeclarator(path.parentPath.node), 'return value of oxygenCss(...) must be assigned to a variable');

      var sheetId = path.parentPath.node.id.name;
      var expr = path.node.arguments[0];
      var _opts = this.opts;
      var context = _opts.context;
      var prefix = _opts.prefix;
      var compressClassNames = _opts.compressClassNames;


      (0, _assert2.default)(expr, 'oxygenCss(...) call is missing an argument');

      var sheet = {};
      var obj = (0, _transformObjectExpressionIntoStyleSheetObject2.default)(expr, context);
      (0, _transformToRuleSets2.default)(obj, Object.assign({}, this.opts, { sheetId: sheetId }), sheet);
      this.oxygenCss.stylesheets[sheetId] = sheet;
      this.oxygenCss.declarations += Object.keys(sheet.classMap).length;

      var properties = Object.keys(sheet.classMap).reduce(function (memo, styleId) {
        return memo.concat(t.objectProperty(t.identifier(styleId), t.stringLiteral(sheet.classMap[styleId])));
      }, []);
      path.replaceWith(t.objectExpression(properties));
    }
  };
}

var contextFileCache = {};

function buildOptions(options, filename) {
  options = Object.assign({}, DEFAULT_OPTIONS, options, { filename: filename });

  if (typeof options.context === 'string') {
    var file = (0, _path.resolve)(options.context);

    if (typeof contextFileCache[file] === 'undefined') {
      contextFileCache[file] = require(file);
    }

    options.context = contextFileCache[file];
  }

  return options;
}
module.exports = exports['default'];