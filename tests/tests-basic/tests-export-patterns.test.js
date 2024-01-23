import url from 'url'
import path from 'path'
import test from 'node:test'
import assert from 'node:assert/strict'
import resolvewithplus from 'resolvewithplus'

const tofileurl = p => url.pathToFileURL(p).href
const toresolvefileurl = p => tofileurl(path.resolve(p))

// "Package entry points"
// from: https://nodejs.org/api/packages.html#package-entry-points
// {
//   "name": "my-package",
//   "exports": {
//     ".": "./lib/index.js",
//     "./lib": "./lib/index.js",
//     "./lib/index": "./lib/index.js",
//     "./lib/index.js": "./lib/index.js",
//     "./feature": "./feature/index.js",
//     "./feature/index": "./feature/index.js",
//     "./feature/index.js": "./feature/index.js",
//     "./package.json": "./package.json"
//   }
// }
test('should mock all exports from nodejsexample_01_exports', () => {
  const noderesolvedlibindex = toresolvefileurl(
    './nodejsexample_01_exports/lib/index.test.js')
  const noderesolvedfeatureindex = toresolvefileurl(
    './nodejsexample_01_exports/feature/index.test.js')
  const noderesolvedpackagejson = toresolvefileurl(
    './nodejsexample_01_exports/package.json')

  assert.strictEqual(
    resolvewithplus('nodejsexample_01_exports'),
    noderesolvedlibindex)

  assert.strictEqual(
    resolvewithplus('nodejsexample_01_exports/lib'),
    noderesolvedlibindex)

  assert.strictEqual(
    resolvewithplus('nodejsexample_01_exports/lib/index'),
    noderesolvedlibindex)

  assert.strictEqual(
    resolvewithplus('nodejsexample_01_exports/lib/index.js'),
    noderesolvedlibindex)

  assert.strictEqual(
    resolvewithplus('nodejsexample_01_exports/feature'),
    noderesolvedfeatureindex)

  assert.strictEqual(
    resolvewithplus('nodejsexample_01_exports/feature/index'),
    noderesolvedfeatureindex)

  assert.strictEqual(
    resolvewithplus('nodejsexample_01_exports/feature/index.js'),
    noderesolvedfeatureindex)

  assert.strictEqual(
    resolvewithplus('nodejsexample_01_exports/package.json'),
    noderesolvedpackagejson)
})

// "Package entry points"
// from: https://nodejs.org/api/packages.html#package-entry-points
// {
//   "name": "my-package",
//   "exports": {
//     ".": "./lib/index.js",
//     "./lib": "./lib/index.js",
//     "./lib/*": "./lib/*.js",
//     "./lib/*.js": "./lib/*.js",
//     "./feature": "./feature/index.js",
//     "./feature/*": "./feature/*.js",
//     "./feature/*.js": "./feature/*.js",
//     "./package.json": "./package.json"
//   }
// }
test('should mock all exports from nodejsexample_02_exports', () => {
  const noderesolvedlibindex = toresolvefileurl(
    './nodejsexample_02_exports/lib/index.test.js')
  const noderesolvedfeatureindex = toresolvefileurl(
    './nodejsexample_02_exports/feature/index.test.js')
  const noderesolvedpackagejson = toresolvefileurl(
    './nodejsexample_02_exports/package.json')

  assert.strictEqual(
    resolvewithplus('nodejsexample_02_exports'),
    noderesolvedlibindex)

  assert.strictEqual(
    resolvewithplus('nodejsexample_02_exports/lib'),
    noderesolvedlibindex)

  assert.strictEqual(
    resolvewithplus('nodejsexample_02_exports/lib/index'),
    noderesolvedlibindex)

  assert.strictEqual(
    resolvewithplus('nodejsexample_02_exports/lib/index.js'),
    noderesolvedlibindex)

  assert.strictEqual(
    resolvewithplus('nodejsexample_02_exports/feature'),
    noderesolvedfeatureindex)

  assert.strictEqual(
    resolvewithplus('nodejsexample_02_exports/feature/index'),
    noderesolvedfeatureindex)

  assert.strictEqual(
    resolvewithplus('nodejsexample_02_exports/feature/index.js'),
    noderesolvedfeatureindex)

  assert.strictEqual(
    resolvewithplus('nodejsexample_02_exports/package.json'),
    noderesolvedpackagejson)
})

// "Package entry points"
// from: https://nodejs.org/api/packages.html#package-entry-points
// {
//   "name": "my-package",
//   "exports": {
//     ".": "./lib/index.js",
//     "./feature/*.js": "./feature/*.js",
//     "./feature/internal/*": null
//   }
// }
test('should mock all exports from nodejsexample_03_exports', () => {
  const noderesolvedlibindex = toresolvefileurl(
    './nodejsexample_03_exports/lib/index.test.js')
  const noderesolvedfeatureindex = toresolvefileurl(
    './nodejsexample_03_exports/feature/index.test.js')

  assert.strictEqual(
    resolvewithplus('nodejsexample_03_exports'),
    noderesolvedlibindex)

  assert.strictEqual(
    resolvewithplus('nodejsexample_03_exports/feature/index.test.js'),
    noderesolvedfeatureindex)
})

