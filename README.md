# babel-plugin-oxygen-css

A plugin for Babel v6 which transforms inline styles defined in JavaScript modules into class names so they become available to, e.g. the `className` prop of React elements.

While transforming, the plugin processes all JavaScript style definitions found and bundles them up into a CSS file, ready to be requested from your web server.

babel-plugin-oxygen-css works seamlessly on both client and server. It has built-in support for media queries, pseudo-classes, and attribute selectors. The plugin's options allow you to configure vendor-prefixing, minification, and class name compression.

## Example

In order for the plugin to work, in your components, surround each inline style specification with a module-level `cssInJS()` function call. This provides a hook for the plugin to process the first argument given to the call and then replace it with an object literal containing the resulting class names as values.

**In**

```jsx
<button className={styles.button} />

const styles = oxygenCss({
  button: {
    padding: 5,
    backgroundColor: "blue"
  }
});
```

**Out**

JavaScript:

```jsx
<button className={styles.button} />

var styles = {
  button: "example_js_styles_button"
};
```

CSS:

```css
.example_js_styles_button {
  padding: 5px;
  background-color: blue;
}
```

The stylesheet specification format is explained [further down](#stylesheet-specification-format).

Note the return value of `oxygenCss(...)` must be assigned to a variable. The name of the variable is used to distinguish multiple `oxygenCss` calls within a file.

## Installation

Install via npm:

```sh
$ npm install git+ssh://git@github.com/TriOxygen/babel-plugin-oxygen-css.git --save-dev
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["oxygen-css"]
}
```

### Via CLI

```sh
$ babel  --plugins oxygen-css  script.js
```

### Via Node API

```javascript
require('babel-core').transform('code', {
  plugins: ['oxygen-css']
});
```

## Options

The plugin allows configuration of several parameters which control the generated CSS. You can pass options to the plugin by using a two-element array when adding the plugin. For instance, using `.babelrc`:

```json
{
  "presets": [
    "es2015",
    "react"
  ],
  "plugins": [
    "foo-plugin",
    ["oxygen-css", { "vendorPrefixes": true, "bundleFile": "public/bundle.css" }]
  ]
}
```

**Available options:**

| Option               | Default       | Description                                                                                                                                                                                                                                                                                                                               |
|----------------------|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `vendorPrefixes`     | `false`       | If true, the generated CSS is run through [autoprefixer](https://www.npmjs.com/package/autoprefixer) to add vendor prefixes to the rules. If set to an object, it is passed to autoprefixer as `options` argument.                                                                                                                        |
| `minify`             | `false`       | Set to `true` to enable minification of the generated CSS. The popular [clean-css](https://www.npmjs.com/package/clean-css) package is used for this.                                                                                                                                                                                     |
| `compressClassNames` | `false`       | Set to `true` to shorten/obfuscate generated CSS class names. A class name like `"my_file-my_styles_var-my_name"` will so be converted to, e.g., `"_bf"`.                                                                                                                                                                                 |
| `mediaMap`           | `{}`          | This allows you to define media query shortcuts which are expanded on building the CSS. Example: using `{ phone: "media only screen and (max-width: 640px)" }` as value for this option and a stylesheet spec having `"@phone"` as a key, that key will be translated to `@media only screen and (max-width: 640px)` in the final CSS.    |
| `context`            | `null`        | If set to an object, each identifier found on the right-hand side of a style rule is substituted with the corresponding property value of this object. If set to a file path, the file is require'd and the exported object is used as stylesheet context.                                                                                |
| `cacheDir`           | `tmp/cache/`  | If you set the `compressClassNames` option to `true`, the class name cache will be persisted in a file in this directory.                                                                                                                                                                                                                 |
| `bundleFile`         | `bundle.css`  | All generated CSS is bundled into this file.                                                                                                                                                                                                                                                                                              |
| `identifier`         | `oxygenCss`   | The name used for detecting inline styles to transform.                                                                                                                                                                                                                                                                                   |


## Stylesheet Specification Format

Here's what you can put inside the parentheses of `oxygenCss(...)`.

**Simple Styles**

```js
{
  myButton: {
    border: 'solid 1px #ccc',
    backgroundColor: 'lightgray',
    display: 'inline-block'
  },

  myInput: {
    width: '100%',
    // ... etc.
  }
}
```

An inline style is not specified as a string. Instead it is specified with an object whose properties form the CSS ruleset for that style. A property's key is the camelCased version of the rule name, and the value is the rule's value, usually a string.

There's also a shorthand notation for specifying pixel values, see [this React tip](http://facebook.github.io/react/tips/style-props-value-px.html) for more details.

**Pseudo-Classes and Attribute Selectors**

```js
{
  myButton: {
    border: 'solid 1px #ccc',
    backgroundColor: 'lightgray',
    display: 'inline-block',
    cursor: 'pointer',

    ':focus': {
      borderColor: '#aaa'
    },

    ':hover': {
      borderColor: '#ddd',

      ':active': {
        borderColor: '#eee'
      }
    },

    '[disabled]': {
      cursor: 'not-allowed',
      opacity: .5,

      ':hover': {
        backgroundColor: 'transparent'
      }
    }
  }
}
```

As you can see, pseudo-classes and attribute selectors can be nested arbitrarily deep.
**Media Queries**
Media queries are also supported. All the media queries will be grouped in the output. Media queries cannot be at the root of the style object to make it easier to distinguish between keyframes and media queries.

```js
{
  myButton: {
    border: 'solid 1px #ccc',
    '@media only screen and (max-width: 480px)': {
      borderWidth: 0,
      ':hover': {
        borderWidth: 3
      }
    },
    '@media only screen and (max-width: 768px)': {
      borderWidth: 2,
    }
  },

  myInput: {
    width: '100%',
    // ...
    '@media only screen and (max-width: 480px)': {
      fontSize: 14
    }
  },


  },
}
```

Given you set `{ phone: 'media only screen and (max-width: 480px)', tablet: 'media only screen and (max-width: 768px)' }` as `mediaMap` option for the transformation, the above spec can be simplified to:

```js
{
  myButton: {
    border: 'solid 1px #ccc',

    '@phone': {
      borderWidth: 0,

      ':active': {
        borderColor: 'blue'
      }
    },

    '@tablet': {
      // ...
    }
  }
}
```

**Styling html elements**

You can style html elements by using all uppercased selectors:
```js
const appStyles = oxygenCss({
  HTML: {
    width: '100%',
    height: '100%',
    fontFamily: `'Hind Siliguri', sans-serif`,
    fontSize: 14,
    fontWeight: 400,
  },
  BODY: {
    width: '100%',
    height: '100%',
    fontFamily: `'Hind Siliguri', sans-serif`,
    fontSize: 14,
    fontWeight: 400,
    P: {
      fontSize: 16
    }
  },
});
```

CSS:

```css
html {
  width: 100%;
  height: 100%;
  font-family: 'Hind Siliguri', sans-serif;
  font-size: 14px;
  font-weight: 400;
}
body {
  width: 100%;
  height: 100%;
  font-family: 'Hind Siliguri', sans-serif;
  font-size: 14px;
  font-weight: 400;
}
body p {
  font-size: 16px;
}
```

**Child selectors etc**

Most useful css selectors are supported:

```js
const example = oxygenCss({
  root: {
    fontSize: 12,
    '&dense': {
      fontSize: 10
    },
    '>child': {
      fontSize: 9
    },
    ' dense2': {
      fontSize: 10
    },
    '+next': {
      fontSize: 8
    },
    '~sibling': {
      fontSize: 11
    }
  }
});
```

CSS:
```css
.src-containers-App-js-example-root {
  font-size: 12px;
}
.src-containers-App-js-example-root.src-containers-App-js-example-dense {
  font-size: 10px;
}
.src-containers-App-js-example-root > .src-containers-App-js-example-child {
  font-size: 9px;
}
.src-containers-App-js-example-root .src-containers-App-js-example-dense2 {
  font-size: 10px;
}
.src-containers-App-js-example-root + .src-containers-App-js-example-next {
  font-size: 8px;
}
.src-containers-App-js-example-root ~ .src-containers-App-js-example-sibling {
  font-size: 11px;
}
```

**Animations**
Keyframes are also supported. Only limitation is that keyframes have to be in the root of the style object:

JS:
```js
const keyframe = oxygenCss({
  '@sizeAnimation': {
    '0%': {
      width: 0
    },
    '100%': {
      width: 100
    }
  }
});
```

CSS:
```css
@keyframes sizeAnimation {
  0% {
    width: 0px;
  }
  100% {
    width: 100px;
  }
}
```

**Expressions in Style Rules**

You can do simple arithmetic and string concats on the right-hand side of style rules. Each identifier found is substituted with the corresponding property value of the `context` object provided as option.

Example for a given context `{ MyColors: { green: '#00FF00' }, myUrl: 'path/to/image.png' }`:

```js
{
  myButton: {
    color: MyColors.green,
    borderWidth: 42 + 'px',
    backgroundImage: 'url(' + myUrl + ')'
  }
}
```

## Caveats

* Just using `var styles = oxygenCss(...)` in your React modules and skipping the transformation step won't work. It's the transformation that is responsible for a) generating the real CSS, and b) turning your `oxygenCss(...)` calls into object literals holding the CSS class names so you can do `<foo className={styles.bar} />` without breaking React. But you are transpiling your JavaScript anyway to get these cool new ES2015 features, aren't you?
* Apart from simple arithmetic and string concats, a stylesheet specification cannot contain advanced dynamic stuff, because although the transformer parses the source input, it is not compiled. If you really need to add truly dynamic styles, that's what the `style` attribute/prop was made for. `style` also has the positive side-effect of taking precedence over class names.

## License

Released under The MIT License.


## Tests

Inc soon... (tm)

## Credits

This plugin is inspired by Martin Andert's babel-plugin-css-in-js
