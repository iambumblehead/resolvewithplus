// Filename: resolvewithplus.spec.js  
// Timestamp: 2017.04.23-23:31:33 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

import url from 'url'
import path from 'path'
import test from 'node:test'
import assert from 'node:assert/strict'
import resolvewithplus from '../../resolvewithplus.js'

const tofileurl = p => url.pathToFileURL(p).href
const toresolvefileurl = p => tofileurl(path.resolve(p))
const optsdefault = resolvewithplus.createopts()

test('should return matched export paths', () => {
  const exports = {
    '.': './lib/index.test.js',
    './lib': './lib/index.test.js',
    './lib/*': './lib/*.js',
    './lib/*.js': './lib/*.js',
    './submodule.js': './src/submodule.js',
    './package.json': './package.json'
  }

  const getmatch = (o, key, path) => resolvewithplus
    .getesmkeyvalmatch(key, o[key], path)

  assert.strictEqual(
    getmatch(exports, '.', './lib/index.test.js'),
    './lib/index.test.js')

  assert.strictEqual(
    getmatch(exports, './lib', './lib/index.test.js'),
    './lib/index.test.js')

  assert.strictEqual(
    getmatch(exports, './lib/*', './lib/index.test.js'),
    './lib/index.test.js')

  assert.strictEqual(
    getmatch(exports, './submodule.js', './submodule.js'),
    './src/submodule.js')
})

test('should convert win32 path to node-friendly posix path', () => {
  const win32Path = 'D:\\a\\resolvewithplus\\pathto\\testfiles\\testscript.js'
  const posixPath = 'D:/a/resolvewithplus/pathto/testfiles/testscript.js'
  const returnPath = resolvewithplus.pathToPosix(win32Path)

  assert.strictEqual(returnPath, posixPath)
})

test('should return a core module reference as require.resolve id', () => {
  assert.strictEqual(resolvewithplus('path'), 'node:path')
})

test('should return "node:" prefixed core module id', () => {
  assert.strictEqual(resolvewithplus('node:path'), 'node:path')
})

test('should return fileurl paths, as import.meta.resolve', async () => {
  const fullpath = path.resolve('../testfiles') + '/'
  const fullpathfileurl = tofileurl(fullpath)
  const relpathtoindex = '../testfiles/path/to/indexfile/index.js'
  const relpathspace = '../testfiles/path/to/indexfile/file name with spaces.js'
  const metaresolve = import.meta.resolve

  assert.strictEqual(
    await metaresolve('path', fullpathfileurl),
    resolvewithplus('path', fullpath))

  assert.strictEqual(
    await metaresolve('node:path', fullpathfileurl),
    resolvewithplus('node:path', fullpath))

  assert.strictEqual(
    await metaresolve('yargs', fullpathfileurl),
    resolvewithplus('yargs', fullpath))

  assert.strictEqual(
    await metaresolve('got', fullpathfileurl),
    resolvewithplus('got', fullpath))

  assert.strictEqual(
    await metaresolve('pg', fullpathfileurl),
    resolvewithplus('pg', fullpath))

  assert.strictEqual(
    await metaresolve('koa', fullpathfileurl),
    resolvewithplus('koa', fullpath))

  assert.strictEqual( // module id
    await metaresolve('optfn', fullpathfileurl),
    resolvewithplus('optfn', fullpath))

  assert.strictEqual( // relpath
    await metaresolve(relpathtoindex, fullpathfileurl),
    resolvewithplus(relpathtoindex, fullpath))

  assert.strictEqual(
    await metaresolve(relpathtoindex, import.meta.url),
    resolvewithplus(relpathtoindex, import.meta.url))

  assert.strictEqual(
    await metaresolve(relpathspace, import.meta.url),
    resolvewithplus(relpathspace, import.meta.url))
})

test('should return a full path when given relative path to index file', () => {
  const fullpath = path.resolve('../testfiles/')
  const indexPath = toresolvefileurl('../testfiles/path/to/indexfile/index.js')

  assert.strictEqual(
    resolvewithplus('./path/to/indexfile', fullpath),
    indexPath)

  assert.strictEqual(
    resolvewithplus('../testfiles/path/to/indexfile', fullpath),
    indexPath)

  assert.strictEqual(
    resolvewithplus('./path/to/indexfile/index', fullpath),
    indexPath)

  assert.strictEqual(
    resolvewithplus('./path/to/indexfile/index.js', fullpath),
    indexPath)
})

test('should use process path as a default "with" path, second param', () => {
  assert.strictEqual(resolvewithplus('./path/to/indexfile'), null)
  assert.strictEqual(
    resolvewithplus('../testfiles/path/to/indexfile'),
    toresolvefileurl('../testfiles/path/to/indexfile/index.js'))
})

test('should return null if a path does not exist', () => {
  assert.strictEqual(resolvewithplus('./path/does/not/exist'), null)
})

