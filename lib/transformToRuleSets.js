'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = transformToRuleSets;

var _generateClassName = require('./generateClassName');

var _isHtmlTag = require('./isHtmlTag');

var _isHtmlTag2 = _interopRequireDefault(_isHtmlTag);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var isMediaQueryDeclaration = /^@/;
var isDescendantSelector = /^ /;
var isClassSelector = /^\./;
var isAndSelector = /^\&/;
var isChildSelector = /^>/;
var isAdjacentSiblingSelector = /^\+/;
var isSiblingSelector = /^~/;
var isPseudoSelector = /^[:\[]/;
var isValidStyleName = /^.-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/;

var BlockDeclaration = function () {
  function BlockDeclaration() {
    _classCallCheck(this, BlockDeclaration);

    this.children = [];
  }

  _createClass(BlockDeclaration, [{
    key: 'add',
    value: function add(rule) {
      this.children.push(rule);
    }
  }, {
    key: 'toJson',
    value: function toJson() {
      var block = {};
      this.children.forEach(function (rule) {
        block[rule.key] = rule.value;
      });
      return block;
    }
  }]);

  return BlockDeclaration;
}();

var Declaration = function Declaration(key, value) {
  _classCallCheck(this, Declaration);

  this.key = key;
  this.value = value;
};

var NestedDeclaration = function () {
  function NestedDeclaration(rules) {
    var parent = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

    _classCallCheck(this, NestedDeclaration);

    this.block = new BlockDeclaration();
    this.combinators = [];
    this.mediaQueries = [];
    this.rules = rules;
    this.parent = parent;
  }

  _createClass(NestedDeclaration, [{
    key: 'process',
    value: function process() {
      var _this = this;

      this.selector = this.formSelector();
      Object.keys(this.rules).forEach(function (key) {
        var value = _this.rules[key];
        if (isMediaQueryDeclaration.test(key)) {
          _this.mediaQueries.push(new MediaQueryDeclaration(_this, key.substring(1), value));
        } else if (isPseudoSelector.test(key)) {
          _this.combinators.push(new PseudoCombinator(_this, key, value));
        } else if (isDescendantSelector.test(key)) {
          _this.combinators.push(new DescendantCombinator(_this, key.substring(1), value));
        } else if (isAndSelector.test(key)) {
          _this.combinators.push(new AndCombinator(_this, key.substring(1), value));
        } else if (isChildSelector.test(key)) {
          _this.combinators.push(new ChildCombinator(_this, key.substring(1), value));
        } else if (isAdjacentSiblingSelector.test(key)) {
          _this.combinators.push(new AdjacentSiblingCombinator(_this, key.substring(1), value));
        } else if (isSiblingSelector.test(key)) {
          _this.combinators.push(new SiblingCombinator(_this, key.substring(1), value));
        } else if ((0, _isHtmlTag2.default)(key)) {
          _this.combinators.push(new TagDeclaration(_this, key, value));
        } else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
          _this.combinators.push(new ClassDeclaration(_this, key, value));
        } else {
          _this.block.add(new Declaration(key, value));
        }
      });
    }
  }, {
    key: 'formSelector',
    value: function formSelector() {
      var selector = this.parent.selector.slice();
      return selector;
    }
  }, {
    key: 'store',
    value: function store(output) {
      output.declarations.push({
        selector: this.selector,
        blockDeclaration: this.block.toJson()
      });
    }
  }, {
    key: 'toJson',
    value: function toJson(output, options) {
      this.process();
      this.store(output);
      this.combinators.forEach(function (combinator) {
        return combinator.toJson(output, options);
      });
      this.mediaQueries.forEach(function (mediaQuery) {
        return mediaQuery.toJson(output, options);
      });
    }
  }]);

  return NestedDeclaration;
}();

var MediaQueryDeclaration = function (_NestedDeclaration) {
  _inherits(MediaQueryDeclaration, _NestedDeclaration);

  function MediaQueryDeclaration(parent, media, rules) {
    _classCallCheck(this, MediaQueryDeclaration);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(MediaQueryDeclaration).call(this, rules, parent));

    _this2.media = media;
    return _this2;
  }

  _createClass(MediaQueryDeclaration, [{
    key: 'store',
    value: function store(output) {
      output.mediaQueries[this.media] = output.mediaQueries[this.media] || [];
      output.mediaQueries[this.media].push({
        selector: this.selector,
        blockDeclaration: this.block.toJson()
      });
    }
  }, {
    key: 'toJson',
    value: function toJson(output, options) {
      this.process();
      this.store(output);
      this.combinators.forEach(function (combinator) {
        return combinator.toJson(output, options);
      });
    }
  }]);

  return MediaQueryDeclaration;
}(NestedDeclaration);

