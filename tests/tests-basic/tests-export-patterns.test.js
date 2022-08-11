import path from 'path';
import test from 'node:test'
import assert from 'node:assert/strict'
import resolvewithplus from 'resolvewithplus';

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
    .resolve('./nodejsexample_01_exports/lib/index.js');
  const noderesolvedfeatureindex = path
    .resolve('./nodejsexample_01_exports/feature/index.js');
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
    .resolve('./nodejsexample_02_exports/lib/index.js');
  const noderesolvedfeatureindex = path
    .resolve('./nodejsexample_02_exports/feature/index.js');
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
  const noderesolvedlibindex = path
    .resolve('./nodejsexample_03_exports/lib/index.js');
  const noderesolvedfeatureindex = path
    .resolve('./nodejsexample_03_exports/feature/index.js');

  assert.strictEqual(
    resolvewithplus('nodejsexample_03_exports'),
    noderesolvedlibindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_03_exports/feature'),
    noderesolvedfeatureindex);
});

// from: https://nodejs.org/api/packages.html#package-entry-points
// {
//   "name": "my-package",
//   "exports": "./lib/index.js"
// }
test('should mock all exports from nodejsexample_04_exports', () => {
  const noderesolvedlibindex = path
    .resolve('./nodejsexample_04_exports/lib/index.js');

  assert.strictEqual(
    resolvewithplus('nodejsexample_04_exports'),
    noderesolvedlibindex);
});

// from: https://nodejs.org/api/packages.html#package-entry-points
// {
//   "exports": {
//     ".": "./index.js",
//     "./submodule.js": "./src/submodule.js"
//   }
// }
test('should mock all exports from nodejsexample_05_exports, subpaths', () => {
  const noderesolvedindex = path
    .resolve('./nodejsexample_05_exports/index.js');
  const noderesolvedsubmodule = path
    .resolve('./nodejsexample_05_exports/src/submodule.js');

  assert.strictEqual(
    resolvewithplus('nodejsexample_05_exports'),
    noderesolvedindex);

  assert.strictEqual(
    resolvewithplus('nodejsexample_05_exports/submodule.js'),
    noderesolvedsubmodule);
});
