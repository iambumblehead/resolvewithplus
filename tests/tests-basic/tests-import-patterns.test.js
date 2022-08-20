import path from 'path';
import test from 'node:test'
import assert from 'node:assert/strict'
import resolvewithplus from 'resolvewithplus';

// "Subpath imports"
// from: https://nodejs.org/api/packages.html#package-entry-points
// {
//   "imports": {
//     "#dep": {
//       "node": "dep-node-native",
//       "default": "./dep-polyfill.js"
//     }
//   },
//   "dependencies": {
//     "dep-node-native": "^1.0.0"
//   }
// }
test('should mock #subpath nodejsexample_08_imports, complex', () => {
  const parentURL = path.resolve('./nodejsexample_08_imports');
  const noderesolvedsubpathimport = path
    .resolve('./nodejsexample_08_imports/dep-polyfill.js');

  assert.strictEqual(
    resolvewithplus('#dep', path.resolve('./nodejsexample_01_exports')),
    null);

  assert.strictEqual(
    resolvewithplus('#dep', parentURL),
    noderesolvedsubpathimport);
});

// "Subpath patterns"
// https://nodejs.org/api/packages.html#subpath-patterns
// {
//   "exports": {
//     "./features/*.js": "./src/features/*.js"
//   },
//   "imports": {
//     "#internal/*.js": "./src/internal/*.js"
//   }
// }
test('should mock #subpath nodejsexample_09_imports, globby', async () => {
  const parentURL = path.resolve('./nodejsexample_09_imports');
  const noderesolvedfeaturesx = path
    .resolve('./nodejsexample_09_imports/src/features/x.js');
  const noderesolvedfeaturesy = path
    .resolve('./nodejsexample_09_imports/src/features/y/y.js');
  const noderesolvedinternalz = path
    .resolve('./nodejsexample_09_imports/src/internal/z.js');

  await import(resolvewithplus('nodejsexample_09_imports/features/x.js'))

  assert.strictEqual(
    resolvewithplus('nodejsexample_09_imports/features/x.js'),
    noderesolvedfeaturesx);

  assert.strictEqual(
    resolvewithplus('nodejsexample_09_imports/features/y/y.js'),
    noderesolvedfeaturesy);

  assert.strictEqual(
    resolvewithplus('#internal/z.js', parentURL),
    noderesolvedinternalz);
});
