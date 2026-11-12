// ── VoiceInput.jsx ───────────────────────────────────────────
// Web Speech API voice input button
// Works offline — recognition runs on-device in modern Android/Chrome.
// Supports: English (en-UG), Luganda (lg-UG fallback to sw-UG), Swahili (sw-TZ)
// Usage: <VoiceInput onResult={(text) => setInput(text)} lang="lg" disabled={typing} />

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, Square } from 'lucide-react'

// Map our lang codes to BCP-47 tags recognized by Web Speech API
// Luganda not yet a W3C-recognized locale so we try sw-UG → sw-TZ fallback
const LANG_MAP = {
  en: ['en-UG', 'en-GB', 'en-US'],
  lg: ['sw-UG', 'sw-TZ', 'en-UG'],   // Luganda fallback — use Swahili recognition + our NLP handles Luganda
  sw: ['sw-TZ', 'sw-KE', 'sw-UG'],
}

export default function VoiceInput({ onResult, lang = 'en', disabled = false, size = 'md' }) {
  const [state, setState] = useState('idle') // idle | listening | processing | unsupported
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const recogRef = useRef(null)
  const timeoutRef = useRef(null)

  // Check support once on mount
  const SpeechRecognition = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null

  const isSupported = !!SpeechRecognition

  const stop = useCallback(() => {
    if (recogRef.current) {
      recogRef.current.stop()
      recogRef.current = null
    }
    clearTimeout(timeoutRef.current)
    setState('idle')
    setTranscript('')
    setError(null)
  }, [])

  const start = useCallback(() => {
    if (!isSupported) { setState('unsupported'); return }
    if (state === 'listening') { stop(); return }

    setError(null)
    setTranscript('')
    setState('listening')

    const recog = new SpeechRecognition()
    recogRef.current = recog

    // Try preferred lang, fallback handled by browser
    const langs = LANG_MAP[lang] || LANG_MAP['en']
    recog.lang = langs[0]
    recog.continuous = false
    recog.interimResults = true
    recog.maxAlternatives = 3

    recog.onresult = (e) => {
      const interim = Array.from(e.results)
        .map(r => r[0].transcript).join(' ')
      setTranscript(interim)

      if (e.results[e.results.length - 1].isFinal) {
        const final = e.results[e.results.length - 1][0].transcript.trim()
        setState('processing')
        setTimeout(() => {
          onResult(final)
          stop()
        }, 300)
      }
    }

    recog.onerror = (e) => {
      if (e.error === 'no-speech') {
        setError(lang === 'lg' ? 'Tewaaliwo eddoboozi. Gezaako denuo.' : 'No speech detected. Try again.')
      } else if (e.error === 'not-allowed') {
        setError(lang === 'lg' ? 'Oyagala okukkiriza microphone.' : 'Microphone access denied. Allow mic in browser settings.')
      } else if (e.error === 'network') {
        setError(lang === 'lg' ? 'Taganye inneti. Gezaako singa waliwo inneti.' : 'Network error. Voice recognition may need internet on first use.')
      } else {
        setError(lang === 'lg' ? 'Tekyasoboka. Wandiika n\'obukono.' : 'Voice recognition failed. Please type instead.')
      }
      setState('idle')
    }

    recog.onend = () => {
      if (state === 'listening') setState('idle')
    }

    // Auto-stop after 15 seconds
    timeoutRef.current = setTimeout(stop, 15000)

    try { recog.start() } catch (err) {
      setError('Could not start microphone.')
      setState('idle')
    }
  }, [isSupported, state, lang, onResult, stop])

  // Cleanup on unmount
  useEffect(() => () => { stop() }, [stop])

  if (!isSupported) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-midnight border border-white/10">
        <MicOff size={12} className="text-mist/40" />
        <span className="text-mist/40 text-xs">{lang === 'lg' ? 'Eddoboozi teyina' : 'Voice not supported'}</span>
      </div>
    )
  }

  const sizes = {
    sm: { btn: 'w-8 h-8', icon: 12 },
    md: { btn: 'w-10 h-10', icon: 18 },
    lg: { btn: 'w-12 h-12', icon: 22 },
  }
  const sz = sizes[size] || sizes.md

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={start}
        disabled={disabled || state === 'processing'}
        className={`${sz.btn} rounded-xl flex items-center justify-center transition-all active:scale-90 relative
          ${state === 'listening'
            ? 'bg-red-600 shadow-[0_0_16px_rgba(239,68,68,0.5)]'
            : state === 'processing'
            ? 'bg-emerald-600/50'
            : 'bg-midnight border border-white/15 hover:border-emerald-600/40'}
          ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        aria-label={state === 'listening' ? 'Stop listening' : 'Start voice input'}
      >
        {state === 'listening' ? (
          <>
            <Square size={sz.icon - 4} className="text-white" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-xl animate-ping bg-red-500/30" />
          </>
        ) : state === 'processing' ? (
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Mic size={sz.icon} className="text-mist" />
        )}
      </button>

      {/* Live transcript bubble */}
      {state === 'listening' && transcript && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-charcoal border border-emerald-600/30 rounded-2xl px-3 py-2 animate-fade-in shadow-card z-10 max-w-xs">
          <div className="flex gap-1.5 items-center mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-emerald-400 font-semibold">
              {lang === 'lg' ? 'Nkuwulira...' : 'Listening...'}
            </span>
          </div>
          <p className="text-cream text-sm italic leading-snug">"{transcript}"</p>
        </div>
      )}

      {/* Status line for idle listening */}
      {state === 'listening' && !transcript && (
        <p className="text-red-400 text-xs text-center animate-pulse">
          {lang === 'lg' ? 'Yogera kati...' : 'Speak now...'}
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs leading-tight max-w-[160px]">{error}</p>
      )}
    </div>
  )
}

// ── Inline mic button for textarea rows ──────────────────────
// Drop-in for Chat and Companion input areas
export function VoiceInputInline({ onResult, lang = 'en', disabled = false }) {
  const [state, setState] = useState('idle')
  const [interim, setInterim] = useState('')
  const recogRef = useRef(null)

  const SpeechRecognition = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null

  const stop = useCallback(() => {
    recogRef.current?.stop()
    recogRef.current = null
    setState('idle')
    setInterim('')
  }, [])

  const toggle = useCallback(() => {
    if (!SpeechRecognition) return
    if (state === 'listening') { stop(); return }

    setState('listening')
    setInterim('')

    const recog = new SpeechRecognition()
    recogRef.current = recog
    recog.lang = (LANG_MAP[lang] || LANG_MAP['en'])[0]
    recog.continuous = false
    recog.interimResults = true

    recog.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('')
      setInterim(t)
      if (e.results[e.results.length - 1].isFinal) {
        onResult(t.trim())
        stop()
      }
    }
    recog.onerror = () => stop()
    recog.onend = () => setState(s => s === 'listening' ? 'idle' : s)

    setTimeout(stop, 15000)
    try { recog.start() } catch { stop() }
  }, [SpeechRecognition, state, lang, onResult, stop])

  useEffect(() => () => stop(), [stop])

  if (!SpeechRecognition) return null

  return (
    <div className="relative">
      <button
        onClick={toggle}
        disabled={disabled}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 flex-shrink-0
          ${state === 'listening'
            ? 'bg-red-600'
            : 'bg-midnight border border-white/10 hover:border-emerald-600/30'}
          ${disabled ? 'opacity-40' : ''}`}
        aria-label={state === 'listening' ? 'Stop' : 'Voice input'}
      >
        {state === 'listening'
          ? <Square size={12} className="text-white" />
          : <Mic size={16} className="text-mist" />}
        {state === 'listening' && (
          <span className="absolute inset-0 rounded-xl animate-ping bg-red-500/25" />
        )}
      </button>

      {/* Interim transcript shown above the button */}
      {interim && (
        <div className="absolute bottom-full mb-2 right-0 bg-charcoal border border-white/10 rounded-2xl px-3 py-2 z-10 w-48 animate-fade-in">
          <p className="text-cream text-xs italic">"{interim}"</p>
        </div>
      )}
    </div>
  )
}
