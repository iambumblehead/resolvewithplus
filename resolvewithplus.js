import fs from 'fs';
import path from 'path';
import module from 'module';

const require = module.createRequire(import.meta.url);
const isBuiltinRe = new RegExp(
  '^('+module.builtinModules.join('|').replace('/', '\/')+')$');
const isDirPathRe = /^\.?\.?(\/|\\)/;
const isRelPathRe = /^.\.?(?=\/|\\)/;
const isSupportedIndexRe = /index.[tj]sx?$/;
const isResolveWithPathRe = /[\\/]resolvewithplus[\\/]/;
const supportedExtensions = [ '.js', '.mjs', '.ts', '.tsx', '.json', '.node' ];
const node_modules = 'node_modules';
const packagejson = 'package.json';

export default (o => {
  o = (requirepath, withpath, opts) => {
    let resolvedpath = o.cache[requirepath+withpath];
    if (resolvedpath) return resolvedpath;

    resolvedpath = o.begin(requirepath, withpath, opts || {});

    return o.cache[requirepath+withpath] = resolvedpath;
  };

  o.cache = {};
  
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
    } else if (isDirPathRe.test(requirepath)) {
      fullpath = o.getasfileordir(requirepath, withpath, opts);
    } else {
      fullpath = o.getasnode_module(requirepath, withpath);
    }

    // https://nodejs.org/api/fs.html#fsrealpathpath-options-callback
    // realpath removes '..', '.' and converts symlinks to the true path,
    // which is also used by nodejs' internal resolver
    return fullpath && fs.realpathSync.native(fullpath);
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

  o.gettargetindex = (packagejson, opts) => {
    let moduleobj =  opts && opts.ismodule && packagejson.module;
    let browserobj = moduleobj || opts && opts.browser && packagejson.browser;
    let esmexportsobj = packagejson.exports;
    let indexprop;
    let indexval;

    if (browserobj) {
      if (typeof browserobj === 'string') {
        indexval = browserobj;
      } else if (typeof browserobj === 'object') {
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
        if (typeof esmexportsobj['.'] === 'string') {
          indexval = esmexportsobj['.'];
        }
        
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
            return (typeof elem === 'object' && elem.import)
              ? elem.import
              : prev;
          }, null);
        }
      }
    }

    return indexval;
  };

  o.getpackagepath = (jsonfile, opts) => (
    o.isfilesync(jsonfile) && (jsonfile = require(jsonfile)) &&
      (o.gettargetindex(jsonfile, opts) || jsonfile.main));

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

    if ((relpath = o.getpackagepath(json, opts))) {
      filepath = o.getasfilesync(path.join(d, relpath));
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

  // https://nodejs.org/api/modules.html#modules_module_require_id
  //
  // LOAD_NODE_MODULES(X, START)
  // 1. let DIRS=NODE_MODULES_PATHS(START)
  // 2. for each DIR in DIRS:
  //    a. LOAD_AS_FILE(DIR/X)
  //    b. LOAD_AS_DIRECTORY(DIR/X)
  //
  // array sorting so that longer paths are tested first (closer to withpath)
  o.getasnode_module = (n, start, opts) => {
    const dirarr = o
      .getasnode_module_paths(start)
      .sort((a, b) => a.length > b.length);

    return (function next (dirarr, x, len = x - 1) {
      return !x--
        ? null
        : (o.getasfileordir(path.join(dirarr[len - x], n), null, opts)
           || next(dirarr, x, len));
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
  
  o.getasdirname = p => 
    path.resolve(path.extname(p) ? path.dirname(p) : p);
  
  return o;
})();
