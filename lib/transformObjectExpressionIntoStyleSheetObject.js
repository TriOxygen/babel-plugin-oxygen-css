'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = transformObjectExpressionIntoStyleSheetObject;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _vm = require('vm');

var _vm2 = _interopRequireDefault(_vm);

var _babelCore = require('babel-core');

var _babelGenerator = require('babel-generator');

var _babelGenerator2 = _interopRequireDefault(_babelGenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isBlank = /^\s*$/;

function transformObjectExpressionIntoStyleSheetObject(expr, context) {
  (0, _assert2.default)(_babelCore.types.isObjectExpression(expr), 'must be a object expression');

  context = _vm2.default.createContext(Object.assign({}, context));

  context.evaluate = function evaluate(node) {
    return _vm2.default.runInContext((0, _babelGenerator2.default)(node).code, this);
  };

  var result = {};

  expr.properties.forEach(function (property) {
    processTopLevelProperty(property.key, property.value, result, context);
  });

  return result;
}

function processTopLevelProperty(key, value, result, context) {
  var name = keyToName(key);

  (0, _assert2.default)(_babelCore.types.isObjectExpression(value), 'top-level value must be a object expression');

  result[name] = {};

  processProperties(value.properties, result[name], context);
}

function processProperties(properties, result, context) {
  properties.forEach(function (property) {
    processProperty(property.key, property.value, result, context);
  });
}

function processProperty(key, value, result, context) {
  var name = keyToName(key);

  if (canEvaluate(value, context)) {
    var val = context.evaluate(value);

    (0, _assert2.default)(typeof val === 'string' || typeof val === 'number', 'value must be a string or number');

    // if (typeof val === 'string') {
    //   assert(!isBlank.test(val), 'string value cannot be blank');
    // }

    result[name] = val;
  } else if (_babelCore.types.isObjectExpression(value)) {
    result[name] = {};

    processProperties(value.properties, result[name], context);
  } else if (_babelCore.types.isMemberExpression(value)) {
    result[name] = context.evaluate(value);
    // processProperties(value.properties, result[name], context);
  } else if (_babelCore.types.isUnaryExpression(value) && value.prefix === true && value.operator === '-') {
      (0, _assert2.default)(_babelCore.types.isLiteral(value.argument), 'invalid unary argument type');

      result[name] = -value.argument.value;
    } else {
      (0, _assert2.default)(false, 'invalid value expression type');
    }
}

function keyToName(key) {
  (0, _assert2.default)(_babelCore.types.isIdentifier(key) || _babelCore.types.isLiteral(key) && typeof key.value === 'string', 'key must be a string or identifier');

  return key.name || key.value;
}

function canEvaluate(expr, context) {
  if (_babelCore.types.isLiteral(expr)) {
    return true;
  } else if (_babelCore.types.isIdentifier(expr) && context.hasOwnProperty(expr.name)) {
    return true;
  } else if (_babelCore.types.isMemberExpression(expr)) {
    return _babelCore.types.isIdentifier(expr.property) && canEvaluate(expr.object, context);
  } else if (_babelCore.types.isBinaryExpression(expr)) {
    return canEvaluate(expr.left, context) && canEvaluate(expr.right, context);
  }

  return false;
}
module.exports = exports['default'];