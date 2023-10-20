// Filename: resolvewithplus.spec.js  
// Timestamp: 2017.04.23-23:31:33 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

import url from 'url'
import path from 'path'
import test from 'node:test'
import assert from 'node:assert/strict'
import resolvewithplus, {
  gettargetindextop
} from '../../resolvewithplus.js'

const tofileurl = p => url.pathToFileURL(p).href
const toresolvefileurl = p => tofileurl(path.resolve(p))

const resolvingpackagejsonpath = path
  .resolve('../node_modules/test/package.json')
const resolvingpackagejsonmodulerelpathother =
  '../../tests-basic/tests-export-patterns.test.js'
const resolvingpackagejsonmodulerelpath =
  '../../tests-basic/tests-basic.test.js'
const resolvingpackagejsonmoduleurlpath =
  toresolvefileurl('./tests-basic.test.js')

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
    resolvewithplus.getasdirsync(fullpath, {}), fullpathindexjs)
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
  const resolved = resolvewithplus('test', import.meta.url, {
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        type: 'module',
        exports: {
          types: resolvingpackagejsonmodulerelpathother,
          require: resolvingpackagejsonmodulerelpathother,
          import: resolvingpackagejsonmodulerelpath
        }
      }
    }
  })
  
  assert.strictEqual(resolved, resolvingpackagejsonmoduleurlpath)
})

test('should handle exports["."].import path definition, import', () => {
  // used by 'koa@2.13.4'
  const resolved = resolvewithplus('test', import.meta.url, {
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        type: 'module',
        exports: {
          '.': {
            require: resolvingpackagejsonmodulerelpathother,
            import: resolvingpackagejsonmodulerelpath
          }
        }
      }
    }
  })

  assert.strictEqual(resolved, resolvingpackagejsonmoduleurlpath)
})

test('should handle exports["."].import path definition, cjs', () => {
  const resolved = resolvewithplus('test', import.meta.url, {
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        type: 'commonjs',
        exports: {
          '.': {
            import: resolvingpackagejsonmodulerelpathother,
            require: resolvingpackagejsonmodulerelpath
          }
        }
      }
    }
  })

  assert.strictEqual(resolved, resolvingpackagejsonmoduleurlpath)
})


test('should handle exports stringy path definition', () => {
  // used by 'got'
  const resolved = resolvewithplus('test', import.meta.url, {
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        type: 'module',
        exports: resolvingpackagejsonmodulerelpath
      }
    }
  })

  assert.strictEqual(resolved, resolvingpackagejsonmoduleurlpath)
})

test('should handle mixed exports, import', () => {
  // used by 'yargs@17.5.1'
  const resolved = resolvewithplus('test', import.meta.url, {
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        type: 'module',
        exports: {
          './package.json': './package.json',
          '.': [ {
            import: resolvingpackagejsonmodulerelpath,
            require: resolvingpackagejsonmodulerelpathother
          }, './index.cjs' ],
          './helpers': {
            import: resolvingpackagejsonmodulerelpathother,
            require: resolvingpackagejsonmodulerelpathother
          },
          './browser': {
            import: resolvingpackagejsonmodulerelpathother,
            types: resolvingpackagejsonmodulerelpathother
          },
          './yargs': [ {
            import: resolvingpackagejsonmodulerelpathother,
            require: resolvingpackagejsonmodulerelpathother
          }, './yargs' ]
        }
      }
    }
  })

  assert.strictEqual(resolved, resolvingpackagejsonmoduleurlpath)
})  

test('should handle mixed exports, commonjs', () => {
  // used by 'yargs@17.5.1'
  const resolved = resolvewithplus('test', import.meta.url, {
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        type: 'commonjs',
        exports: {
          './package.json': './package.json',
          '.': [ {
            import: resolvingpackagejsonmodulerelpathother,
            require: resolvingpackagejsonmodulerelpath
          }, resolvingpackagejsonmodulerelpathother ],
          './helpers': {
            import: resolvingpackagejsonmodulerelpathother,
            require: resolvingpackagejsonmodulerelpathother
          },
          './browser': {
            import: resolvingpackagejsonmodulerelpathother,
            types: './browser.d.ts'
          },
          './yargs': [ {
            import: resolvingpackagejsonmodulerelpathother,
            require: resolvingpackagejsonmodulerelpathother
          }, resolvingpackagejsonmodulerelpathother ]
        }
      }
    }
  })

  assert.strictEqual(resolved, resolvingpackagejsonmoduleurlpath)
})

