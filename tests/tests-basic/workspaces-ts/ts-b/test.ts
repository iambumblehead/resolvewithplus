import test from 'node:test'
import assert from 'node:assert/strict'
import resolvewithplus from '../../../../resolvewithplus.js'

test('should return workspace paths', () => {
  const resolved = resolvewithplus('ts-a', import.meta.url)
  const expected = import.meta.url.replace('ts-b/test.ts', 'ts-a/index.ts')

  assert.strictEqual(resolved, expected)
})

test('should return ts path from js', () => {
  const resolved = resolvewithplus('./index.js', import.meta.url)
  const expected = import.meta.url.replace('ts-b/test.ts', 'ts-b/index.ts')

  assert.strictEqual(resolved, expected)
})
