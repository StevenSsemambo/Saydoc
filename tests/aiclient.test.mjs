// Run with:  npm run test:client
import { test } from 'node:test'
import assert from 'node:assert/strict'

// minimal browser stand-ins
const store = new Map()
globalThis.localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) }
globalThis.window = { dispatchEvent: () => true, addEventListener() {}, removeEventListener() {} }
Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true })

const { redact, isAIEnabled, setAIEnabled, aiAvailable, askAI, parseAIReply } = await import('../src/utils/aiClient.js')

test('redact removes phone numbers and emails but keeps symptoms and ages', () => {
  const out = redact('My number is +256 772 123 456, email me at a.b@mail.com. I am 30 and have had fever for 3 days.')
  assert.ok(!/772|123|a\.b@/.test(out)); assert.match(out, /\[number\]/); assert.match(out, /\[email\]/)
  assert.match(out, /I am 30 and have had fever for 3 days/)
})

test('online AI is ON by default and can be switched off for the device', () => {
  assert.equal(isAIEnabled(), true); assert.equal(aiAvailable(), true)
  setAIEnabled(false)
  assert.equal(isAIEnabled(), false); assert.equal(aiAvailable(), false)
  setAIEnabled(true); assert.equal(isAIEnabled(), true)
})

test('when switched off, askAI never touches the network', async () => {
  setAIEnabled(false)
  let called = false
  globalThis.fetch = async () => { called = true; return new Response('{}') }
  assert.equal(await askAI({ messages: [{ role: 'user', content: 'hi' }] }), null)
  assert.equal(called, false)
  setAIEnabled(true)
})

test('askAI sends redacted text, never raw phone numbers', async () => {
  let sent
  globalThis.fetch = async (url, init) => { sent = JSON.parse(init.body); return new Response(JSON.stringify({ ok: true, text: 'hello', provider: 'groq' })) }
  const r = await askAI({ messages: [{ role: 'user', content: 'call me on 0772123456 about my cough' }] })
  assert.equal(r.text, 'hello'); assert.ok(!sent.messages[0].content.includes('0772123456')); assert.match(sent.messages[0].content, /cough/)
})

test('parseAIReply extracts suggestion chips and the checker flag', () => {
  const r = parseAIReply('Drink fluids.\n[[suggest: What is ORS? | When to go to clinic]]\n[[checker]]')
  assert.equal(r.text, 'Drink fluids.'); assert.deepEqual(r.suggestions, ['What is ORS?', 'When to go to clinic']); assert.equal(r.wantsChecker, true)
})
