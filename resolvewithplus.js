import fs from 'fs'
import url from 'url'
import path from 'path'
import module from 'module'

const require = module.createRequire(import.meta.url)
// https://nodejs.org/api/fs.html#fsrealpathpath-options-callback
// realpath removes '..', '.' and converts symlinks to the true path,
// which is also used by nodejs' internal resolver
const realpath = fs.realpathSync.native
const isBuiltinRe = new RegExp( // eslint-disable-next-line no-useless-escape
  '^(?:node:)?('+module.builtinModules.join('|').replace('/', '\/')+')$')
const isDirPathRe = /^\.?\.?([a-zA-Z]:)?(\/|\\)/
const isRelPathRe = /^.\.?(?=\/|\\)/
const isWin32PathRe = /\\/g
const isSupportedIndexRe = /index.[tj]sx?$/
const isResolveWithPathRe = /[\\/]resolvewithplus[\\/]/
const isJsExtnRe = /\.js$/
const isTsExtnRe = /\.ts$/
const packageNameRe = /(^@[^/]*\/[^/]*|^[^/]*)\/?(.*)$/
const isESMImportSubpathRe = /^#/
const esmStrGlobRe = /(\*)/g
const esmStrPathCharRe = /([./])/g
const protocolNode = /^node:/
const protocolFile = /^file:/
const supportedExtensions = [ '.js', '.mjs', '.ts', '.tsx', '.json', '.node' ]
const supportedIndexNames = supportedExtensions.map(extn => `index${extn}`)
const node_modules = 'node_modules'
const packagejson = 'package.json'
const specruntime = 'node'
const specdefault = 'default'
const specimport = 'import'
const specdot = '.'
const isobj = o => o && typeof o === 'object'
const cache = {}

const addprotocolnode = p => protocolNode.test(p) ? p : `node:${p}`
const addprotocolfile = p => p && url.pathToFileURL(p).href
const iscoremodule = p => isBuiltinRe.test(p)
const getaspath = p => protocolFile.test(p) ? url.fileURLToPath(p) : p
const getasdirname = p =>
  path.resolve(path.extname(p) ? path.dirname(p) : p) + path.sep

// ex, D:\\a\\resolvewithplus\\pathto\\testfiles\\testscript.js
//  -> D:/a/resolvewithplus/pathto/testfiles/testscript.js
const pathToPosix = pathany => isWin32PathRe.test(pathany)
  ? pathany.replace(isWin32PathRe, path.posix.sep)
  : pathany

const isfilesync = (file, stat) => {
  try {
    stat = fs.statSync(file)
  } catch (e) {
    stat = false
  }

  return stat && (stat.isFile() || stat.isFIFO())
}

const firstSyncFileExtn = (file, extnlist) => {
  const fileextn = extnlist
    .find(ext => isfilesync(file + ext)) || null

  return fileextn && file + fileextn
}

const firstSyncFilePath = (dir, fileslist) => {
  const filename = fileslist
    .find(file => isfilesync(path.join(dir, file))) || null

  return filename && path.join(dir, filename)
}

// https://nodejs.org/api/modules.html#modules_module_require_id
//
// NODE_MODULES_PATHS(START)
// 1. let PARTS = path split(START)
// 2. let I = count of PARTS - 1
// 3. let DIRS = []
// 4. while I >= 0,
//    a. if PARTS[I] = "node_modules" CONTINUE
//    c. DIR = path join(PARTS[0 .. I] + "node_modules")
//    b. DIRS = DIRS + DIR
//    c. let I = I - 1
// 5. return DIRS
const getasnode_module_paths = (start, parts = start.split(path.sep)) => {
  const next_module_paths = (parts, tuple = [ [], [] ]) => {
    if (!parts.length)
      return tuple[1].reverse()

    // the second condition allow resolvewithplus unit-tests to pass,
    // when resolvewithplus is inside another package's node_modules
    if (parts[0] === node_modules && !isResolveWithPathRe.test(start))
      return next_module_paths(parts.slice(1), tuple)

    // windows and linux paths split differently
    // [ "D:", "a", "windows", "path" ] vs [ "", "linux", "path" ]
    const part = parts[0].length
      ? path.join(tuple[0].slice(-1)[0], parts[0])
      : parts[0] || path.sep

    tuple[0].push(part)
    tuple[1].push(path.resolve(path.join(part, node_modules)))

    return next_module_paths(parts.slice(1), tuple)
  }

  return next_module_paths(parts)
}

