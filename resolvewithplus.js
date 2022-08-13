import fs from 'fs';
import path from 'path';
import module from 'module';

const require = module.createRequire(import.meta.url);
// https://nodejs.org/api/fs.html#fsrealpathpath-options-callback
// realpath removes '..', '.' and converts symlinks to the true path,
// which is also used by nodejs' internal resolver
const realpath = fs.realpathSync.native;
const isBuiltinRe = new RegExp(
  '^(?:node:)?('+module.builtinModules.join('|').replace('/', '\/')+')$');
const isDirPathRe = /^\.?\.?([a-zA-Z]:)?(\/|\\)/;
const isRelPathRe = /^.\.?(?=\/|\\)/;
const isWin32PathRe = /\\/g;
const isWin32DriveRe = /^[a-zA-Z]:/;
const isSupportedIndexRe = /index.[tj]sx?$/;
const isResolveWithPathRe = /[\\/]resolvewithplus[\\/]/;
const packageNameRe = /(^@[^/]*\/[^/]*|^[^/]*)\/?(.*)$/;
const isESMImportSubpathRe = /^#/;
const supportedExtensions = [ '.js', '.mjs', '.ts', '.tsx', '.json', '.node' ];
const node_modules = 'node_modules';
const packagejson = 'package.json';
const isobj = o => o && typeof o === 'object';


