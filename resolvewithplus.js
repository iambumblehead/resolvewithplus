// Filename: resolvewithplus.js  
// Timestamp: 2018.03.31-14:19:54 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const fs = require('fs'),
      path = require('path');

const resolvewithplus = module.exports = (o => {
  
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
    var fullpath = null,
        altrequirepath = null;

    if (typeof withpath === 'string') {
      withpath = o.getasdirname(withpath);
      // bower, tragically, allows parent package.json files to define alternative
      // paths to required files. More tragically, some pacakges use this behaviour
      if (opts.browser) {
        requirepath = o.getbower_alternate_requirepath(withpath, requirepath, opts)
          || requirepath;
      }
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

  o.isdirpath = (p) =>
    /^\.?\.?(\/|\\)/.test(p);

  o.isrelpath = (p) =>
    /^.\.?(?=\/)/.test(p)
    || /^.\.?(?=\\)/.test(p);


  o.iscoremodule = (p) => {
    try {
      return p === require.resolve(p);
    } catch (e) {
      return false;
    }
  };

  o.isfilesync = (file) => {
    var stat;
    
    try {
      stat = fs.statSync(file);
    } catch (e) {
      stat = false;
    }

    return stat && (stat.isFile() || stat.isFIFO());
  };

  o.getbrowserindex = (packagejson, opts) => {
    let moduleobj =  opts && opts.ismodule && packagejson.module,
        browserobj = moduleobj || opts && opts.browser && packagejson.browser,
        esmexportsobj = opts.esm && packagejson.exports,
        indexprop,
        indexval;

    if (browserobj) {
      if (typeof browserobj === 'string') {
        indexval = browserobj;
      } else if (typeof browserobj === 'object') {
        indexprop = Object.keys(browserobj).filter((prop) => (
          /index.[tj]sx?$/.test(prop)
        ))[0];
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
      (o.getbrowserindex(jsonfile, opts) || jsonfile.main) );

  // https://nodejs.org/api/modules.html#modules_module_require_id
  //
  // LOAD_AS_FILE(X)
  // 1. If X is a file, load X as JavaScript text.  STOP
  // 2. If X.js is a file, load X.js as JavaScript text.  STOP
  // 3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
  // 4. If X.node is a file, load X.node as binary addon.  STOP  
  o.getasfilesync = (f) => {
    var filepath = null;
    
    if (o.isfilesync(f)) {
      filepath = f;
    } else {
      ['.js',
       '.mjs',
       '.ts',
       '.tsx',
       '.json',
       '.node'].some((ext) => (
         o.isfilesync(f + ext) && (filepath = f + ext)));
    }
    
    return filepath;
  };

  // https://nodejs.org/api/modules.html#modules_module_require_id
  //  
  // LOAD_AS_DIRECTORY(X)
  // 1. If X/package.json is a file,
  //    a. Parse X/package.json, and look for "main" field.
  //    b. let M = X + (json main field)
  //    c. LOAD_AS_FILE(M)
  // 2. If X/index.js is a file, load X/index.js as JavaScript text.  STOP
  // 3. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP
  // 4. If X/index.node is a file, load X/index.node as binary addon.  STOP
  o.getasdirsync = (d, opts) => {
    var filepath = null,
        relpath,
        json = path.join(d, 'package.json'),
        json_bower = path.join(d, 'bower.json');

    if ((relpath =
         o.getpackagepath(json, opts) ||
         o.getpackagepath(json_bower, opts))) {
      filepath = o.getasfilesync(path.join(d, relpath));
    } else {
      ['index.js',
       'index.mjs',
       'index.ts',
       'index.tsx',
       'index.json',
       'index.node'].some((f) => (
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
      return !x-- ? null : (o.getasfileordir(path.join(dirarr[len - x], n), null, opts) || next(dirarr, x, len));
    }(dirarr, dirarr.length));
  };

  o.getfirstparent_packagejson = (start) => {
    var join = path.join,
        parts = start.split(path.sep), x,
        packagejson,
        packagejsonpath;

    for (x = parts.length; x--;) {
      if (parts[x]) {
        packagejsonpath = join(path.sep, join.apply(x, parts.slice(0, x + 1)), 'package.json');
        if (o.isfilesync(packagejsonpath)) {
          packagejson = require(packagejsonpath);
          break;
        }
      }
    }
    
    return packagejson;
  };

  o.getbower_alternate_requirepath = (start, requirepath, opts) => {
    let parent_packagejson = o.getfirstparent_packagejson(start),
        alternate_requirepath;
        
    if (parent_packagejson) {
      if (parent_packagejson.browser) {
        alternate_requirepath = parent_packagejson.browser[requirepath];
      }
    }
    
    return alternate_requirepath;
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
  o.getasnode_module_paths = (n, start, opts) => {
    var join = path.join,
        parts = start.split(path.sep), x,
        dirarr = [];

    for (x = parts.length; x--;) {
      if (/node_modules|bower_components/.test(parts[x])) {
        continue;
      }

      if (parts[x]) {
        if (path.sep === '/') {
          dirarr.push(join(path.sep, join.apply(x, parts.slice(0, x + 1)), 'node_modules'));
          dirarr.push(join(path.sep, join.apply(x, parts.slice(0, x + 1)), 'bower_components'));
        } else {
          // windows stuff
          dirarr.push(path.resolve(join(join.apply(x, parts.slice(0, x + 1)), 'node_modules')));
          dirarr.push(path.resolve(join(join.apply(x, parts.slice(0, x + 1)), 'bower_components')));
        }
      }
    }
    
    return dirarr;
  };
  
  o.getasdirname = (p) => 
    path.resolve(path.extname(p) ? path.dirname(p) : p);
  
  return o;

})();