// "Package entry points"
// from: https://nodejs.org/api/packages.html#package-entry-points
// {
//   "name": "my-package",
//   "exports": "./lib/index.js"
// }
test('should mock all exports from nodejsexample_04_exports', () => {
  const noderesolvedlibindex = toresolvefileurl(
    './nodejsexample_04_exports/lib/index.test.js')

  assert.strictEqual(
    resolvewithplus('nodejsexample_04_exports'),
    noderesolvedlibindex)
})

// "Subpath exports"
// from: https://nodejs.org/api/packages.html#subpath-exports
// {
//   "exports": {
//     ".": "./index.js",
//     "./submodule.js": "./src/submodule.js"
//   }
// }
test('should mock all exports from nodejsexample_05_exports, subpaths', () => {
  const noderesolvedindex = toresolvefileurl(
    './nodejsexample_05_exports/index.test.js')
  const noderesolvedsubmodule = toresolvefileurl(
    './nodejsexample_05_exports/src/submodule.js')

  assert.strictEqual(
    resolvewithplus('nodejsexample_05_exports'),
    noderesolvedindex)

  assert.strictEqual(
    resolvewithplus('nodejsexample_05_exports/submodule.js'),
    noderesolvedsubmodule)
})

// "Exports sugar"
// from: https://nodejs.org/api/packages.html#exports-sugar
// {
//   "exports": {
//     ".": "./index.js",
//   }
// }
test('should mock all exports from nodejsexample_06_exports, sugar "."', () => {
  const noderesolvedmain = toresolvefileurl(
    './nodejsexample_06_exports/main.js')

  assert.strictEqual(
    resolvewithplus('nodejsexample_06_exports'),
    noderesolvedmain)
})

// "Exports sugar"
// from: https://nodejs.org/api/packages.html#exports-sugar
// {
//   "exports": "./index.js"
// }
test('should mock all exports from nodejsexample_07_exports, sugar "."', () => {
  const noderesolvedmain = toresolvefileurl(
    './nodejsexample_07_exports/main.js')

  assert.strictEqual(
    resolvewithplus('nodejsexample_07_exports'),
    noderesolvedmain)
})

// "Conditional exports"
// from: https://nodejs.org/api/packages.html#conditional-exports
// {
//   "exports": {
//     "import": "./index-module.js",
//     "require": "./index-require.cjs"
//   }
// }
test('should mock exports from nodejsexample_10_exports, conditional', () => {
  const noderesolvedindexmodule = toresolvefileurl(
    './nodejsexample_10_exports/index-module.js')

  assert.strictEqual(
    resolvewithplus('nodejsexample_10_exports'),
    noderesolvedindexmodule)
})

// "Conditional exports"
// from: https://nodejs.org/api/packages.html#conditional-exports
// {
//   "exports": {
//     ".": "./index.js",
//     "./feature.js": {
//       "node": "./feature-node.js",
//       "default": "./feature.js"
//     }
//   }
// }
test('should mock exports from nodejsexample_11_exports, conditional', () => {
  const noderesolvedindex = toresolvefileurl(
    './nodejsexample_11_exports/index.test.js')
  const noderesolvedfeaturenode = toresolvefileurl(
    './nodejsexample_11_exports/feature-node.js')

  assert.strictEqual(
    resolvewithplus('nodejsexample_11_exports'),
    noderesolvedindex)

  assert.strictEqual(
    resolvewithplus('nodejsexample_11_exports/feature.js'),
    noderesolvedfeaturenode)
})

// "Nested conditions"
// from: https://nodejs.org/api/packages.html#nested-conditions
// {
//   "exports": {
//     "node": {
//       "import": "./feature-node.mjs",
//       "require": "./feature-node.cjs"
//     },
//     "default": "./feature.mjs"
//   }
// }
test('should mock exports from nodejsexample_12_exports, nested cond', () => {
  const noderesolvedfeaturenode = toresolvefileurl(
    './nodejsexample_12_exports/feature-node.mjs')

  assert.strictEqual(
    resolvewithplus('nodejsexample_12_exports'),
    noderesolvedfeaturenode)
})

// "asterisk-directory named-property exports"
// from: https://github.com/iambumblehead/esmock/issues/289 @dschnare
// {
//   "exports": {
//     "./*": {
//       "default": "./src/*/index.js",
//       "types": "./types/*/index.d.ts"
//     }
//   }
// }
test('should mock exports from nodejsexample_13_exports, asterisk dir', () => {
  const noderesolvedindex = toresolvefileurl(
    './nodejsexample_13_exports/src/mystuff/index.js')

  assert.strictEqual(
    resolvewithplus('nodejsexample_13_exports/mystuff'),
    noderesolvedindex)
})

// "exports": './lib/index.js',
// "exports": { "import": "./lib/index.js" },
// "exports": { ".": "./lib/index.js" },
// "exports": { ".": { "import": "./lib/index.js" } }
test('should return exports sugar', () => {
  assert.strictEqual(
    resolvewithplus.esmparse('./lib/index.js', 'import'),
    './lib/index.js')

  assert.strictEqual(
    resolvewithplus.esmparse({ import: './lib/index.js' }, 'import'),
    './lib/index.js')

  assert.strictEqual(
    resolvewithplus.esmparse({ '.': './lib/index.js' }, 'import'),
    './lib/index.js')

  assert.strictEqual(
    resolvewithplus.esmparse({ '.': { import: './lib/index.js' } }, 'import'),
    './lib/index.js')
})
