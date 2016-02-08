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
  identifier: 'oxygenStyle',
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
        this.oxygenStyle = { filename, stylesheets: {}, declarations: 0 };
        context[KEY].visiting[filename] = true;
      },

      exit() {
        const { filename } = this.oxygenStyle;

        if (!context[KEY].visiting[filename]) return;

        if (this.oxygenStyle.declarations > 0) {
          context[KEY].cache[filename] = this.oxygenStyle;
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
        'return value of oxygenStyle(...) must be assigned to a variable'
      );

      const sheetId = path.parentPath.node.id.name;
      const expr = path.node.arguments[0];
      const { context, prefix, compressClassNames } = this.opts;

      assert(expr, 'oxygenStyle(...) call is missing an argument');

      const sheet = {};
      const obj = transformObjectExpressionIntoStyleSheetObject(expr, context);
      transformToRuleSets(obj, Object.assign({}, this.opts, {sheetId}), sheet);
      this.oxygenStyle.stylesheets[sheetId] = sheet;
      this.oxygenStyle.declarations += Object.keys(sheet.classMap).length;

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
      contextFileCache[file] = require(file);
    }

    options.context = contextFileCache[file];
  }

  return options;
}