const getasfirst_parent_packagejson_path = start => {
  const parentpath = start.split(path.sep).slice(1).reduce((prev, p, i) => {
    // windows and linux paths split differently
    // [ "D:", "a", "windows", "path" ] vs [ "", "linux", "path" ]
    prev.push(path.resolve(path.join(i ? prev[i-1] : path.sep, p)))

    return prev
  }, []).reverse().find(p => isfilesync(path.join(p, packagejson)))

  return parentpath && path.join(parentpath, packagejson)
}

// target === '@scoped/package/specifier',
//  return [ '@scoped/package', 'specifier' ]
//
// target === 'package/specifier',
//  return [ 'package', 'specifier' ]
//
const gettargetnameandspecifier = target =>
  (String(target).match(packageNameRe) || []).slice(1)

// [...] the individual exports for a package can be determined by treating
// the right hand side target pattern as a ** glob against the list of files
// within the package.
//
// './lib/*' './lib/index' -> true
// './lib/feature', './lib/index' -> false
const ispathesmmatch = (pathesm, pathlocal) => {
  const isesmkeymatchRe = new RegExp(
    pathesm.replace(esmStrPathCharRe, '\\$1').replace(esmStrGlobRe, '.*'))

  return isesmkeymatchRe.test(pathlocal)
}

// when,
//  key: './features/*.js'
//  val: './src/features/*.js'
//  pathlocal: './features/x.js'
//
// return './src/features/x.js'
const getesmkeyvalglobreplaced = (esmkey, esmval, pathlocal) => {
  const isesmkeymatchRe = new RegExp(
    esmkey.replace(esmStrPathCharRe, '\\$1').replace(esmStrGlobRe, '(.*)'))

  // eslint-disable-next-line prefer-destructuring
  const globmatch = (pathlocal.match(isesmkeymatchRe) || [])[1]
  return globmatch && esmval.replace('*', globmatch)
}

// esm patterns may have globby key AND path values as in this example,
//
//   "exports": { "./features/*.js": "./src/features/*.js" },
//
// from https://nodejs.org/api/packages.html#subpath-patterns,
// this vague description,
//
//   All instances of * on the right hand side will then be replaced
//   with this value, including if it contains any / separators.
const getesmkeyvalmatch = (esmkey, esmval, path, keyvalmatch = false) => {
  if (ispathesmmatch(esmkey, path)) {
    if (esmval.includes('*')) {
      if (ispathesmmatch(esmval, path)) {
        keyvalmatch = path
      } else if (esmkey.includes('*') && esmkey !== esmval) {
        keyvalmatch = getesmkeyvalglobreplaced(esmkey, esmval, path)
      }
    } else {
      keyvalmatch = esmval
    }
  }

  return keyvalmatch
}

const esmparselist = (list, spec, specifier, key = list[0]) => {
  if (!list.length) return null

  const isKeyValid = isESMImportSubpathRe.test(specifier)
    ? isESMImportSubpathRe.test(key)
    : isRelPathRe.test(key)

  return (isKeyValid
    && typeof spec[key] === 'string'
    && getesmkeyvalmatch(key, spec[key], specifier))
    || esmparselist(list.slice(1), spec, specifier)
}

const esmparse = (spec, specifier) => {
  let indexval = false

  if (typeof spec === 'string')
    return spec

  if (!indexval && Array.isArray(spec)) {
    // "exports": {
    //   ".": [{
    //     "import": "./index.mjs",
    //     "require": "./index.cjs"
    //   }, "./index.cjs" ]
    // }
    indexval = spec
      .reduce((p, elem) => p || esmparse(elem, specifier), null)
  }

  if (!indexval && isobj(spec)) {
    // "exports": {
    //   "import": "./index.mjs",
    //   "./subpath": "./lib/subpath.js"
    // }
    if (typeof spec[specifier] === 'string')
      indexval = spec[specifier]

    // "exports": {
    //   "node": {
    //     "import": "./feature-node.mjs",
    //     "require": "./feature-node.cjs"
    //   }
    // }
    if (!indexval && spec[specruntime])
      indexval = esmparse(spec[specruntime], specifier)
    if (!indexval && spec[specdefault])
      indexval = esmparse(spec[specdefault], specifier)
    if (!indexval && spec[specifier])
      indexval = esmparse(spec[specifier], specifier)

    // "exports": "./lib/index.js",
    // "exports": { "import": "./lib/index.js" },
    // "exports": { ".": "./lib/index.js" },
    // "exports": { ".": { "import": "./lib/index.js" } }
    if (!indexval && spec[specdot])
      indexval = typeof spec[specdot] === 'string'
        ? specifier === specimport && esmparse(spec[specdot], specifier)
        : esmparse(spec[specdot], specifier)

    // "exports": {
    //   ".": "./lib/index.test.js",
    //   "./lib": "./lib/index.test.js",
    //   "./lib/*": "./lib/*.js"
    // }
    if (!indexval)
      indexval = esmparselist(Object.keys(spec), spec, specifier)
  }

  return indexval
}

