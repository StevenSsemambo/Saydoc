// ─────────────────────────────────────────────────────────────
// SayMyDoc — AI client
//
// Talks to the Netlify Function (/.netlify/functions/ai-chat), which
// tries Gemini first and Groq second. If we are offline, the function
// is not set up, or both providers fail, askAI() returns null and the
// caller falls back to the offline rule-based engine.
//
// No API keys exist in the browser. Ever.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'

const ENDPOINT = '/.netlify/functions/ai-chat'
const REQUEST_TIMEOUT_MS = 20000
const STATUS_TIMEOUT_MS = 6000

// After a failure, skip the network for a while so the user is not
// made to wait on a dead service for every message.
let pausedUntil = 0
const pause = (ms) => { pausedUntil = Date.now() + ms }

export function isOnline() {
  return typeof navigator === 'undefined' || navigator.onLine !== false
}

export function aiAvailable() {
  return isOnline() && Date.now() >= pausedUntil
}

/**
 * Ask the online AI.
 * @param {object} p
 * @param {'companion'|'checker'|'explain'|'ask'} p.mode
 * @param {'en'|'lg'|'sw'} p.lang
 * @param {{role:'user'|'assistant', content:string}[]} p.messages  last one must be 'user'
 * @param {{age?:number, sex?:string}} [p.profile]
 * @param {string} [p.grounding]  verified text from the offline knowledge base
 * @returns {Promise<{text:string, provider:string}|null>} null → use the offline engine
 */
export async function askAI({ mode = 'companion', lang = 'en', messages, profile, grounding }) {
  if (!aiAvailable()) return null

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        lang,
        messages,
        profile: profile ? { age: profile.age, sex: profile.sex } : undefined,
        grounding,
      }),
      signal: ctrl.signal,
    })

    let data = null
    try { data = await res.json() } catch { /* not JSON (e.g. local dev without functions) */ }

    if (!res.ok || !data?.ok || !data.text) {
      if (data?.error === 'not_configured' || res.status === 404) pause(30 * 60 * 1000)
      else if (res.status === 429) pause(30 * 1000)
      else pause(60 * 1000)
      return null
    }
    return { text: data.text, provider: data.provider }
  } catch {
    pause(20 * 1000) // network error / timeout
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Pull the [[suggest: a | b | c]] and [[checker]] tags the model appends
 * out of its reply.
 */
export function parseAIReply(raw) {
  let suggestions = []
  let wantsChecker = false
  const text = String(raw || '')
    .replace(/\[\[\s*suggest\s*:\s*([^\]]*)\]\]/gi, (_, s) => {
      suggestions = s.split('|').map(x => x.trim()).filter(Boolean).slice(0, 3)
      return ''
    })
    .replace(/\[\[\s*checker\s*\]\]/gi, () => { wantsChecker = true; return '' })
    .trim()
  return { text, suggestions, wantsChecker }
}

/** Flatten knowledge-base fields (strings / arrays / objects) into compact text. */
export function toGrounding(parts) {
  const flat = (v) => {
    if (v == null) return ''
    if (typeof v === 'string') return v
    if (Array.isArray(v)) return v.map(flat).filter(Boolean).join('; ')
    if (typeof v === 'object') return Object.values(v).map(flat).filter(Boolean).join('; ')
    return String(v)
  }
  return Object.entries(parts)
    .map(([label, v]) => [label, flat(v)])
    .filter(([, v]) => v)
    .map(([label, v]) => `${label}: ${v}`)
    .join('\n')
    .slice(0, 3400)
}

// ── Status: 'checking' | 'online' | 'offline' | 'unavailable' ─────
// 'unavailable' = we have internet but the AI service is not set up / not reachable.
async function probe() {
  if (!isOnline()) return 'offline'
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), STATUS_TIMEOUT_MS)
  try {
    const res = await fetch(ENDPOINT, { method: 'GET', signal: ctrl.signal, cache: 'no-store' })
    const data = await res.json()
    const ok = res.ok && data?.ok && (data.gemini?.configured || data.groq?.configured)
    if (!ok) { pause(30 * 60 * 1000); return 'unavailable' }
    if (Date.now() < pausedUntil) pausedUntil = 0
    return 'online'
  } catch {
    return isOnline() ? 'unavailable' : 'offline'
  } finally {
    clearTimeout(timer)
  }
}

export function useAIStatus() {
  const [status, setStatus] = useState(isOnline() ? 'checking' : 'offline')

  useEffect(() => {
    let alive = true
    const check = () => probe().then(s => { if (alive) setStatus(s) })
    const goOffline = () => { if (alive) setStatus('offline') }
    check()
    window.addEventListener('online', check)
    window.addEventListener('offline', goOffline)
    return () => {
      alive = false
      window.removeEventListener('online', check)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return status
}
