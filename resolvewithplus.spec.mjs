// Filename: resolvewithplus.spec.js  
// Timestamp: 2017.04.23-23:31:33 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

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
  t.is(
    path.resolve('./resolvewithplus.mjs'),
    resolvewithplus('../resolvewithplus', path.resolve('../resolvewithplus/')));

  t.is(
    path.resolve('./testfiles/testscript.js'),
    resolvewithplus(
      './testfiles/testscript.js',
      path.resolve('../resolvewithplus/')));

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
  const paths = fullpath.split('/').slice(1).reduce((prev, p, i) => {
    p = path.join(i ? prev[0][i-1] : '/', p);
    
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

  t.deepEqual(
    resolvewithplus.getasnode_module_paths('modulename', fullpath, '/'), paths);
});
