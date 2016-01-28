const invalidChars = /[^_a-z0-9-]/ig;

let id = 0;

const cache = {

};

function hashString(str) {
  let i = str.length;
  let hash = 5381 + i;

  while(i) {
    hash = (hash * 33) ^ str.charCodeAt(--i)
  }

  /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
   * integers. Since we want the results to be always positive, convert the
   * signed int to an unsigned by doing an unsigned bitshift. */
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
  if (options.compressClassNames) {
    cache[identifier] = cache[identifier] || (options.prefix + '_' + (++id).toString(36));
    return cache[identifier];
  }
  return identifier;
}