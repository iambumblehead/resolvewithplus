import test from 'node:test'
import assert from 'node:assert/strict'
import resolvewithplus from '../../../../resolvewithplus.js'

test('should return workspace paths', () => {
  assert.strictEqual(
    import.meta.resolve('a'),
    resolvewithplus('a'))
})