export default (o => {
  o = (requirepath, withpath, opts) => {
    let resolvedpath = o.cache[requirepath+withpath];
    if (resolvedpath) return resolvedpath;

    resolvedpath = o.begin(requirepath, withpath, opts || {});

    return o.cache[requirepath+withpath] = resolvedpath;
  };

  o.cache = {};

  // ex, D:\\a\\resolvewithplus\\pathto\\testfiles\\testscript.js
  //  -> /a/resolvewithplus/pathto/testfiles/testscript.js
  o.pathToPosix = pathany => isWin32PathRe.test(pathany)
    ? pathany.replace(isWin32DriveRe, '').replace(isWin32PathRe, path.posix.sep)
    : pathany
  
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
  o.begin = (requirepath, withpath, opts) => {
    var fullpath = null;

    withpath = typeof withpath === 'string'
      ? o.getasdirname(decodeURI(withpath))
      : process.cwd();

    if (isBuiltinRe.test(requirepath)) {
      fullpath = requirepath;
    } else {
      fullpath = isDirPathRe.test(requirepath)
        ? o.getasfileordir(o.pathToPosix(requirepath), withpath, opts)
        : o.getasnode_module(requirepath, withpath);

      fullpath = fullpath && realpath(fullpath);
    }

    return fullpath;
  };

  o.iscoremodule = p => isBuiltinRe.test(p);

  o.isfilesync = (file, stat) => {
    try {
      stat = fs.statSync(file);
    } catch (e) {
      stat = false;
    }

    return stat && (stat.isFile() || stat.isFIFO());
  };

  // target === '@scoped/package/specifier',
  //  return [ '@scoped/package', 'file' ]
  //
  // target === 'package/specifier',
  //  return [ '@packge/specifier', 'specifier' ]
  //
  o.gettargetnameandspecifier = target =>
    (String(target).match(packageNameRe) || []).slice(1);

  o.gettargetindex = (packagejson, opts) => {
    let moduleobj =  opts && opts.ismodule && packagejson.module;
    let browserobj = moduleobj || opts && opts.browser && packagejson.browser;
    let esmexportsobj = packagejson.exports;
    let indexprop;
    let indexval;

    if (browserobj) {
      if (typeof browserobj === 'string') {
        indexval = browserobj;
      } else if (isobj(browserobj)) {
        [ indexprop ] = Object.keys(browserobj)
          .filter(prop => isSupportedIndexRe.test(prop));
        indexval = indexprop in browserobj && browserobj[indexprop];        
      }
    }

    if (esmexportsobj) {
      if (typeof esmexportsobj === 'string') {
        indexval = esmexportsobj;
      } else if (typeof esmexportsobj.import === 'string') {
        // "exports": {
        //   "import": "./index.mjs"
        // }
        indexval = esmexportsobj.import;
      } else if (esmexportsobj['.']) {
        // "exports": {
        //   ".": "./lib/index.js"
        // }
        if (typeof esmexportsobj['.'] === 'string') {
          indexval = esmexportsobj['.'];
        }
        // "exports": {
        //   ".": {
        //     "import": "./lib/index.js"
        //   }
        // }
        if (typeof esmexportsobj['.'].import === 'string') {
          indexval = esmexportsobj['.'].import;
        }

        // this export pattern used by "yargs"
        //
        // "exports": {
        //   ".": [{
        //     "import": "./index.mjs",
        //     "require": "./index.cjs"
        //   }, "./index.cjs" ]
        // }
        if (Array.isArray(esmexportsobj['.'])) {
          indexval = esmexportsobj['.'].reduce((prev, elem) => {
            return (isobj(elem) && elem.import)
              ? elem.import
              : prev;
          }, null);
        }
      }
    }

    return indexval;
  };

  // https://nodejs.org/api/modules.html#modules_module_require_id
  //
  // LOAD_AS_FILE(X)
  // 1. If X is a file, load X as JavaScript text.  STOP
  // 2. If X.js is a file, load X.js as JavaScript text.  STOP
  // 3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
  // 4. If X.node is a file, load X.node as binary addon.  STOP  
  o.getasfilesync = f => {
    var filepath = null;
    
    if (o.isfilesync(f)) {
      filepath = f;
    } else {
      supportedExtensions
        .some(ext => o.isfilesync(f + ext) && (filepath = f + ext));
    }
    
    return filepath;
  };

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
  o.getasdirsync = (d, opts) => {
    let filepath = null;
    let relpath;
    let json = path.join(d, packagejson);
    let jsonobj = o.isfilesync(json) && require(json);
    if ((relpath = o.gettargetindex(jsonobj, opts))) {
      filepath = o.getasfilesync(path.join(d, relpath))
    } else if ((relpath = jsonobj.main)) {
      filepath = o.getasfilesync(path.join(d, relpath))
        || o.getasfilesync(path.join(d, path.join(relpath, 'index')));
    } else {
      supportedExtensions.some(f => (
        (f = path.join(d, `index${f}`)) && o.isfilesync(f) && (filepath = f)));
    }

    return filepath;
  };

  o.getasfileordir = (requirepath, withpath, opts) => {
    const temppath = isRelPathRe.test(requirepath)
      ? path.join(withpath, requirepath)
      : requirepath;

    return o.getasfilesync(temppath, opts) || o.getasdirsync(temppath, opts);
  };

  o.getasesmimportpathfrompjson = (targetpath, specifier, pjson) => {
    const pjsonimports = pjson && pjson.imports;
    let firstmatch = null;

    if (pjsonimports) {
      if (typeof pjsonimports[specifier] === 'string') {
        firstmatch = pjsonimports[specifier];
      }
      if (isobj(pjsonimports[specifier])) {
        if (typeof pjsonimports[specifier].default === 'string') {
          firstmatch = path.join(targetpath, pjsonimports[specifier].default);
        }
      }
    }

    return firstmatch;
  };

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
  o.getasesmexportpathfrompjson = (targetpath, pname, pspecifier, pjson) => {
    const pspecifiersubpath = './' + pspecifier;
    const pjsonexports = pjson && pjson.exports;
    let firstmatch = null;

    if (pjsonexports) {
      // "exports": {
      //   "./subpath": "./lib/subpath.js"
      // }
      if (typeof pjsonexports[pspecifiersubpath] === 'string') {
        firstmatch = pjsonexports[pspecifiersubpath];
      }

      // "exports": {
      //   ".": [{
      //     "./subpath": "./lib/subpath.js"
      //   }, "./index.cjs" ]
      // }
      if (pjsonexports['.']) {
        if (Array.isArray(pjsonexports['.'])) {
          firstmatch = pjsonexports['.'].reduce((prev, elem) => {
            return (isobj(elem) && elem[pspecifiersubpath])
              ? elem[pspecifiersubpath]
              : prev;
          }, firstmatch);
        }
      }
    }

    return firstmatch
      && path.join(targetpath, pname, firstmatch);
  };

  o.getasesmexportpath = (targetpath, pname, pspecifier, opts) => {
    const pjsonpath = path.join(targetpath, pname, 'package.json');
    const pjsonpathexists = o.isfilesync(pjsonpath);
    const pjson = pjsonpathexists && require(pjsonpath);

    return pjsonpathexists &&
      o.getasesmexportpathfrompjson(targetpath, pname, pspecifier, pjson, opts);
  };

  o.getasnode_module_from_subpath = (pspecifier, start, opts) => {
    const packagejsonpath = o.getasfirst_parent_packagejson_path(start);

    return packagejsonpath && o.getasesmimportpathfrompjson(
      path.dirname(packagejsonpath), pspecifier, require(packagejsonpath));
  };

  // https://nodejs.org/api/modules.html#modules_module_require_id
  //
  // LOAD_NODE_MODULES(X, START)
  // 1. let DIRS=NODE_MODULES_PATHS(START)
  // 2. for each DIR in DIRS:
  //    a. LOAD_AS_FILE(DIR/X)
  //    b. LOAD_AS_DIRECTORY(DIR/X)
  //
  // array sorting so that longer paths are tested first (closer to withpath)
  o.getasnode_module = (targetpath, start, opts) => {
    const [ pname, pspecifier ] = o.gettargetnameandspecifier(targetpath);

    if (isESMImportSubpathRe.test(pname))
      return o.getasnode_module_from_subpath(targetpath, start, opts);

    const dirarr = o
      .getasnode_module_paths(start)
      .sort((a, b) => a.length > b.length);

    return (function next (dirs, x, len = x - 1) {
      return !x-- ? null :
        o.getasesmexportpath(path.join(dirs[len - x]), pname, pspecifier, opts)
        || o.getasfileordir(path.join(dirs[len - x], targetpath), null, opts)
        || next(dirarr, x, len);
    }(dirarr, dirarr.length));
  };

  o.getfirstparent_packagejson = start => {
    let { join, sep } = path;
    let parts = start.split(sep);
    let packagejson;
    let packagejsonpath;

    for (let x = parts.length; x--;) {
      if (parts[x]) {
        packagejsonpath =
          join(sep, join.apply(x, parts.slice(0, x + 1)), packagejson);
        if (o.isfilesync(packagejsonpath)) {
          packagejson = require(packagejsonpath);
          break;
        }
      }
    }
    
    return packagejson;
  };

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
  o.getasnode_module_paths = start => start.split(path.sep).slice(1)
    .reduce((prev, p, i) => {
      // the second condition allow resolvewithplus unit-tests to pass,
      // when resolvewithplus is inside another package's node_modules
      if (p === node_modules && !isResolveWithPathRe.test(start))
        return prev;

      // windows and linux paths split differently
      // [ "D:", "a", "windows", "path" ] vs [ "", "linux", "path" ]
      p = path.resolve(path.join(i ? prev[0][i-1] : path.sep, p));
    
      prev[0].push(p);
      prev[1].push(path.join(p, node_modules));

      return prev;
    }, [ [], [] ])[1].reverse();

  o.getasfirst_parent_packagejson_path = start => {
    const parentpath = start.split(path.sep).slice(1).reduce((prev, p, i) => {
      // windows and linux paths split differently
      // [ "D:", "a", "windows", "path" ] vs [ "", "linux", "path" ]
      prev.push(path.resolve(path.join(i ? prev[i-1] : path.sep, p)));

      return prev;
    }, []).reverse().find(p => o.isfilesync(path.join(p, packagejson)));

    return parentpath && path.join(parentpath, packagejson);
  };
  
  o.getasdirname = p => 
    path.resolve(path.extname(p) ? path.dirname(p) : p);
  
  return o;
})();
