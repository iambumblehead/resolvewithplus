// Filename: resolvewith.js  
// Timestamp: 2015.12.15-07:20:04 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

var fs = require('fs'),
    path = require('path');

var resolvewith = module.exports = (function (o) {
  
  o = function (requirepath, withpath, opts) {
    return o.begin(requirepath, withpath, opts || {});
  };
  
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
  o.begin = function (requirepath, withpath, opts) {
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

  o.isdirpath = function (p) {
    return /^\.?\.?\//.test(p);
  };

  o.isrelpath = function (p) {
    return /^.\.?(?=\/)/.test(p);
  };

  o.iscoremodule = function (p) {
    try {
      return p === require.resolve(p);
    } catch (e) {
      return false;
    }
  };

  o.isfilesync = function (file) {
    var stat;
    
    try {
      stat = fs.statSync(file);
    } catch (e) {
      stat = false;
    }

    return stat && (stat.isFile() || stat.isFIFO());
  };

  o.getpackagepath = function (jsonfile, opts) {
    return o.isfilesync(jsonfile) && (jsonfile = require(jsonfile)) &&
      ((opts && opts.browser && jsonfile.browser && jsonfile.browser['index.js']) || jsonfile.main);
  };

  // https://nodejs.org/api/modules.html#modules_module_require_id
  //
  // LOAD_AS_FILE(X)
  // 1. If X is a file, load X as JavaScript text.  STOP
  // 2. If X.js is a file, load X.js as JavaScript text.  STOP
  // 3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
  // 4. If X.node is a file, load X.node as binary addon.  STOP  
  o.getasfilesync = function (f) {
    var filepath = null;
    
    if (o.isfilesync(f)) {
      filepath = f;
    } else {
      ['.js',
       '.json',
       '.node'].some(function (ext) {
        return o.isfilesync(f + ext) && (filepath = f + ext);
      });
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
  o.getasdirsync = function (d, opts) {
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
       'index.json',
       'index.node'].some(function (f) {
        return o.isfilesync(path.join(d, f)) && (filepath = path.join(d, f));
      });
    }

    return filepath;
  };

  o.getasfileordir = function (requirepath, withpath, opts) {
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
  o.getasnode_module = function (n, start, opts) {
    var dirarr = o.getasnode_module_paths(n, start, opts).sort(function (a, b) {
      return a.length > b.length;
    });

    return (function next (dirarr, x) {
      return !x-- ? null : (o.getasfileordir(path.join(dirarr[x], n), null, opts) || next(dirarr, x));
    }(dirarr, dirarr.length));
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
  o.getasnode_module_paths = function (n, start, opts) {
    var join = path.join,
        parts = start.split(path.sep), x,
        dirarr = [];

    for (x = parts.length; x--;) {
      if (/node_modules|bower_components/.test(parts[x])) {
        continue;
      }

      if (parts[x]) {
        dirarr.push(join('/', join.apply(x, parts.slice(0, x + 1)), 'node_modules'));
        dirarr.push(join('/', join.apply(x, parts.slice(0, x + 1)), 'bower_components'));        
      }
    }

    return dirarr;
  };
  
  o.getasdirname = function (p) {
    return path.resolve(path.extname(p) ? path.dirname(p) : p);
  };
  
  return o;

}());