test('should return a full path when given the id to a module', () => {
  const fullpath = path.resolve('../testfiles') + '/'

  assert.strictEqual(
    resolvewithplus('optfn', fullpath),
    toresolvefileurl('../node_modules/optfn/optfn.js'))
})

test('should return null when given id to withpath inaccessible module', () => {
  const fullpath = path.resolve('../testfiles/')
  const fullpathindexfile = path.join(fullpath + '/path/to/indexfile')

  assert.strictEqual(
    resolvewithplus('notamodulename', fullpathindexfile), null)
})

test('should follow the behaviour of require.resolve', () => {
  const dirname = path.dirname(url.fileURLToPath(import.meta.url))
  const dirnameroot = path.resolve(dirname + '/../../')
  
  // needed in case, resolvewith is cloned to a different directory name
  const resolvewithrootdirname = path.basename(dirnameroot)
  const resolvewithresolved = path
    .resolve(`../../../${resolvewithrootdirname}`) + '/'

  assert.strictEqual(
    toresolvefileurl('../../resolvewithplus.js'),
    resolvewithplus(`./${resolvewithrootdirname}`, resolvewithresolved))

  const resolvewithedpath = resolvewithplus(
    './tests/testfiles/testscript.js',
    path.resolve(resolvewithresolved))

  assert.strictEqual(
    toresolvefileurl('../testfiles/testscript.js'),
    resolvewithedpath)

  assert.strictEqual(
    'node:path',
    resolvewithplus('path', path.resolve('../../../resolvewithplus/')))
})

test('should handle package.json "exports" field', () => {
  const fullpath = path.resolve('../testfiles/')

  assert.strictEqual(
    resolvewithplus('koa', fullpath),
    toresolvefileurl('../node_modules/koa/dist/koa.mjs'))
})

test('should handle package.json "exports" field, $.[0].import', () => {
  const fullpath = path.resolve('../testfiles/')
  
  assert.strictEqual(
    resolvewithplus('yargs', fullpath),
    toresolvefileurl('../node_modules/yargs/index.mjs'))
})

test('should handle package.json stringy "exports" field (got)', () => {
  const fullpath = path.resolve('../testfiles/')
  
  assert.strictEqual(
    resolvewithplus('got', fullpath),
    toresolvefileurl('../node_modules/got/dist/source/index.js'))
})

test('should handle package.json "main": "./lib" field (pg)', () => {
  const fullpath = path.resolve('../testfiles/')
  
  assert.strictEqual(
    resolvewithplus('pg', fullpath),
    toresolvefileurl('../node_modules/pg/lib/index.js'))
})

test('should return values from cache', () => {
  resolvewithplus.cache['filepathkey'] = 'filepathvalue'

  assert.strictEqual(resolvewithplus('filepath', 'key'), 'filepathvalue')
})

test('getasfilesync, should return path with extension, if found', () => {
  const fullpath = path.resolve('../node_modules/optfn/optfn')

  assert.strictEqual(resolvewithplus.getasfilesync(fullpath), `${fullpath}.js`)
})

test('getasdirsync, should return path with index, if found', () => {
  const fullpath = path.resolve('../testfiles/path/to/indexfile')
  const fullpathindexjs = path.join(fullpath, 'index.js')

  assert.strictEqual(
    resolvewithplus.getasdirsync(fullpath), fullpathindexjs)
})

test('getasnode_module_paths, should return paths to node_modules', () => {
  const { relative, resolve } = path
  const fullpath = resolve('../testfiles/path/to/indexfile')
  const pathsToLook = resolvewithplus.getasnode_module_paths(fullpath)
  const relativePaths = pathsToLook.map(pathToLook =>
    relative(fullpath, pathToLook))

  for (const relativePath of relativePaths) {
    assert.match(relativePath, /^(\.\.[/\\])*node_modules/)
  }
})

test('getasnode_module_paths, no missed path isresolvewithpath test', () => {
  const fullpath = '/root/node_modules/gani/src/'
  const fullpathOS = fullpath.replace(/\//g, path.sep)
  const expectedPath = '/root/node_modules/gani/node_modules'
  const expectedPathOS = expectedPath.replace(/\//g, path.sep)

  const pathsToLook = resolvewithplus.getasnode_module_paths(fullpathOS)

  // windows paths may start "C:\\root\node_modules"
  // so use String.includes rather than strict equality comparison
  assert.ok(pathsToLook.some(path => path.includes(expectedPathOS)))
})

test('should handle exports.import path definition', () => {
  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    type: 'import',
    exports: {
      types: './index.d.ts',
      require: './index.js',
      import: './index.mjs'
    }
  }), './index.mjs')
})

test('should handle exports["."].import path definition', () => {  
  // used by 'koa@2.13.4'
  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    type: 'module',
    exports: {
      '.': {
        require: './index.js',
        import: './index.mjs'
      }
    }
  }, optsdefault), './index.mjs')

  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    type: 'commonjs',
    exports: {
      '.': {
        require: './index.js',
        import: './index.mjs'
      }
    }
  }, optsdefault), './index.js')
})

