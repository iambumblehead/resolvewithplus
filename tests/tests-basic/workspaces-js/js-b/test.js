import test from 'node:test'
import assert from 'node:assert/strict'
import resolvewithplus from '../../../../resolvewithplus.js'

if (import.meta.resolve.constructor.name === 'AsyncFunction') {
  test('should return workspace paths', async () => {
    assert.strictEqual(
      await import.meta.resolve('js-a'),
      resolvewithplus('js-a'))
  })
} else {
  test('should return workspace paths', () => {
    assert.strictEqual(
      import.meta.resolve('js-a'),
      resolvewithplus('js-a'))
  })
}
