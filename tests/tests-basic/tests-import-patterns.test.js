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
  const noderesolvedsubpathimport = path
    .resolve('./nodejsexample_08_imports/dep-polyfill.js');

  //assert.strictEqual(
  //  resolvewithplus('#dep', path.resolve('./nodejsexample_01_exports')),
  //  null);

  assert.strictEqual(
    resolvewithplus('#dep', path.resolve('./nodejsexample_08_imports')),
    noderesolvedsubpathimport);
});