const gettargetindex = (packagejson, opts) => {
  let moduleobj =  opts && opts.ismodule && packagejson.module,
      browserobj = moduleobj || opts && opts.browser && packagejson.browser,
      esmexportsobj = packagejson.exports,
      indexprop,
      indexval

  if (browserobj) {
    if (typeof browserobj === 'string') {
      indexval = browserobj
    } else if (isobj(browserobj)) {
      [ indexprop ] = Object.keys(browserobj)
        .filter(prop => isSupportedIndexRe.test(prop))
      indexval = indexprop in browserobj && browserobj[indexprop]
    }
  }

  if (esmexportsobj) {
    indexval = esmparse(esmexportsobj, specimport)
  }

  return indexval
}

// https://nodejs.org/api/modules.html#modules_module_require_id
//
// LOAD_AS_FILE(X)
// 1. If X is a file, load X as JavaScript text.  STOP
// 2. If X.js is a file, load X.js as JavaScript text.  STOP
// 3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
// 4. If X.node is a file, load X.node as binary addon.  STOP
const getasfilesync = (f, opts = {}) => {
  var filepath = null
  var filepathts = opts.isTypescript
      && isJsExtnRe.test(f) && f.replace(isJsExtnRe, '.ts')

  if (isfilesync(filepathts)) {
    filepath = filepathts
  } else if (isfilesync(f)) {
    filepath = f
  } else {
    filepath = firstSyncFileExtn(f, supportedExtensions)
  }

  return filepath
}

// https://nodejs.org/api/modules.html#modules_module_require_id
//
// LOAD_AS_DIRECTORY(X)
// 1. If X/package.json is file,
//    a. Parse X/package.json, and look for "main" field.
//    b. let M = X + (json main field)
//    c. LOAD_AS_FILE(M)
// 2. If X/index.js is file, load X/index.js as JavaScript text.  STOP
// 3. If X/index.json is file, parse X/index.json to a JavaScript object. STOP
// 4. If X/index.node is file, load X/index.node as binary addon.  STOP
const getasdirsync = (d, opts) => {
  let filepath = null,
      relpath,
      json = path.join(d, packagejson),
      jsonobj = isfilesync(json) && require(json)
  if ((relpath = gettargetindex(jsonobj, opts))) {
    filepath = getasfilesync(path.join(d, relpath))
  } else if ((relpath = jsonobj.main)) {
    filepath = getasfilesync(path.join(d, relpath), opts)
      || getasfilesync(path.join(d, path.join(relpath, 'index')))
  } else {
    filepath = firstSyncFilePath(d, supportedIndexNames)
  }

  return filepath
}

const getasfileordir = (moduleId, parent, opts) => {
  const temppath = isRelPathRe.test(moduleId)
    ? path.join(parent, moduleId)
    : moduleId

  return getasfilesync(temppath, opts) || getasdirsync(temppath, opts)
}

// subpath patterns may resolve another dependency rather than file, eg
// {
//   "imports": {
//     "#dep": {
//       "node": "dep-node-native",
//       "default": "./dep-polyfill.js"
//     }
//   }
// }
const esmparseimport = (targetpath, specifier, pjson) => {
  const pjsonimports = pjson && pjson.imports
  const firstmatch = esmparse(pjsonimports, specifier)

  return firstmatch && (
    isRelPathRe.test(firstmatch)
      ? path.join(targetpath, firstmatch)
      // eslint-disable-next-line no-use-before-define
      : resolvewith(firstmatch, targetpath, { isposixpath: true }))
}

