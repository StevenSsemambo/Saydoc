// Run with:  npm run test:functions
import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';

process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.GROQ_API_KEY = 'test-groq-key';

const { default: handler, __testing } = await import('../netlify/functions/ai-chat.mjs');

const realFetch = globalThis.fetch
let calls
beforeEach(() => { calls = []; globalThis.fetch = realFetch; __testing.reset() })

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
  assert.equal(data.provider, 'groq'); assert.equal(data.text, 'groq answer')
  assert.equal(calls.filter(u => u.includes('generativelanguage')).length, 3, 'tries every Gemini model first')
  assert.equal(calls.filter(u => u.includes('groq.com')).length, 1)
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

test('MODEL CHAIN: a retired Gemini model (404) falls through to the next Gemini model', async () => {
  const tried = []
  globalThis.fetch = async (url) => {
    const m = String(url).match(/models\/([^:]+):/)?.[1]
    tried.push(m)
    return m === 'gemini-3.8-flash' ? new Response('{"error":{"message":"model not found"}}', { status: 404 }) : geminiOk('from lite')
  }
  const data = await (await post(valid)).json()
  assert.equal(data.provider, 'gemini'); assert.equal(data.model, 'gemini-3.5-flash-lite'); assert.deepEqual(tried, ['gemini-3.8-flash', 'gemini-3.5-flash-lite'])
})

test('MODEL CHAIN: Groq defaults are the free gpt-oss models (Llama left the free tier)', async () => {
  const models = []
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('generativelanguage')) return new Response('quota', { status: 429 })
    models.push(JSON.parse(init.body).model)
    return models.length === 1 ? new Response('{"error":{"message":"gone"}}', { status: 404 }) : groqOk('ok')
  }
  const data = await (await post(valid)).json()
  assert.deepEqual(models, ['openai/gpt-oss-120b', 'openai/gpt-oss-20b']); assert.equal(data.provider, 'groq')
  assert.ok(!models.some(m => m.includes('llama')))
})

test('an invalid key (401) skips that provider\'s remaining models', async () => {
  const urls = []
  globalThis.fetch = async (url) => {
    urls.push(String(url))
    return String(url).includes('generativelanguage') ? new Response('{"error":{"message":"API key not valid"}}', { status: 400 + 1 }) : groqOk('ok')
  }
  const data = await (await post(valid)).json()
  assert.equal(data.provider, 'groq'); assert.equal(urls.filter(u => u.includes('generativelanguage')).length, 1)
})

test('503 body lists attempts (provider, model, reason) without secrets', async () => {
  globalThis.fetch = async () => new Response('{"error":{"message":"nope"}}', { status: 500 })
  const res = await post(valid); const raw = await res.text(); const body = JSON.parse(raw)
  assert.equal(res.status, 503)
  assert.ok(body.attempts.length >= 2); assert.ok(body.attempts.every(a => a.provider && a.model && a.reason))
  assert.ok(!raw.includes('test-gemini-key') && !raw.includes('test-groq-key'))
})

test('SELF-TEST: ?test=1 reports each model with a status and no keys', async () => {
  globalThis.fetch = async (url) => String(url).includes('generativelanguage')
    ? new Response('{"error":{"message":"models/x is not found"}}', { status: 404 })
    : groqOk('ok')
  const res = await handler(new Request('http://x/.netlify/functions/ai-chat?test=1', { headers: { 'x-nf-client-connection-ip': '7.7.7.7' } }))
  const raw = await res.text(); const data = JSON.parse(raw)
  assert.equal(data.anyWorking, true)
  const g = data.results.filter(r => r.provider === 'gemini'); const q = data.results.filter(r => r.provider === 'groq')
  assert.ok(g.length === 3 && g.every(r => !r.ok && r.status === 404 && /not found/.test(r.message)))
  assert.ok(q.length === 2 && q.every(r => r.ok))
  assert.ok(!raw.includes('test-gemini-key') && !raw.includes('test-groq-key'))
})

test('GEMINI_MODEL / GROQ_MODEL overrides are tried first and may be comma-separated', async () => {
  process.env.GEMINI_MODEL = 'my-custom-model, gemini-3.5-flash'
  try {
    const tried = []
    globalThis.fetch = async (url) => { tried.push(String(url).match(/models\/([^:]+):/)?.[1]); return geminiOk('ok') }
    await post(valid)
    assert.equal(tried[0], 'my-custom-model')
  } finally { delete process.env.GEMINI_MODEL }
})

test("mode 'ask' wraps the engine's question, forbids extra questions, and adds no suggestion chips", async () => {
  let sys
  globalThis.fetch = async (url, init) => { sys = JSON.parse(init.body).systemInstruction.parts[0].text; return geminiOk('ok') }
  await post({ mode: 'ask', lang: 'en', grounding: 'Question to ask (ask exactly this): Where is the headache?', messages: [{ role: 'user', content: "I'm feeling dizzy" }] })
  assert.match(sys, /ONE follow-up question/)
  assert.match(sys, /Where is the headache\?/)
  assert.doesNotMatch(sys, /FOLLOW-UP CHIPS/)
})

test('BUDGET: if Gemini hangs, Groq still gets time to answer (the real-world failure)', async () => {
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('generativelanguage')) {
      return new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(Object.assign(new Error('t'), { name: 'TimeoutError' }))))
    }
    return groqOk('groq saved the day')
  }
  const t0 = Date.now()
  const keepAlive = setInterval(() => {}, 100) // AbortSignal.timeout timers are unref'd; a real socket would keep the loop alive
  let data
  try { data = await (await post(valid)).json() } finally { clearInterval(keepAlive) }
  assert.equal(data.provider, 'groq'); assert.equal(data.text, 'groq saved the day')
  assert.ok(Date.now() - t0 < 9000, 'finishes inside the 9s function budget')
})

test('CIRCUIT BREAKER: a model that just returned 503 is skipped on the next message', async () => {
  globalThis.fetch = async (url) => String(url).includes('generativelanguage') ? new Response('{"error":{"message":"high demand"}}', { status: 503 }) : groqOk('ok')
  await post(valid)
  calls = []
  globalThis.fetch = async (url) => { calls.push(String(url)); return String(url).includes('generativelanguage') ? new Response('x', { status: 503 }) : groqOk('ok') }
  const data = await (await post(valid)).json()
  assert.equal(data.provider, 'groq')
  assert.equal(calls.filter(u => u.includes('generativelanguage')).length, 0, 'cooled-down Gemini models are not retried immediately')
})

test('retired model names are not in the defaults (gemini-2.5-flash is closed to new users)', async () => {
  const tried = []
  globalThis.fetch = async (url) => { tried.push(String(url).match(/models\/([^:]+):/)?.[1]); return new Response('x', { status: 500 }) }
  await post(valid)
  assert.ok(!tried.includes('gemini-2.5-flash'))
})
