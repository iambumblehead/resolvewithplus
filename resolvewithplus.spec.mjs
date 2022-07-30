// Filename: resolvewithplus.spec.js  
// Timestamp: 2017.04.23-23:31:33 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

import url from 'url';
import test from 'ava';
import path from 'path';
import resolvewithplus from './resolvewithplus.mjs';

test('should return a core module reference as require.resolve id', t => {
  t.is(resolvewithplus('path'), 'path');
});

test('should return a full path when given relative path to index file', t => {
  const fullpath = path.resolve('./testfiles/');

  t.is(
    resolvewithplus('./path/to/indexfile', fullpath),
    path.resolve('./testfiles/path/to/indexfile/index.js'));

  t.is(
    resolvewithplus('../testfiles/path/to/indexfile', fullpath),
    path.resolve('./testfiles/path/to/indexfile/index.js'));

  t.is(
    resolvewithplus('./path/to/indexfile/index', fullpath),
    path.resolve('./testfiles/path/to/indexfile/index.js'));

  t.is(
    resolvewithplus('./path/to/indexfile/index.js', fullpath),
    path.resolve('./testfiles/path/to/indexfile/index.js'));
});

test('should use process path as a default "with" path, second param', t => {
  t.is(resolvewithplus('./path/to/indexfile'), null);

  t.is(
    resolvewithplus('./testfiles/path/to/indexfile'),
    path.resolve('./testfiles/path/to/indexfile/index.js'));        
});

test('should return null if a path does not exist', t => {
  t.is(resolvewithplus('./path/does/not/exist'), null);
});

test('should return a full path when given the id to a module', t => {
  const fullpath = path.resolve('./testfiles/');

  t.is(
    resolvewithplus('optfn', fullpath),
    path.resolve('./node_modules/optfn/optfn.js'));
});

test('should return null when given id to withpath inaccessible module', t => {
  const fullpath = path.resolve('./testfiles/');
  
  t.is(
    resolvewithplus(
      'notamodulename', path.join(fullpath + '/path/to/indexfile')),
    null);        
});

test('should follow the behaviour of require.resolve', t => {
  const dirname = path.dirname(url.fileURLToPath(import.meta.url));
  // needed in case, resolvewith is cloned to a different directory name
  const resolvewithrootdirname = path.basename(dirname);
  const resolvewithresolved = path.resolve(`../${resolvewithrootdirname}/`);

  t.is(
    path.resolve('./resolvewithplus.mjs'),
    resolvewithplus(`../${resolvewithrootdirname}`, resolvewithresolved));

  t.is(
    path.resolve('./testfiles/testscript.js'),
    resolvewithplus(
      './testfiles/testscript.js',
      path.resolve(resolvewithresolved)));

  t.is(
    'path',
    resolvewithplus('path', path.resolve('../resolvewithplus/')));
});

test('should handle package.json "exports" field', t => {
  const fullpath = path.resolve('./testfiles/');
  
  t.is(
    resolvewithplus('koa', fullpath, { esm : true }),
    path.resolve('./node_modules/koa/dist/koa.mjs'));
});

test('should handle package.json "exports" field, $.[0].import', t => {
  const fullpath = path.resolve('./testfiles/');
  
  t.is(
    resolvewithplus('yargs', fullpath, { esm : true }),
    path.resolve('./node_modules/yargs/index.mjs'));
});

test('should handle package.json stringy "exports" field (got)', t => {
  const fullpath = path.resolve('./testfiles/');
  
  t.is(
    resolvewithplus('got', fullpath, { esm : true }),
    path.resolve('./node_modules/got/dist/source/index.js'));
});

test('should return values from cache', t => {
  resolvewithplus.cache['filepathkey'] = 'filepathvalue';

  t.is(resolvewithplus('filepath', 'key'), 'filepathvalue');
});

test('getasfilesync, should return path with extension, if found', t => {
  const fullpath = path.resolve('./node_modules/optfn/optfn');

  t.is(resolvewithplus.getasfilesync(fullpath), `${fullpath}.js`);
});

test('getasdirsync, should return path with index, if found', t => {
  const fullpath = path.resolve('./testfiles/path/to/indexfile');

  t.is(resolvewithplus.getasdirsync(fullpath), path.join(fullpath, 'index.js'));
});

test('getasnode_module_paths, should return list of paths (posix)', t => {
  const fullpath = path.resolve('./testfiles/path/to/indexfile');
  const { sep } = path;
  const paths = fullpath.split(sep).slice(1).reduce((prev, p, i) => {
    if (p === 'node_modules')
      return prev;

    p = path.resolve(path.join(i ? prev[0][i-1] : sep, p));
    
    prev[0].push(p);
    prev[1].push(path.join(p, 'node_modules'));

    return prev;
  }, [ [], [] ])[1].reverse();

  // [
  //   '/home/bumble/resolvewithplus/testfiles/path/to/indexfile/node_modules',
  //   '/home/bumble/resolvewithplus/testfiles/path/to/node_modules',
  //   '/home/bumble/resolvewithplus/testfiles/path/node_modules',
  //   '/home/bumble/resolvewithplus/testfiles/node_modules',
  //   '/home/bumble/resolvewithplus/node_modules',
  //   '/home/bumble/node_modules',
  //   '/home/node_modules'
  // ]
  //
  // [
  //   'D:\\a\\resolvewithplus\\testfiles\\path\\to\\indexfile\\node_modules',
  //   'D:\\a\\resolvewithplus\\testfiles\\path\\to\\node_modules',
  //   'D:\\a\\resolvewithplus\\testfiles\\path\\node_modules',
  //   'D:\\a\\resolvewithplus\\testfiles\\node_modules',
  //   'D:\\a\\resolvewithplus\\node_modules',
  //   'D:\\a\\node_modules'
  // ]

  t.deepEqual(
    resolvewithplus.getasnode_module_paths(fullpath), paths);
});

test('should handle exports.import path definition', t => {
  t.is(resolvewithplus.getbrowserindex({
    name : 'test',
    exports : {
      types : './index.d.ts',
      require : './index.js',
      import : './index.mjs'
    }
  }), './index.mjs');
});

test('should handle exports["."].import path definition', t => {
  // used by 'koa@2.13.4'
  t.is(resolvewithplus.getbrowserindex({
    name : 'test',
    exports : {
      '.' : {
        require : './index.js',
        import : './index.mjs'
      }
    }
  }), './index.mjs');
});

test('should handle exports stringy path definition', t => {
  // used by 'got'
  t.is(resolvewithplus.getbrowserindex({
    name : 'test',
    exports : './index.mjs'
  }), './index.mjs');
});

test('should handle mixed exports', t => {
  // used by 'yargs@17.5.1'
  t.is(resolvewithplus.getbrowserindex({
    name : 'test',
    exports : {
      './package.json' : './package.json',
      '.' : [ {
        import : './index.mjs',
        require : './index.cjs'
      }, './index.cjs' ],
      './helpers' : {
        import : './helpers/helpers.mjs',
        require : './helpers/index.js'
      },
      './browser' : {
        import : './browser.mjs',
        types : './browser.d.ts'
      },
      './yargs' : [ {
        import : './yargs.mjs',
        require : './yargs'
      }, './yargs' ]
    }
  }), './index.mjs');
});
