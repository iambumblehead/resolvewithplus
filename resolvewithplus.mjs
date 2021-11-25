import fs from 'fs';
import path from 'path';
import module from 'module';

const require = module.createRequire(import.meta.url);

export default (o => {
  o = (requirepath, withpath, opts) =>
    o.begin(requirepath, withpath, opts || {});
  
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

    if (typeof withpath === 'string') {
      withpath = o.getasdirname(withpath);
    } else {
      withpath = process.cwd();
    }

    if (o.iscoremodule(requirepath)) {
      fullpath = requirepath;
    } else if (o.isdirpath(requirepath)) {
      fullpath = o.getasfileordir(requirepath, withpath, opts);
    } else {
      fullpath = o.getasnode_module(requirepath, withpath, opts);
    }

    return fullpath;
  };  

  o.isdirpath = p => /^\.?\.?(\/|\\)/.test(p);

  o.isrelpath = p => /^.\.?(?=\/)/.test(p) || /^.\.?(?=\\)/.test(p);

  o.iscoremodule = p => {
    try {
      return p === require.resolve(p);
    } catch (e) {
      return false;
    }
  };

  o.isfilesync = (file, stat) => {
    try {
      stat = fs.statSync(file);
    } catch (e) {
      stat = false;
    }

    return stat && (stat.isFile() || stat.isFIFO());
  };

  o.getbrowserindex = (packagejson, opts) => {
    let moduleobj =  opts && opts.ismodule && packagejson.module;
    let browserobj = moduleobj || opts && opts.browser && packagejson.browser;
    let esmexportsobj = opts.esm && packagejson.exports;
    let indexprop;
    let indexval;

    if (browserobj) {
      if (typeof browserobj === 'string') {
        indexval = browserobj;
      } else if (typeof browserobj === 'object') {
        [ indexprop ] = Object.keys(browserobj)
          .filter(prop => /index.[tj]sx?$/.test(prop));
        indexval = indexprop in browserobj && browserobj[indexprop];        
      }
    }

    if (esmexportsobj && esmexportsobj['.']) {
      if (typeof esmexportsobj['.'].import === 'string') {
        indexval = esmexportsobj['.'].import;
      }
    }

    return indexval;
  };

  o.getpackagepath = (jsonfile, opts) => (
    o.isfilesync(jsonfile) && (jsonfile = require(jsonfile)) &&
      (o.getbrowserindex(jsonfile, opts) || jsonfile.main));

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
      [ '.js', '.mjs', '.ts', '.tsx', '.json', '.node' ]
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
    let json = path.join(d, 'package.json');

    if ((relpath = o.getpackagepath(json, opts))) {
      filepath = o.getasfilesync(path.join(d, relpath));
    } else {
      [ 'index.js',
        'index.mjs',
        'index.ts',
        'index.tsx',
        'index.json',
        'index.node'
      ].some(f => (
        o.isfilesync(path.join(d, f)) && (filepath = path.join(d, f))));
    }

    return filepath;
  };

  o.getasfileordir = (requirepath, withpath, opts) => {
    var temppath;
    
    if (o.isrelpath(requirepath)) {
      temppath = path.join(withpath, requirepath);
    } else {
      temppath = requirepath;
    }

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
    var dirarr = o.getasnode_module_paths(n, start, opts).sort((a, b) => (
      a.length > b.length
    ));

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
          join(sep, join.apply(x, parts.slice(0, x + 1)), 'package.json');
        if (o.isfilesync(packagejsonpath)) {
          packagejson = require(packagejsonpath);
          break;
        }
      }
    }
    
    return packagejson;
  };

  o.getbower_alternate_requirepath = (start, requirepath) => {
    let parentPackagejson = o.getfirstparent_packagejson(start);
    let alternateRequirepath;
        
    if (parentPackagejson) {
      if (parentPackagejson.browser) {
        alternateRequirepath = parentPackagejson.browser[requirepath];
      }
    }
    
    return alternateRequirepath;
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
  o.getasnode_module_paths = (n, start) => {
    let { join, sep } = path;
    let parts = start.split(sep);
    let dirarr = [];

    for (let x = parts.length; x--;) {
      if (/node_modules/.test(parts[x])) {
        continue;
      }

      if (parts[x]) {
        if (sep === '/') {
          dirarr.push(
            join(sep, join.apply(x, parts.slice(0, x + 1)), 'node_modules'));
        } else {
          // windows stuff
          dirarr.push(
            path.resolve(
              join(join.apply(x, parts.slice(0, x + 1)), 'node_modules')));
        }
      }
    }
    
    return dirarr;
  };
  
  o.getasdirname = p => 
    path.resolve(path.extname(p) ? path.dirname(p) : p);
  
  return o;
})();