test('should handle exports stringy path definition', () => {
  // used by 'got'
  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    exports: './index.mjs'
  }), './index.mjs')
})

test('should handle mixed exports', () => {
  // used by 'yargs@17.5.1'
  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    type: 'module',
    exports: {
      './package.json': './package.json',
      '.': [ {
        import: './index.mjs',
        require: './index.cjs'
      }, './index.cjs' ],
      './helpers': {
        import: './helpers/helpers.mjs',
        require: './helpers/index.js'
      },
      './browser': {
        import: './browser.mjs',
        types: './browser.d.ts'
      },
      './yargs': [ {
        import: './yargs.mjs',
        require: './yargs'
      }, './yargs' ]
    }
  }, optsdefault), './index.mjs')

  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    type: 'commonjs',
    exports: {
      './package.json': './package.json',
      '.': [ {
        import: './index.mjs',
        require: './index.cjs'
      }, './index.cjs' ],
      './helpers': {
        import: './helpers/helpers.mjs',
        require: './helpers/index.js'
      },
      './browser': {
        import: './browser.mjs',
        types: './browser.d.ts'
      },
      './yargs': [ {
        import: './yargs.mjs',
        require: './yargs'
      }, './yargs' ]
    }
  }, optsdefault), './index.cjs')
})

test('resolve import or commonjs according to package type', () => {

  // NOTE for tests, file must exist
  // resolving cjs definitions like { main: 'dir/path' }
  // requires resolver to find path at filesystem
  const resolvingfile = './tests-basic.test.js'

  // used by 'inferno@8.2.2'
  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    type: 'module',
    main: './index.js',
    module: resolvingfile
  }, optsdefault), resolvingfile)
  
  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    main: resolvingfile,
    module: './index.esm.js'
  }, optsdefault), resolvingfile)

  // used by '@apollo/server@4.9.4'
  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    type: 'module',
    exports: {
      '.': {
        import: './dist/esm/index.js',
        require: './dist/cjs/index.js'
      }
    }
  }, optsdefault), './dist/esm/index.js')

  // similar patter used by 'react-dom@18.2.0'
  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    type: 'module',
    exports: {
      '.': {
        deno: './server.deno.js',
        worker: './server.worker.js',
        browser: './server.browser.js',
        import: './server.import.js',
        default: './server.default.js'
      }
    }
  }, optsdefault), './server.import.js')

  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    type: 'commonjs',
    exports: {
      '.': {
        deno: './server.deno.js',
        worker: './server.worker.js',
        browser: './server.browser.js',
        import: './server.import.js',
        default: './server.default.js'
      }
    }
  }, optsdefault), './server.default.js')
})

test('should return browser over import when both true', () => {
  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    exports: {
      '.': {
        deno: './server.deno.js',
        worker: './server.worker.js',
        browser: './server.browser.js',
        default: './server.default.js'
      }
    }
  }, {
    priority: [ 'import', 'browser', 'default' ]
  }), './server.browser.js')

  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    exports: {
      '.': {
        deno: './server.deno.js',
        worker: './server.worker.js',
        browser: './server.browser.js',
        default: './server.default.js'
      }
    }
  }, {
    priority: [ 'default' ]
  }), './server.default.js')
})

test('should detect module type from package.json', () => {
  // pattern seen at @aws-sdk/client-s3@3.425.0
  // the module is not type 'module', but defines esm exports
  // the commonjs module should be returned
  //
  // NOTE for tests, file must exist
  // resolving cjs definitions like { main: 'dir/path' }
  // requires resolver to find path at filesystem
  const resolvingfile = './tests-basic.test.js'
  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    main: resolvingfile,// './dist-cjs/index.js',
    types: './dist-types/index.d.ts',
    module: './dist-es/index.js'
  }), resolvingfile)

  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    type: 'module',
    main: './dist-cjs/index.js',
    types: './dist-types/index.d.ts',
    module: resolvingfile
  }), resolvingfile)

  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    main: './dist-cjs/index.js',
    types: './dist-types/index.d.ts',
    module: resolvingfile
  }, {
    priority: [ 'import', 'browser', 'default' ]
  }), resolvingfile)

  // prioritize exports over main, per spec
  // https://nodejs.org/api/packages.html#package-entry-points
  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    main: './dest-cjs',
    exports: {
      '.': {
        deno: './server.deno.js',
        worker: './server.worker.js',
        browser: './server.browser.js',
        default: resolvingfile
      }
    }
  }), resolvingfile)

  assert.strictEqual(resolvewithplus.gettargetindex({
    name: 'test',
    main: './dest-cjs',
    type: 'module',
    exports: {
      '.': {
        deno: './server.deno.js',
        worker: './server.worker.js',
        browser: './server.browser.js',
        default: resolvingfile
      }
    }
  }), resolvingfile)
})