test('resolve import or commonjs according to package type', () => {
  // NOTE for tests, file must exist
  // resolving cjs definitions like { main: 'dir/path' }
  // requires resolver to find path at filesystem
  // used by 'inferno@8.2.2'
  const resolvedmodule = resolvewithplus('test', import.meta.url, {
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        type: 'module',
        main: resolvingpackagejsonmodulerelpathother,
        module: resolvingpackagejsonmodulerelpath
      }
    }
  })

  assert.strictEqual(resolvedmodule, resolvingpackagejsonmoduleurlpath)
  
  const resolvedmain = resolvewithplus('test', import.meta.url, {
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        main: resolvingpackagejsonmodulerelpath,
        module: resolvingpackagejsonmodulerelpathother
      }
    }
  })

  assert.strictEqual(resolvedmain, resolvingpackagejsonmoduleurlpath)

  // used by '@apollo/server@4.9.4'
  const resolveddotimport = resolvewithplus('test', import.meta.url, {
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        type: 'module',
        exports: {
          '.': {
            import: resolvingpackagejsonmodulerelpath,
            require: resolvingpackagejsonmodulerelpathother
          }
        }
      }
    }
  })

  assert.strictEqual(resolveddotimport, resolvingpackagejsonmoduleurlpath)

  // similar patter used by 'react-dom@18.2.0'
  const resolveddotimport2 = resolvewithplus('test', import.meta.url, {
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        type: 'module',
        exports: {
          '.': {
            deno: resolvingpackagejsonmodulerelpathother,
            worker: resolvingpackagejsonmodulerelpathother,
            browser: resolvingpackagejsonmodulerelpathother,
            import: resolvingpackagejsonmodulerelpath,
            default: resolvingpackagejsonmodulerelpathother
          }
        }
      }
    }
  })

  assert.strictEqual(resolveddotimport2, resolvingpackagejsonmoduleurlpath)


  const resolveddotdefault = resolvewithplus('test', import.meta.url, {
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        type: 'commonjs',
        exports: {
          '.': {
            deno: resolvingpackagejsonmodulerelpathother,
            worker: resolvingpackagejsonmodulerelpathother,
            browser: resolvingpackagejsonmodulerelpathother,
            import: resolvingpackagejsonmodulerelpathother,
            default: resolvingpackagejsonmodulerelpath
          }
        }
      }
    }
  })

  assert.strictEqual(resolveddotdefault, resolvingpackagejsonmoduleurlpath)
})

test('resolve full path for older main, browser and export fields', () => {
  const resolvedmain = resolvewithplus('test', import.meta.url, {
    isbrowser: true,
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        browser: resolvingpackagejsonmodulerelpath,
        module: resolvingpackagejsonmodulerelpathother
      }
    }
  })

  assert.strictEqual(resolvedmain, resolvingpackagejsonmoduleurlpath)
})

test('should return browser or import whichiver first', () => {
  const resolvedbrowser = resolvewithplus('test', import.meta.url, {
    priority: [ 'browser', 'import', 'default' ],
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        exports: {
          '.': {
            deno: resolvingpackagejsonmodulerelpathother,
            worker: resolvingpackagejsonmodulerelpathother,
            browser: resolvingpackagejsonmodulerelpath,
            default: resolvingpackagejsonmodulerelpathother
          }
        }
      }
    }
  })

  assert.strictEqual(resolvedbrowser, resolvingpackagejsonmoduleurlpath)

  const resolveddefault = resolvewithplus('test', import.meta.url, {
    priority: [ 'default', 'browser', 'import' ],
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        exports: {
          '.': {
            deno: resolvingpackagejsonmodulerelpathother,
            worker: resolvingpackagejsonmodulerelpathother,
            browser: resolvingpackagejsonmodulerelpathother,
            default: resolvingpackagejsonmodulerelpath
          }
        }
      }
    }
  })

  assert.strictEqual(resolveddefault, resolvingpackagejsonmoduleurlpath)
})

