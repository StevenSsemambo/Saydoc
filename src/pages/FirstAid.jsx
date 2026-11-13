import React, { useState } from 'react'
import { useLang } from '../context/LangContext.jsx'
import { useNavigate } from 'react-router-dom'
import firstAidData from '../knowledge/firstaid.json'
import { AlertTriangle, ChevronRight, ChevronDown, Phone, Heart, ChevronLeft } from 'lucide-react'
import AudioReader from '../components/ui/AudioReader.jsx'

function getSeverityConfig(lang) {
  const labels = lang === 'lg'
    ? { emergency:'OBULAAMU', high:'MANGU', moderate:'KOLA KATI', low:'NYWEZA' }
    : lang === 'sw'
    ? { emergency:'DHARURA', high:'HARAKA', moderate:'FANYA SASA', low:'SIMAMIA' }
    : { emergency:'EMERGENCY', high:'URGENT', moderate:'ACT NOW', low:'MANAGE' }
  return {
    emergency: { label: labels.emergency, bg: 'bg-red-900/40', border: 'border-red-700/40', badge: 'bg-red-600 text-white', icon: '🚨' },
    high:      { label: labels.high,      bg: 'bg-orange-900/30', border: 'border-orange-700/30', badge: 'bg-orange-600 text-white', icon: '⚠️' },
    moderate:  { label: labels.moderate,  bg: 'bg-yellow-900/20', border: 'border-yellow-700/20', badge: 'bg-yellow-600 text-white', icon: '❗' },
    low:       { label: labels.low,       bg: 'bg-charcoal', border: 'border-white/10', badge: 'bg-mist text-midnight', icon: 'ℹ️' },
  }
}

// Normalize a situation so both old and new schemas work
function normalizeSituation(s) {
  // steps can be array of strings OR array of {step, title, action} objects
  const steps = (s.steps || []).map(step =>
    typeof step === 'string' ? step : `${step.title ? step.title + ': ' : ''}${step.action || ''}`
  )
  // Map urgency string to severity key when severity is missing
  const urgencyToSeverity = (u = '') => {
    const lu = u.toLowerCase()
    if (lu.includes('life') || lu.includes('critical')) return 'emergency'
    if (lu.includes('urgent')) return 'high'
    return 'moderate'
  }
  return {
    ...s,
    steps,
    severity: s.severity || urgencyToSeverity(s.urgency),
    when_to_seek_help: s.when_to_seek_help || s.call_for_help_if || s.urgency || 'Seek medical help if condition worsens.',
    do_not: Array.isArray(s.do_not) ? s.do_not : [],
  }
}

