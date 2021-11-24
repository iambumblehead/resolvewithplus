// Filename: resolvewithplus.spec.js  
// Timestamp: 2017.04.23-23:31:33 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const test = require('ava');
const resolvewithplus = require('../resolvewithplus');
const path = require('path');

test("should return a core module reference as require.resolve id", t => {
  t.is( resolvewithplus('path'), require.resolve('path') );    
});

test("should return a full path when given the relative path to an index file", t => {
  const fullpath = path.resolve('./spec/testfiles/');

  t.is(
    resolvewithplus('./path/to/indexfile', fullpath),
    path.resolve('./spec/testfiles/path/to/indexfile/index.js')
  );

  t.is(
    resolvewithplus('../testfiles/path/to/indexfile', fullpath),
    path.resolve('./spec/testfiles/path/to/indexfile/index.js')
  );

  t.is(
    resolvewithplus('./path/to/indexfile/index', fullpath),
    path.resolve('./spec/testfiles/path/to/indexfile/index.js')
  );

  t.is(
    resolvewithplus('./path/to/indexfile/index.js', fullpath),
    path.resolve('./spec/testfiles/path/to/indexfile/index.js')
  );
});

test("should use the process path as a default 'with' path (second parameter)", t => {
  t.is(
    resolvewithplus('./path/to/indexfile'),
    null
  );

  t.is(
    resolvewithplus('./spec/testfiles/path/to/indexfile'),
    path.resolve('./spec/testfiles/path/to/indexfile/index.js')      
  );        
});

test("should return null if a path does not exist", t => {
  t.is(
    resolvewithplus('./path/does/not/exist'),
    null
  );
});

test("should return a full path when given the id to a module", t => {
  const fullpath = path.resolve('./spec/testfiles/');

  t.is(
    resolvewithplus('optfn', fullpath),
    path.resolve('./node_modules/optfn/optfn.js')
  );
});

test("should return a null when given the id to a module inaccessible from withpath", t => {
  const fullpath = path.resolve('./spec/testfiles/');
  
  t.is(
    resolvewithplus('notamodulename', path.join(fullpath + '/path/to/indexfile')),
    null
  );        
});

test("should follow the behaviour of require.resolve", t => {
  t.is(
    require.resolve('../src/resolvewithplus'),
    resolvewithplus('../src/resolvewithplus', path.resolve('../resolvewithplus/spec/'))
  );

  t.is(
    require.resolve('./testfiles/testscript.js'),
    resolvewithplus('./testfiles/testscript.js', path.resolve('../resolvewithplus/spec/'))
  );

  t.is(
    require.resolve('path'),
    resolvewithplus('path', path.resolve('../resolvewithplus/spec/'))    
  );    
});

test("should handle package.json 'exports' field", t => {
  const fullpath = path.resolve('./spec/testfiles/');
  
  t.is(
    resolvewithplus('koa', fullpath, { esm: true }),
    path.resolve('./node_modules/koa/dist/koa.mjs')
  );
});
