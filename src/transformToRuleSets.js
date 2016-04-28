import { generateClassName } from './generateClassName';
import isHtmlTag from './isHtmlTag';

const isMediaQueryDeclaration = /^@/;
const isKeyframesDeclaration = /^@/;
const isDescendantSelector = /^ /;
const isClassSelector = /^\./;
const isAndSelector = /^\&/;
const isChildSelector = /^>/;
const isAdjacentSiblingSelector = /^\+/;
const isSiblingSelector = /^~/;
const isPseudoSelector = /^[:\[]/;
const isValidStyleName = /^.-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/;



class BlockDeclaration {

  constructor() {
    this.children = [];
  }

  add(rule) {
    this.children.push(rule);
  }

  toJson() {
    const block = {};
    this.children.forEach(rule => {
      block[rule.key] = rule.value;
    });
    return block;
  }

}


class KeyframesDeclaration {

  constructor(name, frames) {
    this.name = name;
    this.frames = {};
    this.rules = frames;
  }

  store(output) {
    output.keyframes[this.name] = this.rules;
  }

  toJson(output, options) {
    this.store(output);
  }
}

class Declaration {
  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
}

class NestedDeclaration {

  constructor(rules, parent = null) {
    this.block = new BlockDeclaration();
    this.combinators = [];
    this.mediaQueries = [];
    this.rules = rules;
    this.parent = parent;
  }

  process() {
    this.selector = this.formSelector();
    Object.keys(this.rules).forEach(key => {
      const value = this.rules[key];
      if (isMediaQueryDeclaration.test(key)) {
        this.mediaQueries.push(new MediaQueryDeclaration(this, key.substring(1), value));
      } else if (isPseudoSelector.test(key)) {
        this.combinators.push(new PseudoCombinator(this, key, value));
      } else if (isDescendantSelector.test(key)) {
        this.combinators.push(new DescendantCombinator(this, key.substring(1), value));
      } else if (isAndSelector.test(key)) {
        this.combinators.push(new AndCombinator(this, key.substring(1), value));
      } else if (isChildSelector.test(key)) {
        this.combinators.push(new ChildCombinator(this, key.substring(1), value));
      } else if (isAdjacentSiblingSelector.test(key)) {
        this.combinators.push(new AdjacentSiblingCombinator(this, key.substring(1), value));
      } else if (isSiblingSelector.test(key)) {
        this.combinators.push(new SiblingCombinator(this, key.substring(1), value));
      } else if (isHtmlTag(key)) {
        this.combinators.push(new TagDeclaration(this, key, value));
      } else if (typeof(value) === 'object' ) {
        this.combinators.push(new ClassDeclaration(this, key, value));
      } else {
        this.block.add(new Declaration(key, value));
      }
    });
  }

  formSelector() {
    const selector = this.parent.selector.slice();
    return selector;
  }

  store(output) {
    output.declarations.push({
      selector: this.selector,
      blockDeclaration: this.block.toJson()
    });
  }

  toJson(output, options) {
    this.process();
    this.store(output);
    this.combinators.forEach(combinator => combinator.toJson(output, options));
    this.mediaQueries.forEach(mediaQuery => mediaQuery.toJson(output, options));
  }
}

class MediaQueryDeclaration extends NestedDeclaration {
  constructor(parent, media, rules) {
    super(rules, parent);
    this.media = media;
  }

  store(output) {
    output.mediaQueries[this.media] = output.mediaQueries[this.media] || [];
    output.mediaQueries[this.media].push({
      selector : this.selector,
      blockDeclaration: this.block.toJson()
    });
  }

  toJson(output, options) {
    this.process();
    this.store(output);
    this.combinators.forEach(combinator => combinator.toJson(output, options));
  }

}


class ClassDeclaration extends NestedDeclaration {

  constructor(parent, className, rules) {
    super(rules, parent);
    this.className = className;
  }

  formSelector() {
    if (this.parent) {
      const selector = this.parent.selector.slice();

      selector.push({
        pre: ' .',
        className: this.className,
      });
      return selector;
    } else {
      return [{
        pre: '.',
        className: this.className,
      }]
    }
  }


  toJson(output, options) {
    output.classMap[this.className] = generateClassName(this.rules, this.className, options);
    this.process();
    this.store(output);
    this.combinators.forEach(combinator => combinator.toJson(output, options));
    this.mediaQueries.forEach(mediaQuery => mediaQuery.toJson(output, options));
  }
}

class TagDeclaration extends NestedDeclaration {
  constructor(parent, tagName, rules) {
    super(rules, parent);
    this.tagName = tagName;
  }

  formSelector() {
    if (this.parent) {
      const selector = this.parent.selector.slice();
      selector.push({
        pre: ' ',
        token: this.tagName.toLowerCase(),
      });
      return selector;
    } else {
      return [{
        token: this.tagName.toLowerCase(),
      }];
    }
  }
}

class CombinatorDeclaration extends NestedDeclaration {
  operand = ' ';
  pre = ' ';
  post = ' ';

  constructor(parent, combinatorSelector, rules) {
    super(rules, parent);
    this.combinatorSelector = combinatorSelector;
    if (!isHtmlTag(combinatorSelector)) {
      this.className = combinatorSelector;
    } else {
      this.combinatorSelector = combinatorSelector.toLowerCase();
    }
  }

  formSelector() {
    const selector = this.parent.selector.slice();
    selector.push({
      pre: this.pre,
      token: this.operand,
      post: this.post,
    });
    if (this.className) {
      selector.push({
        pre: '.',
        className: this.className,
      });
    } else {
      selector.push({
        token: this.combinatorSelector,
      });
    }
    return selector;
  }

  store(output) {
    output.declarations.push({
      selector: this.selector,
      blockDeclaration: this.block.toJson()
    });
  }

  toJson(output, options) {
    if (this.className) {
      output.classMap[this.className] = generateClassName(this.rules, this.className, options);
    }
    this.process();
    this.store(output);
    this.combinators.forEach(combinator => combinator.toJson(output, options));
    this.mediaQueries.forEach(mediaQuery => mediaQuery.toJson(output, options));
  }

}

class PseudoCombinator extends CombinatorDeclaration {
  operand = '';
  pre = '';
  post = '';


  formSelector() {
    const selector = this.parent.selector.slice();
    selector.push({
      token: this.combinatorSelector,
    });
    return selector;
  }

  toJson(output, options) {
    this.process();
    this.store(output);
    this.combinators.forEach(combinator => combinator.toJson(output, options));
    this.mediaQueries.forEach(mediaQuery => mediaQuery.toJson(output, options));
  }

}

class DescendantCombinator extends CombinatorDeclaration {
  operand = ' ';
  pre = '';
  post = '';

}

class AndCombinator extends CombinatorDeclaration {
  operand = '';
  pre = '';
  post = '';

}

class ChildCombinator extends CombinatorDeclaration {
  operand = '>';
}

class AdjacentSiblingCombinator extends CombinatorDeclaration {
  operand = '+';
}

class SiblingCombinator extends CombinatorDeclaration {
  operand = '~';
}

export default function transformToRuleSets(obj, options, output) {
  output.classMap = output.classMap || {};
  output.declarations = output.declarations || [];
  output.mediaQueries = output.mediaQueries || [];
  output.keyframes = output.keyframes || {};

  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (isKeyframesDeclaration.test(key)) {
      const dec = new KeyframesDeclaration(key.substring(1), value);
      dec.toJson(output, options);
    } else if (isHtmlTag(key)) {
      const dec = new TagDeclaration(null, key, value);
      dec.toJson(output, options);
    } else {
      const dec = new ClassDeclaration(null, key, value);
      dec.toJson(output, options);
    }
  });
}