test('should detect module type from package.json', () => {
  // pattern seen at @aws-sdk/client-s3@3.425.0
  // the module is not type 'module', but defines esm exports
  // the commonjs module should be returned
  //
  // NOTE for tests, file must exist
  // resolving cjs definitions like { main: 'dir/path' }
  // requires resolver to find path at filesystem
  const resolvedmain = resolvewithplus('test', import.meta.url, {
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        main: resolvingpackagejsonmodulerelpath,
        types: './dist-types/index.d.ts',
        module: resolvingpackagejsonmodulerelpathother
      }
    }
  })

  assert.strictEqual(resolvedmain, resolvingpackagejsonmoduleurlpath)

  const resolvedmodule = resolvewithplus('test', import.meta.url, {
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        type: 'module',
        main: resolvingpackagejsonmodulerelpathother,
        types: './dist-types/index.d.ts',
        module: resolvingpackagejsonmodulerelpath
      }
    }
  })

  assert.strictEqual(resolvedmodule, resolvingpackagejsonmoduleurlpath)

  const resolvedmodule2 = resolvewithplus('test', import.meta.url, {
    priority: [ 'import', 'browser', 'default' ],
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        main: resolvingpackagejsonmodulerelpathother,
        types: './dist-types/index.d.ts',
        module: resolvingpackagejsonmodulerelpath
      }
    }
  })

  assert.strictEqual(resolvedmodule2, resolvingpackagejsonmoduleurlpath)

  // prioritize exports over main, per spec
  // https://nodejs.org/api/packages.html#package-entry-points
  const resolvedexportsdefault = resolvewithplus('test', import.meta.url, {
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        main: resolvingpackagejsonmodulerelpathother,
        exports: {
          '.': {
            deno: resolvingpackagejsonmodulerelpathother,
            worker: resolvingpackagejsonmodulerelpathother,
            browser: resolvingpackagejsonmodulerelpathother,
            default: resolvingpackagejsonmodulerelpath
          }
        }
      }
    }
  })

  assert.strictEqual(resolvedexportsdefault, resolvingpackagejsonmoduleurlpath)


  const resolvedmoduleexportsdef = resolvewithplus('test', import.meta.url, {
    packagejsonmap: {
      [resolvingpackagejsonpath]: {
        name: 'test',
        type: 'module',
        main: './dist-cjs/index.js',
        exports: {
          '.': {
            deno: resolvingpackagejsonmodulerelpathother,
            worker: resolvingpackagejsonmodulerelpathother,
            browser: resolvingpackagejsonmodulerelpathother,
            default: resolvingpackagejsonmodulerelpath
          }
        }
      }
    }
  })

  assert.strictEqual(
    resolvedmoduleexportsdef, resolvingpackagejsonmoduleurlpath)
})

test('gettargetindextop should resolve a fullpath', () => {
  const dir = path.resolve('../node_modules/test/') + '/'
  const indexpathrequire = gettargetindextop({
    name: '@adobe/fetch',
    version: '4.1.0',
    description: 'Light-weight Fetch ...',
    require: resolvingpackagejsonmodulerelpath
  }, {}, dir)

  assert.strictEqual(
    indexpathrequire,
    url.fileURLToPath(resolvingpackagejsonmoduleurlpath))

  const indexpathmodule = gettargetindextop({
    name: '@adobe/fetch',
    version: '4.1.0',
    description: 'Light-weight Fetch ...',
    module: resolvingpackagejsonmodulerelpath
  }, { priority: [ 'import' ] }, dir)

  assert.strictEqual(
    indexpathmodule,
    url.fileURLToPath(resolvingpackagejsonmoduleurlpath))

  const indexpathmain = gettargetindextop({
    name: '@adobe/fetch',
    version: '4.1.0',
    description: 'Light-weight Fetch ...',
    main: resolvingpackagejsonmodulerelpath
  }, {}, dir)

  assert.strictEqual(
    indexpathmain,
    url.fileURLToPath(resolvingpackagejsonmoduleurlpath))  
})