var ClassDeclaration = function (_NestedDeclaration2) {
  _inherits(ClassDeclaration, _NestedDeclaration2);

  function ClassDeclaration(parent, className, rules) {
    _classCallCheck(this, ClassDeclaration);

    var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(ClassDeclaration).call(this, rules, parent));

    _this3.className = className;
    return _this3;
  }

  _createClass(ClassDeclaration, [{
    key: 'formSelector',
    value: function formSelector() {
      if (this.parent) {
        var selector = this.parent.selector.slice();

        selector.push({
          pre: '.',
          className: this.className
        });
        return selector;
      } else {
        return [{
          pre: '.',
          className: this.className
        }];
      }
    }
  }, {
    key: 'toJson',
    value: function toJson(output, options) {
      output.classMap[this.className] = (0, _generateClassName.generateClassName)(this.rules, this.className, options);
      this.process();
      this.store(output);
      this.combinators.forEach(function (combinator) {
        return combinator.toJson(output, options);
      });
      this.mediaQueries.forEach(function (mediaQuery) {
        return mediaQuery.toJson(output, options);
      });
    }
  }]);

  return ClassDeclaration;
}(NestedDeclaration);

var TagDeclaration = function (_NestedDeclaration3) {
  _inherits(TagDeclaration, _NestedDeclaration3);

  function TagDeclaration(parent, tagName, rules) {
    _classCallCheck(this, TagDeclaration);

    var _this4 = _possibleConstructorReturn(this, Object.getPrototypeOf(TagDeclaration).call(this, rules, parent));

    _this4.tagName = tagName;
    return _this4;
  }

  _createClass(TagDeclaration, [{
    key: 'formSelector',
    value: function formSelector() {
      if (this.parent) {
        var selector = this.parent.selector.slice();
        selector.push({
          pre: ' ',
          token: this.tagName.toLowerCase()
        });
        return selector;
      } else {
        return [{
          token: this.tagName.toLowerCase()
        }];
      }
    }
  }]);

  return TagDeclaration;
}(NestedDeclaration);

var CombinatorDeclaration = function (_NestedDeclaration4) {
  _inherits(CombinatorDeclaration, _NestedDeclaration4);

  function CombinatorDeclaration(parent, combinatorSelector, rules) {
    _classCallCheck(this, CombinatorDeclaration);

    var _this5 = _possibleConstructorReturn(this, Object.getPrototypeOf(CombinatorDeclaration).call(this, rules, parent));

    _this5.operand = ' ';
    _this5.pre = ' ';
    _this5.post = ' ';

    _this5.combinatorSelector = combinatorSelector;
    if (!(0, _isHtmlTag2.default)(combinatorSelector)) {
      _this5.className = combinatorSelector;
    }
    return _this5;
  }

  _createClass(CombinatorDeclaration, [{
    key: 'formSelector',
    value: function formSelector() {
      var selector = this.parent.selector.slice();
      selector.push({
        pre: this.pre,
        token: this.operand,
        post: this.post
      });
      if (this.className) {
        selector.push({
          pre: '.',
          className: this.className
        });
      } else {
        selector.push({
          token: this.combinatorSelector
        });
      }
      return selector;
    }
  }, {
    key: 'store',
    value: function store(output) {
      output.declarations.push({
        selector: this.selector,
        blockDeclaration: this.block.toJson()
      });
    }
  }, {
    key: 'toJson',
    value: function toJson(output, options) {
      if (this.className) {
        output.classMap[this.className] = (0, _generateClassName.generateClassName)(this.rules, this.className, options);
      }
      this.process();
      this.store(output);
      this.combinators.forEach(function (combinator) {
        return combinator.toJson(output, options);
      });
      this.mediaQueries.forEach(function (mediaQuery) {
        return mediaQuery.toJson(output, options);
      });
    }
  }]);

  return CombinatorDeclaration;
}(NestedDeclaration);

var PseudoCombinator = function (_CombinatorDeclaratio) {
  _inherits(PseudoCombinator, _CombinatorDeclaratio);

  function PseudoCombinator() {
    var _Object$getPrototypeO;

    var _temp, _this6, _ret;

    _classCallCheck(this, PseudoCombinator);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this6 = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(PseudoCombinator)).call.apply(_Object$getPrototypeO, [this].concat(args))), _this6), _this6.operand = '', _this6.pre = '', _this6.post = '', _temp), _possibleConstructorReturn(_this6, _ret);
  }

  _createClass(PseudoCombinator, [{
    key: 'formSelector',
    value: function formSelector() {
      var selector = this.parent.selector.slice();
      selector.push({
        token: this.combinatorSelector
      });
      return selector;
    }
  }, {
    key: 'toJson',
    value: function toJson(output, options) {
      this.process();
      this.store(output);
      this.combinators.forEach(function (combinator) {
        return combinator.toJson(output, options);
      });
      this.mediaQueries.forEach(function (mediaQuery) {
        return mediaQuery.toJson(output, options);
      });
    }
  }]);

  return PseudoCombinator;
}(CombinatorDeclaration);

