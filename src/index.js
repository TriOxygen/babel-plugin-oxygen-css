import assert from 'assert';
import { writeFileSync } from 'fs';
import { relative, join, dirname, resolve } from 'path';
import { sync as mkDirPSync } from 'mkdirp';
import buildCSS from './buildCSS';
import transformToRuleSets from './transformToRuleSets';
import transformObjectExpressionIntoStyleSheetObject from './transformObjectExpressionIntoStyleSheetObject';
import { resetClassNames} from './generateClassName';

const KEY = 'OXYGEN_STYLE'

const DEFAULT_OPTIONS = {
  identifier: 'oxygenCss',
  vendorPrefixes: false,
  minify: false,
  compressClassNames: false,
  mediaMap: {},
  context: null,
  bundleFile: 'bundle.css',
  cacheDir: 'tmp/cache/'
};

export default function plugin(context) {
  context[KEY] = {
    cache: {},
    visiting: {},
  };

  return {
    visitor: visitor(context),
  };
}


function visitor(context) {
  const t = context.types;

  return {
    Program: {
      enter() {
        const filename = relative(process.cwd(), this.file.opts.filename);
        this.opts = buildOptions(this.opts, filename);
        this.oxygenCss = { filename, stylesheets: {}, declarations: 0 };
        context[KEY].visiting[filename] = true;
      },

      exit() {
        const { filename } = this.oxygenCss;

        if (!context[KEY].visiting[filename]) return;

        if (this.oxygenCss.declarations > 0) {
          context[KEY].cache[filename] = this.oxygenCss;
        } else {
          delete context[KEY].cache[filename];
        }
        if (Object.keys(context[KEY].cache).length > 0 && this.opts.bundleFile) {
          const bundleFile = join(process.cwd(), this.opts.bundleFile);
          mkDirPSync(dirname(bundleFile));
          const bundleCSS = buildCSS(context[KEY].cache, this.opts);
          writeFileSync(bundleFile, bundleCSS, { encoding: 'utf8' });
        }
        context[KEY].visiting[filename] = false;
      },
    },

    CallExpression(path) {
      if (!t.isIdentifier(path.node.callee, { name: this.opts.identifier })) {
        return;
      }

      assert(
        t.isVariableDeclarator(path.parentPath.node),
        'return value of oxygenCss(...) must be assigned to a variable'
      );

      const sheetId = path.parentPath.node.id.name;
      const expr = path.node.arguments[0];
      const { context, prefix, compressClassNames } = this.opts;

      assert(expr, 'oxygenCss(...) call is missing an argument');

      const sheet = {};
      const obj = transformObjectExpressionIntoStyleSheetObject(expr, context);
      transformToRuleSets(obj, Object.assign({}, this.opts, {sheetId}), sheet);
      this.oxygenCss.stylesheets[sheetId] = sheet;
      // this.oxygenCss.declarations += Object.keys(sheet.classMap).length;
      this.oxygenCss.declarations += sheet.declarations.length;

      const properties = Object.keys(sheet.classMap).reduce((memo, styleId) => {
        return memo.concat(
          t.objectProperty(
            t.identifier(styleId),
            t.stringLiteral(sheet.classMap[styleId])
          )
        );
      }, []);
      path.replaceWith(t.objectExpression(properties));
    },
  };
}

const contextFileCache = {};

function buildOptions(options, filename) {
  options = Object.assign({}, DEFAULT_OPTIONS, options, { filename });

  if (typeof options.context === 'string') {
    const file = resolve(options.context);
    if (typeof contextFileCache[file] === 'undefined') {
      try {
        contextFileCache[file] = require(file);
      } catch (error) {
        console.error(error);
      }
    }

    options.context = contextFileCache[file];
  }
  return options;
}
