// Run with:  node --test netlify/functions/
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

process.env.GEMINI_API_KEY = 'test-gemini-key'
process.env.GROQ_API_KEY = 'test-groq-key'

const { default: handler } = await import('./ai-chat.mjs')

const realFetch = globalThis.fetch
let calls
beforeEach(() => { calls = []; globalThis.fetch = realFetch })

const geminiOk = (text) => new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text }] } }] }), { status: 200 })
const groqOk = (text) => new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), { status: 200 })

let ipCounter = 0
const post = (body) => handler(new Request('http://x/.netlify/functions/ai-chat', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-nf-client-connection-ip': `10.0.0.${++ipCounter}` },
  body: JSON.stringify(body),
}))
const valid = { mode: 'companion', lang: 'en', messages: [{ role: 'user', content: 'What is malaria?' }] }

test('uses Gemini first', async () => {
  globalThis.fetch = async (url) => { calls.push(String(url)); return geminiOk('gemini answer') }
  const res = await post(valid); const data = await res.json()
  assert.equal(data.provider, 'gemini'); assert.equal(data.text, 'gemini answer')
  assert.equal(calls.length, 1); assert.match(calls[0], /generativelanguage\.googleapis\.com/)
})

test('falls back to Groq when Gemini hits its limit (429)', async () => {
  globalThis.fetch = async (url) => {
    calls.push(String(url))
    return String(url).includes('generativelanguage') ? new Response('quota', { status: 429 }) : groqOk('groq answer')
  }
  const data = await (await post(valid)).json()
  assert.equal(data.provider, 'groq'); assert.equal(data.text, 'groq answer'); assert.equal(calls.length, 2)
})

test('falls back to Groq when Gemini throws / times out', async () => {
  globalThis.fetch = async (url) => {
    if (String(url).includes('generativelanguage')) throw new Error('network down')
    return groqOk('groq answer')
  }
  assert.equal((await (await post(valid)).json()).provider, 'groq')
})

test('falls back to Groq when Gemini returns an empty/blocked reply', async () => {
  globalThis.fetch = async (url) => String(url).includes('generativelanguage')
    ? new Response(JSON.stringify({ promptFeedback: { blockReason: 'SAFETY' } }), { status: 200 })
    : groqOk('groq answer')
  assert.equal((await (await post(valid)).json()).provider, 'groq')
})

test('returns 503 when both providers fail (client then uses offline engine)', async () => {
  globalThis.fetch = async () => new Response('boom', { status: 500 })
  const res = await post(valid)
  assert.equal(res.status, 503); assert.equal((await res.json()).error, 'all_providers_failed')
})

test('keys are sent to providers but never returned to the client', async () => {
  let geminiHeaders, groqHeaders
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('generativelanguage')) { geminiHeaders = init.headers; return new Response('x', { status: 500 }) }
    groqHeaders = init.headers; return groqOk('ok')
  }
  const res = await post(valid); const raw = await res.text()
  assert.equal(geminiHeaders['x-goog-api-key'], 'test-gemini-key')
  assert.equal(groqHeaders.Authorization, 'Bearer test-groq-key')
  assert.ok(!raw.includes('test-gemini-key') && !raw.includes('test-groq-key'))
})

test('GET reports configuration without revealing keys', async () => {
  const res = await handler(new Request('http://x/.netlify/functions/ai-chat'))
  const raw = await res.text(); const data = JSON.parse(raw)
  assert.equal(data.gemini.configured, true); assert.equal(data.groq.configured, true)
  assert.ok(!raw.includes('test-'))
})

test('rejects malformed input', async () => {
  globalThis.fetch = async () => { throw new Error('should not be called') }
  assert.equal((await post({})).status, 400)
  assert.equal((await post({ messages: [] })).status, 400)
  assert.equal((await post({ messages: [{ role: 'assistant', content: 'hi' }] })).status, 400)
  assert.equal((await post({ messages: [{ role: 'user', content: 'x'.repeat(100) }, ...Array(10).fill({ role: 'user', content: 'y'.repeat(1500) })] })).status, 400)
})

test('system prompt carries safety rules, language and grounding; roles map correctly', async () => {
  let body
  globalThis.fetch = async (url, init) => { body = JSON.parse(init.body); return geminiOk('ok') }
  await post({
    mode: 'explain', lang: 'sw', grounding: 'Malaria: test before treating.',
    messages: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }, { role: 'user', content: 'fever' }],
  })
  const sys = body.systemInstruction.parts[0].text
  assert.match(sys, /never state a specific dose/i)
  assert.match(sys, /Swahili/)
  assert.match(sys, /Malaria: test before treating/)
  assert.deepEqual(body.contents.map(c => c.role), ['user', 'model', 'user'])
})

test('throttles abusive clients', async () => {
  globalThis.fetch = async () => geminiOk('ok')
  const send = () => handler(new Request('http://x/', {
    method: 'POST', headers: { 'x-nf-client-connection-ip': '9.9.9.9' }, body: JSON.stringify(valid),
  }))
  let last
  for (let i = 0; i < 22; i++) last = await send()
  assert.equal(last.status, 429)
})

test('reports not_configured when no keys exist', async () => {
  const g = process.env.GEMINI_API_KEY, q = process.env.GROQ_API_KEY
  delete process.env.GEMINI_API_KEY; delete process.env.GROQ_API_KEY
  try {
    const res = await post(valid)
    assert.equal(res.status, 503); assert.equal((await res.json()).error, 'not_configured')
  } finally { process.env.GEMINI_API_KEY = g; process.env.GROQ_API_KEY = q }
})