function FirstAidCard({ situation: rawSituation }) {
  const situation = normalizeSituation(rawSituation)
  const { lang } = useLang()
  const [open, setOpen] = useState(false)
  const SEVERITY_CONFIG = getSeverityConfig(lang)
  const cfg = SEVERITY_CONFIG[situation.severity] || SEVERITY_CONFIG.low

  return (
    <div className={`rounded-3xl border overflow-hidden ${cfg.bg} ${cfg.border}`}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full p-4 flex items-center gap-3 active:opacity-80 transition-opacity">
        <div className="w-12 h-12 bg-black/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">{situation.icon}</span>
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-cream font-display font-bold text-base">{situation.name}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${cfg.badge}`}>{cfg.label}</span>
          </div>
          {situation.call_for_help && (
            <div className="flex items-center gap-1">
              <Phone size={11} className="text-red-400" />
              <p className="text-red-400 text-xs font-semibold">{lang==='lg'?'Yita obuyambi obulaamu':lang==='sw'?'Piga simu msaada wa dharura':'Call for emergency help'}</p>
            </div>
          )}
        </div>
        {open ? <ChevronDown size={18} className="text-mist flex-shrink-0" /> : <ChevronRight size={18} className="text-mist flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-white/10 animate-slide-up">
          {/* Steps */}
          <div className="px-4 py-4 space-y-3">
            <p className="label-text">STEP-BY-STEP</p>
            {situation.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-cream text-sm leading-relaxed flex-1">{step}</p>
              </div>
            ))}
          </div>

          {/* Do NOT */}
          {situation.do_not?.length > 0 && (
            <div className="px-4 pb-4">
              <div className="bg-red-950/40 border border-red-800/20 rounded-2xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-red-400" />
                  <p className="text-red-400 text-xs font-bold uppercase tracking-wide">Do NOT</p>
                </div>
                {situation.do_not.map((d, i) => (
                  <p key={i} className="text-red-200/80 text-xs leading-relaxed mb-1">❌ {d}</p>
                ))}
              </div>
            </div>
          )}

          {/* When to seek help */}
          <div className="px-4 pb-4">
            <div className="bg-orange-950/30 border border-orange-800/20 rounded-2xl p-3">
              <p className="text-orange-400 text-xs font-bold mb-1">🏥 WHEN TO GO TO HOSPITAL</p>
              <p className="text-orange-200/80 text-xs leading-relaxed">{situation.when_to_seek_help}</p>
            </div>
          </div>

          {/* Recovery note */}
          {situation.recovery_note && (
            <div className="px-4 pb-4">
              <div className="bg-emerald-950/30 border border-emerald-800/20 rounded-2xl p-3">
                <p className="text-emerald-400 text-xs font-bold mb-1">💚 RECOVERY</p>
                <p className="text-mist text-xs leading-relaxed">{situation.recovery_note}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function FirstAid() {
  const { lang, tr } = useLang()
  const [search, setSearch] = useState('')
  const nav = useNavigate()
  const filtered = firstAidData.situations.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  )

  // Sort by severity
  const order = { emergency: 0, high: 1, moderate: 2, low: 3 }
  const sorted = [...filtered].sort((a, b) => (order[a.severity] || 3) - (order[b.severity] || 3))

  const audioText = sorted.map(s => {
    const norm = normalizeSituation(s)
    return `${norm.name}. Severity: ${norm.severity}. Steps: ${norm.steps.join('. ')}. When to go to hospital: ${norm.when_to_seek_help}`
  }).join('\n\n')

  return (
    <div className="h-full flex flex-col bg-midnight safe-top">
      <div className="bg-charcoal border-b border-white/5 px-5 pt-8 pb-4 flex-shrink-0">
        <button onClick={() => nav(-1)} className="flex items-center gap-1 text-emerald-500 text-sm font-medium mb-3 active:opacity-70">
          <ChevronLeft size={16} />Back
        </button>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-red-600/20 rounded-2xl flex items-center justify-center">
            <Heart size={20} className="text-red-400" />
          </div>
          <h1 className="font-display font-bold text-2xl text-cream">First Aid Guide</h1>
        </div>
        <p className="text-mist text-sm mb-3">Step-by-step emergency guidance — 100% offline</p>
        <AudioReader text={audioText} label="Listen to all guides" />
        <div className="mt-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search situations..."
            className="w-full bg-midnight border border-white/10 rounded-2xl px-4 py-3 text-cream text-sm placeholder-mist/40 focus:outline-none focus:border-emerald-600 transition-colors" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-3">
        {/* Emergency banner */}
        <div className="bg-red-900/40 border border-red-700/40 rounded-2xl p-3 flex items-start gap-2">
          <AlertTriangle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-200/80 text-xs leading-relaxed">
            This guide provides first aid support while waiting for or travelling to professional medical care. For life-threatening emergencies, call for help and go to hospital immediately.
          </p>
        </div>

        <p className="label-text">{sorted.length} SITUATION{sorted.length !== 1 ? 'S' : ''}</p>
        {sorted.map(s => <FirstAidCard key={s.id} situation={s} />)}
      </div>
    </div>
  )
}
