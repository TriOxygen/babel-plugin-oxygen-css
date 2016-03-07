import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import CleanCSS from 'clean-css';
import unitlessNumbers from './unitlessNumbers';

const isUnquotedContentValue = /^(normal|none|(\b(url\([^)]*\)|chapter_counter|attr\([^)]*\)|(no-)?(open|close)-quote|inherit)((\b\s*)|$|\s+))+)$/;
const uppercaseLetter = /([A-Z])/g;

function combineSelector(selectors, classMap) {
  return selectors.map(selector => {
    let className = '';
    if (selector.className) {
      className = selector.className && classMap[selector.className] || selector.className;
    }
    const pre = selector.pre || '';
    const post = selector.post || '';
    const token = selector.token || '';
    return `${pre}${token}${className}${post}`;
  }).join('');
}

function buildCSSRule(key, value) {
  if (!unitlessNumbers[key] && typeof value === 'number') {
    value = '' + value + 'px';
  } else if (key === 'content' && !isUnquotedContentValue.test(value)) {
    value = "'" + value.replace(/'/g, "\\'") + "'";
  }

  return hyphenate(key) + ': ' + value + ';';
}

function hyphenate(string) {
  return string.replace(uppercaseLetter, '-$1').toLowerCase();
}

function buildBlock(selector, block, output, indent = '') {
  output.push(indent + selector + ' {');
  Object.keys(block).forEach(key => {
    const value = block[key];
    output.push(indent + '  ' + buildCSSRule(key, value));
  });
  output.push(indent + '}');
}

function buildKeyframes(keyframesName, keyframes, output) {
  output.push('@keyframes ' + keyframesName + ' {');
  Object.keys(keyframes).forEach(frame => {
    const block = keyframes[frame];
    output.push('  ' + frame + ' {');
    Object.keys(block).forEach(key => {
      const value = block[key];
      output.push('    ' + buildCSSRule(key, value));
    });
    output.push('  }');
  })
  output.push('}');
}

function combineFiles(cache, mediaMap) {
  const mediaQueries = {};
  const rules = [];
  Object.keys(cache).forEach(filename => {
    const fileOutput = cache[filename].stylesheets;
    Object.keys(fileOutput).forEach(sheetId => {
      const sheet = fileOutput[sheetId];
      sheet.declarations.forEach(declaration => {
        buildBlock(combineSelector(declaration.selector, sheet.classMap), declaration.blockDeclaration, rules);
      });
      Object.keys(sheet.keyframes).forEach(keyframe => {
        const keyframes = sheet.keyframes[keyframe];
        buildKeyframes(keyframe, keyframes, rules);
      });
      Object.keys(sheet.mediaQueries).forEach(media => {
        const mediaString = mediaMap[media] || media;
        mediaQueries[mediaString] = mediaQueries[mediaString] || [];
        sheet.mediaQueries[media].forEach(declaration => {
          buildBlock(combineSelector(declaration.selector, sheet.classMap), declaration.blockDeclaration, mediaQueries[mediaString], '  ');
        });
      });
    })
  });
  Object.keys(mediaQueries).forEach(mediaString => {
    const mediaRules = mediaQueries[mediaString];
    rules.push('@' + mediaString + ' {');
    mediaRules.forEach(rule => rules.push(rule));
    rules.push('}');
  });
  return rules;
}

export default function buildCSS(cache, options) {
  let output = combineFiles(cache, options.mediaMap).join('\n');
  if (output.length === 0) {
    return output;
  }
  const vp = options.vendorPrefixes;

  if (vp) {
    if (typeof vp === 'object') {
      output = postcss([autoprefixer(vp)]).process(output).css;
    } else {
      output = postcss([autoprefixer]).process(output).css;
    }
  }


  if (options.minify) {
    output = new CleanCSS({
      keepBreaks: true,
    }).minify(output).styles;
  }
  return output;
}