var DescendantCombinator = function (_CombinatorDeclaratio2) {
  _inherits(DescendantCombinator, _CombinatorDeclaratio2);

  function DescendantCombinator() {
    var _Object$getPrototypeO2;

    var _temp2, _this7, _ret2;

    _classCallCheck(this, DescendantCombinator);

    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return _ret2 = (_temp2 = (_this7 = _possibleConstructorReturn(this, (_Object$getPrototypeO2 = Object.getPrototypeOf(DescendantCombinator)).call.apply(_Object$getPrototypeO2, [this].concat(args))), _this7), _this7.operand = ' ', _this7.pre = '', _this7.post = '', _temp2), _possibleConstructorReturn(_this7, _ret2);
  }

  return DescendantCombinator;
}(CombinatorDeclaration);

var AndCombinator = function (_CombinatorDeclaratio3) {
  _inherits(AndCombinator, _CombinatorDeclaratio3);

  function AndCombinator() {
    var _Object$getPrototypeO3;

    var _temp3, _this8, _ret3;

    _classCallCheck(this, AndCombinator);

    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    return _ret3 = (_temp3 = (_this8 = _possibleConstructorReturn(this, (_Object$getPrototypeO3 = Object.getPrototypeOf(AndCombinator)).call.apply(_Object$getPrototypeO3, [this].concat(args))), _this8), _this8.operand = '', _this8.pre = '', _this8.post = '', _temp3), _possibleConstructorReturn(_this8, _ret3);
  }

  return AndCombinator;
}(CombinatorDeclaration);

var ChildCombinator = function (_CombinatorDeclaratio4) {
  _inherits(ChildCombinator, _CombinatorDeclaratio4);

  function ChildCombinator() {
    var _Object$getPrototypeO4;

    var _temp4, _this9, _ret4;

    _classCallCheck(this, ChildCombinator);

    for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }

    return _ret4 = (_temp4 = (_this9 = _possibleConstructorReturn(this, (_Object$getPrototypeO4 = Object.getPrototypeOf(ChildCombinator)).call.apply(_Object$getPrototypeO4, [this].concat(args))), _this9), _this9.operand = '>', _temp4), _possibleConstructorReturn(_this9, _ret4);
  }

  return ChildCombinator;
}(CombinatorDeclaration);

var AdjacentSiblingCombinator = function (_CombinatorDeclaratio5) {
  _inherits(AdjacentSiblingCombinator, _CombinatorDeclaratio5);

  function AdjacentSiblingCombinator() {
    var _Object$getPrototypeO5;

    var _temp5, _this10, _ret5;

    _classCallCheck(this, AdjacentSiblingCombinator);

    for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
      args[_key5] = arguments[_key5];
    }

    return _ret5 = (_temp5 = (_this10 = _possibleConstructorReturn(this, (_Object$getPrototypeO5 = Object.getPrototypeOf(AdjacentSiblingCombinator)).call.apply(_Object$getPrototypeO5, [this].concat(args))), _this10), _this10.operand = '+', _temp5), _possibleConstructorReturn(_this10, _ret5);
  }

  return AdjacentSiblingCombinator;
}(CombinatorDeclaration);

var SiblingCombinator = function (_CombinatorDeclaratio6) {
  _inherits(SiblingCombinator, _CombinatorDeclaratio6);

  function SiblingCombinator() {
    var _Object$getPrototypeO6;

    var _temp6, _this11, _ret6;

    _classCallCheck(this, SiblingCombinator);

    for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
      args[_key6] = arguments[_key6];
    }

    return _ret6 = (_temp6 = (_this11 = _possibleConstructorReturn(this, (_Object$getPrototypeO6 = Object.getPrototypeOf(SiblingCombinator)).call.apply(_Object$getPrototypeO6, [this].concat(args))), _this11), _this11.operand = '~', _temp6), _possibleConstructorReturn(_this11, _ret6);
  }

  return SiblingCombinator;
}(CombinatorDeclaration);

function transformToRuleSets(obj, options, output) {
  output.classMap = output.classMap || {};
  output.declarations = output.declarations || [];
  output.mediaQueries = output.mediaQueries || [];

  Object.keys(obj).forEach(function (key) {
    var value = obj[key];
    if ((0, _isHtmlTag2.default)(key)) {
      var dec = new TagDeclaration(null, key, value);
      dec.toJson(output, options);
    } else {
      var _dec = new ClassDeclaration(null, key, value);
      _dec.toJson(output, options);
    }
  });
}
module.exports = exports['default'];