import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Volume2, VolumeX, Pause, Play, Square, ChevronDown, ChevronUp } from 'lucide-react'

// ── Global TTS state so only one reader plays at a time ───────
let globalStop = null

export function stopAllAudio() {
  if (globalStop) globalStop()
  window.speechSynthesis?.cancel()
}

// ── Strip markdown/html for clean speech ──────────────────────
function cleanText(text) {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/•|·|→/g, '.')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ── Split text into sentences for progress tracking ───────────
function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]+/g) || [text]
}

export default function AudioReader({ text, label = 'Listen', compact = false }) {
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [voice, setVoice] = useState(null)
  const [voices, setVoices] = useState([])
  const [supported, setSupported] = useState(true)

  const utterRef = useRef(null)
  const sentencesRef = useRef([])
  const currentIdxRef = useRef(0)
  const cleanedRef = useRef('')

  // Load voices
  useEffect(() => {
    if (!window.speechSynthesis) { setSupported(false); return }
    const load = () => {
      const v = window.speechSynthesis.getVoices()
      setVoices(v)
      // Prefer English voices
      const preferred = v.find(x => x.lang.startsWith('en') && x.localService) ||
                        v.find(x => x.lang.startsWith('en')) || v[0]
      if (preferred) setVoice(preferred)
    }
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    setPlaying(false)
    setPaused(false)
    setProgress(0)
    currentIdxRef.current = 0
  }, [])

  useEffect(() => {
    globalStop = stop
    return () => { if (globalStop === stop) globalStop = null }
  }, [stop])

  const speakFrom = useCallback((idx) => {
    window.speechSynthesis.cancel()
    const sentences = sentencesRef.current
    if (idx >= sentences.length) { stop(); return }

    const utter = new SpeechSynthesisUtterance(sentences.slice(idx).join(' '))
    utter.rate = speed
    utter.pitch = 1.05
    utter.volume = 1
    if (voice) utter.voice = voice

    // Track progress by word boundaries
    utter.onboundary = (e) => {
      if (e.name === 'sentence') {
        currentIdxRef.current++
        setProgress(Math.round((currentIdxRef.current / sentences.length) * 100))
      }
    }
    utter.onend = () => {
      setProgress(100)
      setTimeout(stop, 300)
    }
    utter.onerror = () => stop()

    utterRef.current = utter
    window.speechSynthesis.speak(utter)
    setPlaying(true)
    setPaused(false)
  }, [speed, voice, stop])

  const handlePlay = () => {
    if (!supported) return
    stopAllAudio()
    cleanedRef.current = cleanText(text)
    sentencesRef.current = splitSentences(cleanedRef.current)
    currentIdxRef.current = 0
    setProgress(0)
    speakFrom(0)
  }

  const handlePause = () => {
    if (paused) {
      window.speechSynthesis.resume()
      setPaused(false)
    } else {
      window.speechSynthesis.pause()
      setPaused(true)
    }
  }

  const handleStop = () => stop()

  const handleSpeedChange = (s) => {
    setSpeed(s)
    if (playing) {
      const idx = currentIdxRef.current
      window.speechSynthesis.cancel()
      setTimeout(() => speakFrom(idx), 100)
    }
  }

  if (!supported) return null

  if (compact) {
    return (
      <button
        onClick={playing ? handleStop : handlePlay}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/15 border border-emerald-600/20 text-emerald-400 text-xs font-semibold transition-all active:scale-95"
        title={playing ? 'Stop audio' : 'Listen to this'}
      >
        {playing ? <VolumeX size={13} /> : <Volume2 size={13} />}
        {playing ? 'Stop' : label}
        {playing && (
          <span className="ml-1 text-[10px] text-emerald-300">{progress}%</span>
        )}
      </button>
    )
  }

  return (
    <div className="bg-charcoal border border-white/10 rounded-2xl overflow-hidden">
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
          <Volume2 size={16} className="text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-cream text-xs font-semibold mb-1">{label}</p>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!playing && (
            <button onClick={handlePlay}
              className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center active:scale-90 transition-transform">
              <Play size={14} className="text-white ml-0.5" fill="white" />
            </button>
          )}
          {playing && (
            <>
              <button onClick={handlePause}
                className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center active:scale-90 transition-transform">
                {paused ? <Play size={14} className="text-emerald-400 ml-0.5" /> : <Pause size={14} className="text-emerald-400" />}
              </button>
              <button onClick={handleStop}
                className="w-8 h-8 rounded-xl bg-red-600/15 border border-red-600/20 flex items-center justify-center active:scale-90 transition-transform">
                <Square size={12} className="text-red-400" fill="#f87171" />
              </button>
            </>
          )}
          <button onClick={() => setExpanded(e => !e)}
            className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center active:scale-90 transition-transform">
            {expanded ? <ChevronUp size={14} className="text-mist" /> : <ChevronDown size={14} className="text-mist" />}
          </button>
        </div>
      </div>

      {/* Expanded options */}
      {expanded && (
        <div className="border-t border-white/5 px-4 py-3 space-y-3">
          {/* Speed */}
          <div>
            <p className="text-mist text-xs mb-2">Playback speed</p>
            <div className="flex gap-2">
              {[0.75, 1, 1.25, 1.5].map(s => (
                <button key={s} onClick={() => handleSpeedChange(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${speed === s ? 'bg-emerald-600 text-white' : 'bg-white/5 text-mist'}`}>
                  {s}×
                </button>
              ))}
            </div>
          </div>
          {/* Voice selection */}
          {voices.length > 1 && (
            <div>
              <p className="text-mist text-xs mb-2">Voice</p>
              <select
                value={voice?.name || ''}
                onChange={e => setVoice(voices.find(v => v.name === e.target.value))}
                className="w-full bg-midnight border border-white/10 rounded-xl px-3 py-2 text-cream text-xs focus:outline-none focus:border-emerald-600"
              >
                {voices.filter(v => v.lang.startsWith('en')).map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </div>
          )}
          {playing && (
            <p className="text-mist text-xs text-center">
              {progress}% complete
              {paused && <span className="text-yellow-400 ml-2">• Paused</span>}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Floating listen button for chat messages ──────────────────
export function MessageAudioBtn({ text }) {
  const [playing, setPlaying] = useState(false)

  const handle = () => {
    if (!window.speechSynthesis) return
    if (playing) {
      stopAllAudio()
      setPlaying(false)
      return
    }
    stopAllAudio()
    const clean = cleanText(text)
    const utter = new SpeechSynthesisUtterance(clean)
    utter.rate = 1
    utter.pitch = 1.05
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.lang.startsWith('en') && v.localService) || voices.find(v => v.lang.startsWith('en'))
    if (preferred) utter.voice = preferred
    utter.onend = () => setPlaying(false)
    utter.onerror = () => setPlaying(false)
    window.speechSynthesis.speak(utter)
    setPlaying(true)
  }

  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  return (
    <button onClick={handle}
      className={`p-1 rounded-lg transition-all active:scale-90 ${playing ? 'text-emerald-400 bg-emerald-600/15' : 'text-mist/50 hover:text-mist'}`}
      title={playing ? 'Stop reading' : 'Read aloud'}>
      {playing ? <VolumeX size={13} /> : <Volume2 size={13} />}
    </button>
  )
}