// https://nodejs.org/api/esm.html
//
// PACKAGE_RESOLVE(packageSpecifier, parentURL)
// (removed steps 1-3 package specifier empty or builtin)
// 4. If packageSpecifier does not start with "@", then
//   1. Set packageName to the substring of packageSpecifier until the
//      first "/" separator or the end of the string.
// 5. Otherwise,
//   1. If packageSpecifier does not contain a "/" separator, then
//      1. Throw an Invalid Module Specifier error.
//   2. Set packageName to the substring of packageSpecifier until the
//      second "/" separator or the end of the string.
// 6. If packageName starts with "." or contains "\" or "%", then
//   1. Throw an Invalid Module Specifier error.
// 7. Let packageSubpath be "." concatenated with the substring of
//    packageSpecifier from the position at the length of packageName.
// (removed steps 8-12 related to urls and error cases)
const esmparseexport = (targetpath, pname, pspecifier, pjson) => {
  const firstmatch = esmparse(
    pjson && pjson.exports,
    pspecifier ? './' + pspecifier : specimport)

  return firstmatch && path.join(targetpath, pname, firstmatch)
}

const esmparseexportpkg = (targetpath, pname, pspecifier, opts) => {
  const pjsonpath = path.join(targetpath, pname, packagejson)
  const pjsonpathexists = isfilesync(pjsonpath)
  const pjson = pjsonpathexists && require(pjsonpath)

  return pjsonpathexists &&
    esmparseexport(targetpath, pname, pspecifier, pjson, opts)
}

const esmparseimportpkg = (pspecifier, start, opts) => {
  const packagejsonpath = getasfirst_parent_packagejson_path(start)
  const parentURL = path.dirname(packagejsonpath)

  return packagejsonpath && esmparseimport(
    parentURL, pspecifier, require(packagejsonpath), opts)
}

// https://nodejs.org/api/modules.html#modules_module_require_id
//
// LOAD_NODE_MODULES(X, START)
// 1. let DIRS=NODE_MODULES_PATHS(START)
// 2. for each DIR in DIRS:
//    a. LOAD_AS_FILE(DIR/X)
//    b. LOAD_AS_DIRECTORY(DIR/X)
//
// array sorting so that longer paths are tested first (closer to withpath)
const getasnode_module = (targetpath, start, opts) => {
  const [ pname, pspecifier ] = gettargetnameandspecifier(targetpath)

  if (isESMImportSubpathRe.test(pname))
    return esmparseimportpkg(targetpath, start, opts)

  const dirarr = getasnode_module_paths(start)
    .sort((a, b) => a.length > b.length)

  return (function next (dirs, x, len = x - 1) {
    return !x-- ? null :
      esmparseexportpkg(path.join(dirs[len - x]), pname, pspecifier, opts)
      || getasfileordir(path.join(dirs[len - x], targetpath), null, opts)
      || next(dirarr, x, len)
  }(dirarr, dirarr.length))
}

// https://nodejs.org/api/modules.html#modules_module_require_id
//
// 1. If X is a core module,
//    a. return the core module
//    b. STOP
// 2. If X begins with './' or '/' or '../'
//    a. LOAD_AS_FILE(Y + X)
//    b. LOAD_AS_DIRECTORY(Y + X)
// 3. LOAD_NODE_MODULES(X, dirname(Y))
// 4. THROW "not found"
//
const begin = (moduleId, parent, opts) => {
  var fullpath = null

  parent = typeof parent === 'string'
    ? getasdirname(getaspath(decodeURI(parent)))
    : process.cwd()

  if (isBuiltinRe.test(moduleId)) {
    fullpath = addprotocolnode(moduleId)
  } else {
    fullpath = isDirPathRe.test(moduleId)
      ? getasfileordir(pathToPosix(moduleId), parent, opts)
      : getasnode_module(moduleId, parent, opts)

    fullpath = fullpath && (
      opts.isposixpath
        ? realpath(fullpath)
        : addprotocolfile(pathToPosix(realpath(fullpath))))
  }

  return fullpath
}

const createopts = (moduleId, parent, opts) => {
  opts = opts || {}
  opts.isTypescript = typeof opts.isTypescript === 'boolean'
    ? opts.isTypescript : isTsExtnRe.test(parent)

  return opts
}

const resolvewith = (moduleId, parent, opts) => {
  let resolvedpath = cache[moduleId+parent]
  if (resolvedpath) return resolvedpath

  opts = createopts(moduleId, parent, opts)
  resolvedpath = begin(moduleId, parent, opts)

  return cache[moduleId+parent] = resolvedpath
}

export default Object.assign(resolvewith, {
  pathToPosix,
  getasnode_module_paths,
  getesmkeyvalmatch,
  getasfilesync,
  getasdirsync,
  gettargetindex,
  iscoremodule,
  esmparse,
  cache
})
