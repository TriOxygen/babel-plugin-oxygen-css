'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.default = buildCSS;

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

var _autoprefixer = require('autoprefixer');

var _autoprefixer2 = _interopRequireDefault(_autoprefixer);

var _cleanCss = require('clean-css');

var _cleanCss2 = _interopRequireDefault(_cleanCss);

var _unitlessNumbers = require('./unitlessNumbers');

var _unitlessNumbers2 = _interopRequireDefault(_unitlessNumbers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isUnquotedContentValue = /^(normal|none|(\b(url\([^)]*\)|chapter_counter|attr\([^)]*\)|(no-)?(open|close)-quote|inherit)((\b\s*)|$|\s+))+)$/;
var uppercaseLetter = /([A-Z])/g;

function combineSelector(selectors, classMap) {
  return selectors.map(function (selector) {
    var className = '';
    if (selector.className) {
      className = selector.className && classMap[selector.className] || selector.className;
    }
    var pre = selector.pre || '';
    var post = selector.post || '';
    var token = selector.token || '';
    return '' + pre + token + className + post;
  }).join('');
}

function buildCSSRule(key, value) {
  if (!_unitlessNumbers2.default[key] && typeof value === 'number') {
    value = '' + value + 'px';
  } else if (key === 'content' && !isUnquotedContentValue.test(value)) {
    value = "'" + value.replace(/'/g, "\\'") + "'";
  }

  return hyphenate(key) + ': ' + value + ';';
}

function hyphenate(string) {
  return string.replace(uppercaseLetter, '-$1').toLowerCase();
}

function buildBlock(selector, block, output) {
  var indent = arguments.length <= 3 || arguments[3] === undefined ? '' : arguments[3];

  output.push(indent + selector + ' {');
  Object.keys(block).forEach(function (key) {
    var value = block[key];
    output.push(indent + '  ' + buildCSSRule(key, value));
  });
  output.push(indent + '}');
}

function buildKeyframes(keyframesName, keyframes, output) {
  output.push('@keyframes ' + keyframesName + ' {');
  Object.keys(keyframes).forEach(function (frame) {
    var block = keyframes[frame];
    output.push('  ' + frame + ' {');
    Object.keys(block).forEach(function (key) {
      var value = block[key];
      output.push('    ' + buildCSSRule(key, value));
    });
    output.push('  }');
  });
  output.push('}');
}

function combineFiles(cache, mediaMap) {
  var mediaQueries = {};
  var rules = [];
  Object.keys(cache).forEach(function (filename) {
    var fileOutput = cache[filename].stylesheets;
    Object.keys(fileOutput).forEach(function (sheetId) {
      var sheet = fileOutput[sheetId];
      sheet.declarations.forEach(function (declaration) {
        buildBlock(combineSelector(declaration.selector, sheet.classMap), declaration.blockDeclaration, rules);
      });
      Object.keys(sheet.keyframes).forEach(function (keyframe) {
        var keyframes = sheet.keyframes[keyframe];
        buildKeyframes(keyframe, keyframes, rules);
      });
      Object.keys(sheet.mediaQueries).forEach(function (media) {
        var mediaString = mediaMap[media] || media;
        mediaQueries[mediaString] = mediaQueries[mediaString] || [];
        sheet.mediaQueries[media].forEach(function (declaration) {
          buildBlock(combineSelector(declaration.selector, sheet.classMap), declaration.blockDeclaration, mediaQueries[mediaString], '  ');
        });
      });
    });
  });
  Object.keys(mediaQueries).forEach(function (mediaString) {
    var mediaRules = mediaQueries[mediaString];
    rules.push('@' + mediaString + ' {');
    mediaRules.forEach(function (rule) {
      return rules.push(rule);
    });
    rules.push('}');
  });
  return rules;
}

function buildCSS(cache, options) {
  var output = combineFiles(cache, options.mediaMap).join('\n');
  if (output.length === 0) {
    return output;
  }
  var vp = options.vendorPrefixes;

  if (vp) {
    if ((typeof vp === 'undefined' ? 'undefined' : _typeof(vp)) === 'object') {
      output = (0, _postcss2.default)([(0, _autoprefixer2.default)(vp)]).process(output).css;
    } else {
      output = (0, _postcss2.default)([_autoprefixer2.default]).process(output).css;
    }
  }

  if (options.minify) {
    output = new _cleanCss2.default({
      keepBreaks: true
    }).minify(output).styles;
  }
  return output;
}
module.exports = exports['default'];