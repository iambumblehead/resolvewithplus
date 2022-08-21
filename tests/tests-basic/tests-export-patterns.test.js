import path from 'path';
import test from 'node:test'
import assert from 'node:assert/strict'
import resolvewithplus from 'resolvewithplus';

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
  const noderesolvedlibindex = path
    .resolve('./nodejsexample_01_exports/lib/index.test.js');
  const noderesolvedfeatureindex = path
    .resolve('./nodejsexample_01_exports/feature/index.test.js');
  const noderesolvedpackagejson = path
    .resolve('./nodejsexample_01_exports/package.json');

  assert.strictEqual(
    resolvewithplus('nodejsexample_01_exports'),
    noderesolvedlibindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_01_exports/lib'),
    noderesolvedlibindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_01_exports/lib/index'),
    noderesolvedlibindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_01_exports/lib/index.js'),
    noderesolvedlibindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_01_exports/feature'),
    noderesolvedfeatureindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_01_exports/feature/index'),
    noderesolvedfeatureindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_01_exports/feature/index.js'),
    noderesolvedfeatureindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_01_exports/package.json'),
    noderesolvedpackagejson)
});

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
  const noderesolvedlibindex = path
    .resolve('./nodejsexample_02_exports/lib/index.test.js');
  const noderesolvedfeatureindex = path
    .resolve('./nodejsexample_02_exports/feature/index.test.js');
  const noderesolvedpackagejson = path
    .resolve('./nodejsexample_02_exports/package.json');

  assert.strictEqual(
    resolvewithplus('nodejsexample_02_exports'),
    noderesolvedlibindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_02_exports/lib'),
    noderesolvedlibindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_02_exports/lib/index'),
    noderesolvedlibindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_02_exports/lib/index.js'),
    noderesolvedlibindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_02_exports/feature'),
    noderesolvedfeatureindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_02_exports/feature/index'),
    noderesolvedfeatureindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_02_exports/feature/index.js'),
    noderesolvedfeatureindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_02_exports/package.json'),
    noderesolvedpackagejson)
});

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
test('should mock all exports from nodejsexample_03_exports', async () => {
  const noderesolvedlibindex = path
    .resolve('./nodejsexample_03_exports/lib/index.test.js');
  const noderesolvedfeatureindex = path
    .resolve('./nodejsexample_03_exports/feature/index.test.js');

  assert.strictEqual(
    resolvewithplus('nodejsexample_03_exports'),
    noderesolvedlibindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_03_exports/feature/index.test.js'),
    noderesolvedfeatureindex);
});

// "Package entry points"
// from: https://nodejs.org/api/packages.html#package-entry-points
// {
//   "name": "my-package",
//   "exports": "./lib/index.js"
// }
test('should mock all exports from nodejsexample_04_exports', () => {
  const noderesolvedlibindex = path
    .resolve('./nodejsexample_04_exports/lib/index.test.js');

  assert.strictEqual(
    resolvewithplus('nodejsexample_04_exports'),
    noderesolvedlibindex);
});

// "Subpath exports"
// from: https://nodejs.org/api/packages.html#subpath-exports
// {
//   "exports": {
//     ".": "./index.js",
//     "./submodule.js": "./src/submodule.js"
//   }
// }
test('should mock all exports from nodejsexample_05_exports, subpaths', () => {
  const noderesolvedindex = path
    .resolve('./nodejsexample_05_exports/index.test.js');
  const noderesolvedsubmodule = path
    .resolve('./nodejsexample_05_exports/src/submodule.js');

  assert.strictEqual(
    resolvewithplus('nodejsexample_05_exports'),
    noderesolvedindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_05_exports/submodule.js'),
    noderesolvedsubmodule)
});

// "Exports sugar"
// from: https://nodejs.org/api/packages.html#exports-sugar
// {
//   "exports": {
//     ".": "./index.js",
//   }
// }
test('should mock all exports from nodejsexample_06_exports, sugar "."', () => {
  const noderesolvedmain = path
    .resolve('./nodejsexample_06_exports/main.js');

  assert.strictEqual(
    resolvewithplus('nodejsexample_06_exports'),
    noderesolvedmain);
});

// "Exports sugar"
// from: https://nodejs.org/api/packages.html#exports-sugar
// {
//   "exports": "./index.js"
// }
test('should mock all exports from nodejsexample_07_exports, sugar "."', () => {
  const noderesolvedmain = path
    .resolve('./nodejsexample_07_exports/main.js');

  assert.strictEqual(
    resolvewithplus('nodejsexample_07_exports'),
    noderesolvedmain);
});

// "Exports sugar"
// from: https://nodejs.org/api/packages.html#exports-sugar
// {
//   "exports": "./index.js"
// }
