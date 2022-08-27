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
const isSupportedIndexRe = /index.[tj]sx?$/;
const isResolveWithPathRe = /[\\/]resolvewithplus[\\/]/;
const packageNameRe = /(^@[^/]*\/[^/]*|^[^/]*)\/?(.*)$/;
const isESMImportSubpathRe = /^#/;
const esmStrGlobRe = /(\*)/g;
const esmStrPathCharRe = /([./])/g;
const rootDirSlashRe = /^\//;
const protocolNode = /^node:/;
const FILE_PROTOCOL = 'file:///';
const supportedExtensions = [ '.js', '.mjs', '.ts', '.tsx', '.json', '.node' ];
const node_modules = 'node_modules';
const packagejson = 'package.json';
const specruntime = 'node';
const specdefault = 'default';
const specimport = 'import';
const specdot = '.';
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
  //  -> D:/a/resolvewithplus/pathto/testfiles/testscript.js
  o.pathToPosix = pathany => isWin32PathRe.test(pathany)
    ? pathany.replace(isWin32PathRe, path.posix.sep)
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
      fullpath = o.addprotocolnode(requirepath)
    } else {
      fullpath = isDirPathRe.test(requirepath)
        ? o.getasfileordir(o.pathToPosix(requirepath), withpath, opts)
        : o.getasnode_module(requirepath, withpath);

      fullpath = fullpath && (
        opts.isposixpath
          ? realpath(fullpath)
          : o.addprotocolfile(o.pathToPosix(realpath(fullpath))));
    }

    return fullpath;
  };

  o.addprotocolnode = p => protocolNode.test(p) ? p : `node:${p}`;

  o.addprotocolfile = p => p && (FILE_PROTOCOL + p.replace(rootDirSlashRe, ''));

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
  //  return [ '@scoped/package', 'specifier' ]
  //
  // target === 'package/specifier',
  //  return [ 'package', 'specifier' ]
  //
  o.gettargetnameandspecifier = target =>
    (String(target).match(packageNameRe) || []).slice(1);

  // [...] the individual exports for a package can be determined by treating
  // the right hand side target pattern as a ** glob against the list of files
  // within the package.
  //
  // './lib/*' './lib/index' -> true
  // './lib/feature', './lib/index' -> false
  o.ispathesmmatch = (pathesm, pathlocal) => {
    const isesmkeymatchRe = new RegExp(
      pathesm.replace(esmStrPathCharRe, '\\$1').replace(esmStrGlobRe, '.*'));

    return isesmkeymatchRe.test(pathlocal);
  };

  // when,
  //  key: './features/*.js'
  //  val: './src/features/*.js'
  //  pathlocal: './features/x.js'
  //
  // return './src/features/x.js'
  o.getesemkeyvalglobreplaced = (esmkey, esmval, pathlocal) => {
    const isesmkeymatchRe = new RegExp(
      esmkey.replace(esmStrPathCharRe, '\\$1').replace(esmStrGlobRe, '(.*)'));

    // eslint-disable-next-line prefer-destructuring
    const globmatch = (pathlocal.match(isesmkeymatchRe) || [])[1];
    return globmatch && esmval.replace('*', globmatch);
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
  o.getesmkeyvalmatch = (esmkey, esmval, path, keyvalmatch = false) => {
    if (o.ispathesmmatch(esmkey, path)) {
      if (esmval.includes('*')) {
        if (o.ispathesmmatch(esmval, path)) {
          keyvalmatch = path
        } else if (esmkey.includes('*') && esmkey !== esmval) {
          keyvalmatch = o.getesemkeyvalglobreplaced(esmkey, esmval, path);
        }
      } else {
        keyvalmatch = esmval
      }
    }

    return keyvalmatch
  };

  // "exports": './lib/index.js',
  // "exports": { "import": "./lib/index.js" },
  // "exports": { ".": "./lib/index.js" },
  // "exports": { ".": { "import": "./lib/index.js" } }
  o.esmparsesugar = (spec, specifier, indexdefault = null) => {
    if (typeof spec === 'string')
      indexdefault = spec;
    else if (isobj(spec))
      indexdefault = (
        o.esmparsesugar(spec[specifier], specifier) ||
          o.esmparsesugar(spec[specdot], specifier));

    return indexdefault;
  };

  o.esmparselist = (list, spec, specifier, key = list[0]) => {
    if (!list.length) return null;

    const isKeyValid = isESMImportSubpathRe.test(specifier)
      ? isESMImportSubpathRe.test(key)
      : isRelPathRe.test(key);

    return (isKeyValid
      && typeof spec[key] === 'string'
      && o.getesmkeyvalmatch(key, spec[key], specifier))
      || o.esmparselist(list.slice(1), spec, specifier)
  }

  o.esmparse = (spec, specifier) => {
    let indexval = false;

    if (typeof spec === 'string')
      return spec;

    if (specifier === specimport)
      indexval = o.esmparsesugar(spec, specifier);

    if (!indexval && isobj(spec)) {
      // "exports": {
      //   "import": "./index.mjs",
      //   "./subpath": "./lib/subpath.js"
      // }
      if (typeof spec[specifier] === 'string')
        indexval = spec[specifier];

      // "exports": {
      //   "node": {
      //     "import": "./feature-node.mjs",
      //     "require": "./feature-node.cjs"
      //   }
      // }
      if (!indexval && spec[specruntime])
        indexval = o.esmparse(spec[specruntime], specifier);
      if (!indexval && spec[specdefault])
        indexval = o.esmparse(spec[specdefault], specifier);
      if (!indexval && spec[specifier])
        indexval = o.esmparse(spec[specifier], specifier)

      if (!indexval && spec[specdot]) {
        // "exports": {
        //   ".": [{
        //     "import": "./index.mjs",
        //     "require": "./index.cjs"
        //   }, "./index.cjs" ]
        // }
        if (Array.isArray(spec[specdot])) {
          indexval = spec[specdot].reduce((prev, elem) => {
            return prev || o.esmparse(elem, specifier);
          }, null);
        }
      }

      // "exports": {
      //   '.': './lib/index.test.js',
      //   './lib': './lib/index.test.js',
      //   './lib/*': './lib/*.js',
      // }
      if (!indexval)
        indexval = o.esmparselist(Object.keys(spec), spec, specifier);
    }

    return indexval;
  }

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
      indexval = o.esmparse(esmexportsobj, specimport);
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

  // subpath patterns may resolve another dependency rather than file, eg
  // {
  //  "imports": {
  //     "#dep": {
  //       "node": "dep-node-native",
  //       "default": "./dep-polyfill.js"
  //     }
  //   }
  // }
  o.esmparseimport = (targetpath, specifier, pjson) => {
    const pjsonimports = pjson && pjson.imports;
    const firstmatch = o.esmparse(pjsonimports, specifier);

    return firstmatch && (
      isRelPathRe.test(firstmatch)
        ? path.join(targetpath, firstmatch)
        : o(firstmatch, targetpath, { isposixpath : true }))
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
  o.esmparseexport = (targetpath, pname, pspecifier, pjson) => {
    const firstmatch = o.esmparse(
      pjson && pjson.exports,
      pspecifier ? './' + pspecifier : specimport);

    return firstmatch && path.join(targetpath, pname, firstmatch);
  };

  o.esmparseexportpkg = (targetpath, pname, pspecifier, opts) => {
    const pjsonpath = path.join(targetpath, pname, packagejson);
    const pjsonpathexists = o.isfilesync(pjsonpath);
    const pjson = pjsonpathexists && require(pjsonpath);

    return pjsonpathexists &&
      o.esmparseexport(targetpath, pname, pspecifier, pjson, opts);
  };

  o.esmparseimportpkg = (pspecifier, start, opts) => {
    const packagejsonpath = o.getasfirst_parent_packagejson_path(start);
    const parentURL = path.dirname(packagejsonpath);

    return packagejsonpath && o.esmparseimport(
      parentURL, pspecifier, require(packagejsonpath), opts);
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
      return o.esmparseimportpkg(targetpath, start, opts);

    const dirarr = o
      .getasnode_module_paths(start)
      .sort((a, b) => a.length > b.length);

    return (function next (dirs, x, len = x - 1) {
      return !x-- ? null :
        o.esmparseexportpkg(path.join(dirs[len - x]), pname, pspecifier, opts)
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
