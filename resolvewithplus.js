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
const supportedExtensions = ['.js', '.mjs', '.ts', '.tsx', '.json', '.node']
const supportedIndexNames = supportedExtensions.map(extn => `index${extn}`)
const node_modules = 'node_modules'
const packagejson = 'package.json'
const specruntime = 'node'
const specdefault = 'default'
const specbrowser = 'browser'
const specimport = 'import'
const spectype = ':spectype'
const spectypemodule = 'module'
const spectypemoduleimport = 'import'
const spectypecommonjs = 'commonjs'
const spectypecommonjsrequire = 'require'
const specdot = '.'
const isobj = o => o && typeof o === 'object'
const cache = {}

const getspectypenamedexportdefault = spectype => ({
  [spectypemodule]: spectypemoduleimport,
  [spectypecommonjs]: spectypecommonjsrequire
})[spectype] || null

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
  } catch {
    stat = false
  }

  return stat && (stat.isFile() || stat.isFIFO())
}

const packagejsonread = (packagejsonpath, opts) => {
  return opts.packagejsonmap && opts.packagejsonmap[packagejsonpath] || (
    isfilesync(packagejsonpath)
      && require(packagejsonpath))
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
  const next_module_paths = (parts, tuple = [[], []]) => {
    if (!parts.length)
      return tuple[1]

    // the second condition allow resolvewithplus unit-tests to pass,
    // when resolvewithplus is inside another package's node_modules
    if (parts[0] === node_modules && isResolveWithPathRe.test(start))
      return next_module_paths(parts.slice(1), tuple)

    // windows and linux paths split differently
    // [ "D:", "a", "windows", "path" ] vs [ "", "linux", "path" ]
    const part = tuple[0].length
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

  const globmatch = (pathlocal.match(isesmkeymatchRe) || [])[1]
  return globmatch && esmval.replace('*', globmatch)
}

// inherently complex to explain, this function "expands" the
// requested idpath to include exported wildcard path parts
//
// imagine this idpath is imported,
// 'thepackage/myfile'
//
// imagine 'thepackage' exports the following,
// {
//   "exports": {
//     "./*": {
//       "require": "./src/*.js",
//       "import": "./types/*.d.ts"
//     }
//   }
// }
//
// this function returns the path './src/myfile.js'
//
// this is done in the following way,
//  * ensure esmkey './*' matches idpath './myfile'
//  * calculate idpath's substring matching the wildcard, eg 'myfile'
//    * split the esmkey around the asterisk to get './' and ''
//    * remove the matches from idpath './myfile' to get 'myfile'
//  * replace glob refpath './src/*.js" with matched 'myfile', './src/myfile.js'
//
// ex,
//   ('./mystuff', './*', './src/*/index.js') => './src/mystuff/index.js'
//   ('./mystuff/index', './*', './src/*.js') => './src/mystuff/index.js'
const getesmkeyidpathrefpathexpanded = (idpath, esmkey, refpath) => {
  const asteriskIndex = esmkey.indexOf('*') || 0
  const asteriskBefore = esmkey.slice(0, asteriskIndex)
  const asteriskAfter = esmkey.slice(asteriskIndex + 1)

  if (!(idpath.startsWith(asteriskBefore)
        && idpath.endsWith(asteriskAfter)))
    return null

  // strip esmkey before and after from idpath,
  // put remaining idpath inside refpath asterisk
  const asteriskFromIdPath = idpath
    .slice(-asteriskAfter.length)
    .slice(asteriskBefore.length)

  return refpath.replace('*', asteriskFromIdPath)
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
const getesmkeyvalmatch = (esmkey, esmval, idpath, opts, keyvalmx = false) => {
  if (ispathesmmatch(esmkey, idpath)) {
    if (String(esmval).includes('*')) {
      if (ispathesmmatch(esmval, idpath)) {
        keyvalmx = idpath
      } else if (esmkey.includes('*') && esmkey !== esmval) {
        keyvalmx = getesmkeyvalglobreplaced(esmkey, esmval, idpath)
      }
    } else {
      // if below condition is true, assume exports look this way and,
      //   * the namespace defined on the key is valid for the moduleId,
      //   * expanded key used as replacement for nested path value wildcard
      // ```
      // "exports": {
      //   "./*": {
      //     "default": "./src/*/index.js",
      //     "types": "./types/*/index.d.ts"
      //   }
      // }
      // ```
      if (isobj(esmval) && esmkey.includes('*')) {
        const expandedspec = Object.keys(esmval).reduce((exp, nestkey) => {
          exp[nestkey] = getesmkeyidpathrefpathexpanded(
            idpath, esmkey, esmval[nestkey])

          return exp
        }, {})

        return esmparse(expandedspec, idpath, opts)
      }

      keyvalmx = keyvalmx || esmval
    }
  }

  return keyvalmx
}

const esmparselist = (list, spec, specifier, opts, key = list[0]) => {
  if (!list.length) return null

  const isKeyValid = isESMImportSubpathRe.test(specifier)
    ? isESMImportSubpathRe.test(key)
    : isRelPathRe.test(key)

  return (isKeyValid
    && (typeof spec[key] === 'string' || isobj(spec[key]))
    && getesmkeyvalmatch(key, spec[key], specifier, opts))
    || esmparselist(list.slice(1), spec, specifier, opts)
}

const esmparse = (spec, specifier, opts = {}) => {
  const priority = opts.priority || [specruntime, specdefault]
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
      .reduce((p, elem) => p || esmparse(elem, specifier, opts), null)
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
    if (!indexval)
      indexval = priority.reduce((prev, specname) => (
        prev || (
          // if dynamic 'spectype', lookup 'commonjs' or 'module'
          // according to package.json
          specname = specname === spectype
            ? isDirPathRe.test(specifier)
              ? getspectypenamedexportdefault(opts.packagejsontype)
              : specifier
            : specname,
          esmparse(spec[specname], specifier, opts))
      ), false)

    if (!indexval && spec[specdefault])
      indexval = esmparse(spec[specdefault], specifier)
    if (!indexval && spec[specifier])
      indexval = esmparse(spec[specifier], specifier, opts)

    // "exports": {
    //   ".": "./lib/index.test.js",
    //   "./lib": "./lib/index.test.js",
    //   "./lib/*": "./lib/*.js"
    // }
    if (!indexval)
      indexval = esmparselist(Object.keys(spec), spec, specifier, opts)

    // "exports": "./lib/index.js",
    // "exports": { "import": "./lib/index.js" },
    // "exports": { ".": "./lib/index.js" },
    // "exports": { ".": { "import": "./lib/index.js" } }
    if (!indexval && spec[specdot]) {
      if (priority.includes(specifier)) {
        indexval = priority.reduce((prev, specname) => (
          prev || (
            specname = specname === spectype
              ? getspectypenamedexportdefault(opts.packagejsontype)
              : specname,
            esmparse(spec[specdot], specname, opts)
          )), false)
      } else {
        indexval = esmparse(spec[specdot], specifier, opts)
      }
    }
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
  var filepathts = opts.istypescript
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

const getpackagejsontype = packagejson => (
  packagejson.type
    || ('exports' in packagejson && spectypemodule)
    || spectypecommonjs)

const gettargetindextopmain = (main, opts = {}, dir = '') => {
  const indexpath = dir ? path.join(dir, main) : main

  return getasfilesync(indexpath, opts) || (
    // if 'main' has supported extension, assume it references real path
    // else do not assume real path, find index in directory
    !isSupportedIndexRe.test(main) &&
      getasfilesync(path.join(indexpath, 'index')))
}

// these fields at the 'top' of the package.json namespace
// may include names like "main" not found in exports namespace
//
// top properties should only resolve when exports is not defined
//
// > If both "exports" and "main" are defined, the "exports" field
// > takes precedence over "main" in supported versions of Node.js.
const gettargetindextop = (packagejson, opts = {}, dir = '', index = false) => {
  const packagejsontype = getpackagejsontype(packagejson)

  // these 'top' level packagejson values allow commonjs resolution
  // and commonjs resolver can resolve "./name/index.jx" from "./name"
  // because of this, the directory is passed down and used to locate
  // the literal path or any possible index-paths found in the dir
  if (opts.isspectype !== false) {
    index = packagejson[packagejsontype]
      || packagejson[getspectypenamedexportdefault(packagejsontype)]
    index = index && gettargetindextopmain(index, opts, dir)
  }

  // if priorty list includes 'import', return packagejson.module
  if (!index && (opts.priority || []).includes(spectypemoduleimport)
      && packagejson.module) {
    index = gettargetindextopmain(packagejson.module, opts, dir)
  }

  if (!index && packagejson.main)
    index = gettargetindextopmain(packagejson.main, opts, dir)

  return index || null
}

const gettargetindex = (packagejson, opts = {}, dir = '', indexval) => {
  const packagejsontype = getpackagejsontype(packagejson)
  const parseopts = Object.assign({ packagejsontype }, opts)

  if (opts.isbrowser && packagejson.browser) {
    // 'browser' and 'main' can define 'script.js' rather than './script.js'
    // if no path found, attach full path ahere
    indexval = esmparse(packagejson.browser, specimport, parseopts)
    indexval = (indexval && !isDirPathRe.test(indexval))
      ? path.join(dir, indexval) : indexval
  }

  if (!indexval)
    indexval = gettargetindextop(packagejson, parseopts, dir)

  return indexval
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
  const json = path.join(d, packagejson)
  const jsonobj = packagejsonread(json, opts)
  const relpath = jsonobj ? gettargetindex(jsonobj, opts, d) : false

  return relpath
    ? relpath
    : firstSyncFilePath(d, supportedIndexNames)
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
const esmparseimport = (targetpath, specifier, pjson, opts) => {
  const pjsonimports = pjson && pjson.imports
  const firstmatch = esmparse(pjsonimports, specifier, opts)

  return firstmatch && (
    isRelPathRe.test(firstmatch)
      ? path.join(targetpath, firstmatch)
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
const esmparseexport = (targetpath, pname, pspecifier, pjson, opts) => {
  const firstmatch = esmparse(
    pjson && pjson.exports,
    pspecifier ? './' + pspecifier : specimport,
    opts)

  return firstmatch && path.join(targetpath, pname, firstmatch)
}

const esmparseexportpkg = (targetpath, pname, pspecifier, opts) => {
  const pjsonpath = path.join(targetpath, pname, packagejson)
  const pjson = packagejsonread(pjsonpath, opts)
  const packagejsontype = pjson && getpackagejsontype(pjson)

  return pjson &&
    esmparseexport(targetpath, pname, pspecifier, pjson, Object.assign({
      packagejsontype
    }, opts))
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
const getasnode_module = (targetpath, start, opts) => {
  const [pname, pspecifier] = gettargetnameandspecifier(targetpath)

  if (isESMImportSubpathRe.test(pname))
    return esmparseimportpkg(targetpath, start, opts)

  // anticipate longer paths at end of list to be processed first
  // longer paths are closer to withpath
  const dirarr = getasnode_module_paths(start)

  return (function next (dirs, x) {
    return !x-- ? null :
      esmparseexportpkg(path.join(dirs[x]), pname, pspecifier, opts)
      || getasfileordir(path.join(dirs[x], targetpath), null, opts)
      || next(dirarr, x)
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
  const boolOr = (v, def) => typeof v === 'boolean' ? v : def

  opts = opts || {}
  opts.istypescript = boolOr(opts.istypescript, isTsExtnRe.test(parent))
  opts.isbrowser = boolOr(opts.isbrowser, false)
  opts.isspectype = boolOr(opts.isspectype, true)

  // packagejson mock to more easily test different patternsn
  opts.packagejsonmap = opts.packagejsonmap || null
  if (!Array.isArray(opts.priority)) {
    opts.priority = opts.isbrowser ? [specbrowser] : []
    opts.priority.push(spectype)
    opts.priority.push(specruntime)
    opts.priority.push(specdefault)
  }

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
  createopts,
  esmparse,
  cache
})

export {
  gettargetindextop,
  getesmkeyvalglobreplaced,
  getesmkeyidpathrefpathexpanded
}
