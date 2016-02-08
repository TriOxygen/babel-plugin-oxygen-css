import DiskCache from './DiskCache';

const invalidChars = /[^_a-z0-9-]/ig;

const cacheName = 'classnames';

const digitsStr =
//   0       8       16      24      32      40      48      56     63
//   v       v       v       v       v       v       v       v      v
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";
const digits = digitsStr.split('');
const digitsMap = {};
for (let i = 0; i < digits.length; i++) {
    digitsMap[digits[i]] = i;
}


function getCache(options) {
  return new DiskCache(cacheName, options);
}

export function clearCache(options) {
  getCache(options).clear();
}

function fromInt(int32) {
  let result = '';
  while (true) {
    result = digits[int32 & 0x3f] + result;
    int32 >>>= 6;
    if (int32 === 0)
      break;
  }
  return result;
}


function hashString(str) {
  let i = str.length;
  let hash = 5381 + i;

  while(i) {
    hash = (hash * 33) ^ str.charCodeAt(--i)
  }

  return hash >>> 0;
}

function sortObject(obj) {
  return Object.keys( obj )
    .sort()
    .reduce( (acc, key) => {
      const val = obj[key];
      if ( val || val === 0 ) acc[key] = val;
      return acc;
    }, {});
}

export function generateClassName(obj, className, options) {

  const identifier = options.prefix + options.filename.replace(invalidChars, '-') + '-' + options.sheetId + '-' + className;
  const cache = getCache(options);

  if (options.compressClassNames) {
    return cache.fetch(identifier, (keys) => {
      return options.prefix + '_' + fromInt(keys.length);
    });
  }
  return identifier;
}