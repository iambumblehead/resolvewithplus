// Filename: resolvewithplus.spec.js  
// Timestamp: 2017.04.23-23:31:33 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

import url from 'url';
import path from 'path';
import test from 'node:test'
import assert from 'node:assert/strict'
import resolvewithplus from '../../resolvewithplus.js';

test('should return a core module reference as require.resolve id', t => {
  assert.strictEqual(resolvewithplus('path'), 'path');
});
/*
test('should return a full path when given relative path to index file', t => {
  const fullpath = path.resolve('./testfiles/');

  assert.strictEqual(
    resolvewithplus('./path/to/indexfile', fullpath),
    path.resolve('./testfiles/path/to/indexfile/index.js'));

  assert.strictEqual(
    resolvewithplus('../testfiles/path/to/indexfile', fullpath),
    path.resolve('./testfiles/path/to/indexfile/index.js'));

  assert.strictEqual(
    resolvewithplus('./path/to/indexfile/index', fullpath),
    path.resolve('./testfiles/path/to/indexfile/index.js'));

  assert.strictEqual(
    resolvewithplus('./path/to/indexfile/index.js', fullpath),
    path.resolve('./testfiles/path/to/indexfile/index.js'));
});

test('should use process path as a default "with" path, second param', t => {
  assert.strictEqual(resolvewithplus('./path/to/indexfile'), null);

  assert.strictEqual(
    resolvewithplus('./testfiles/path/to/indexfile'),
    path.resolve('./testfiles/path/to/indexfile/index.js'));        
});

test('should return null if a path does not exist', t => {
  assert.strictEqual(resolvewithplus('./path/does/not/exist'), null);
});

test('should return a full path when given the id to a module', t => {
  const fullpath = path.resolve('./testfiles/');

  assert.strictEqual(
    resolvewithplus('optfn', fullpath),
    path.resolve('./node_modules/optfn/optfn.js'));
});

test('should return null when given id to withpath inaccessible module', t => {
  const fullpath = path.resolve('./testfiles/');
  
  assert.strictEqual(
    resolvewithplus(
      'notamodulename', path.join(fullpath + '/path/to/indexfile')),
    null);        
});

test('should follow the behaviour of require.resolve', t => {
  const dirname = path.dirname(url.fileURLToPath(import.meta.url));
  // needed in case, resolvewith is cloned to a different directory name
  const resolvewithrootdirname = path.basename(dirname);
  const resolvewithresolved = path.resolve(`../${resolvewithrootdirname}/`);

  assert.strictEqual(
    path.resolve('./resolvewithplus.mjs'),
    resolvewithplus(`../${resolvewithrootdirname}`, resolvewithresolved));

  assert.strictEqual(
    path.resolve('./testfiles/testscript.js'),
    resolvewithplus(
      './testfiles/testscript.js',
      path.resolve(resolvewithresolved)));

  assert.strictEqual(
    'path',
    resolvewithplus('path', path.resolve('../resolvewithplus/')));
});

test('should handle package.json "exports" field', t => {
  const fullpath = path.resolve('./testfiles/');
  
  assert.strictEqual(
    resolvewithplus('koa', fullpath, { esm : true }),
    path.resolve('./node_modules/koa/dist/koa.mjs'));
});

test('should handle package.json "exports" field, $.[0].import', t => {
  const fullpath = path.resolve('./testfiles/');
  
  assert.strictEqual(
    resolvewithplus('yargs', fullpath, { esm : true }),
    path.resolve('./node_modules/yargs/index.mjs'));
});

test('should handle package.json stringy "exports" field (got)', t => {
  const fullpath = path.resolve('./testfiles/');
  
  assert.strictEqual(
    resolvewithplus('got', fullpath, { esm : true }),
    path.resolve('./node_modules/got/dist/source/index.js'));
});

test('should return values from cache', t => {
  resolvewithplus.cache['filepathkey'] = 'filepathvalue';

  assert.strictEqual(resolvewithplus('filepath', 'key'), 'filepathvalue');
});

test('getasfilesync, should return path with extension, if found', t => {
  const fullpath = path.resolve('./node_modules/optfn/optfn');

  assert.strictEqual(resolvewithplus.getasfilesync(fullpath), `${fullpath}.js`);
});

test('getasdirsync, should return path with index, if found', t => {
  const fullpath = path.resolve('./testfiles/path/to/indexfile');

  assert.strictEqual(resolvewithplus.getasdirsync(fullpath), path.join(fullpath, 'index.js'));
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
  assert.strictEqual(resolvewithplus.getbrowserindex({
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
  assert.strictEqual(resolvewithplus.getbrowserindex({
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
  assert.strictEqual(resolvewithplus.getbrowserindex({
    name : 'test',
    exports : './index.mjs'
  }), './index.mjs');
});

test('should handle mixed exports', t => {
  // used by 'yargs@17.5.1'
  assert.strictEqual(resolvewithplus.getbrowserindex({
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
*/