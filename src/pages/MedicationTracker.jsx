import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import medsData from '../knowledge/medications.json'
import { ALARM_SOUNDS, ALARM_SOUND_LIST, DEFAULT_ALARM_SOUND } from '../utils/alarmSounds.js'
import { getCurrentAlarmSound, setCurrentAlarmSound, claimAlarmListener } from '../utils/alarmState.js'
import {
  saveReminder, getReminders, deleteReminder,
  logDose, unlogDose, getAdherenceLogs, getTodayAdherence,
  getPreferences, savePreferences,
} from '../db/database.js'
import {
  Bell, BellOff, Plus, Trash2, CheckCircle, Circle, ChevronLeft,
  Pill, Flame, Calendar, Search, X, Clock, Info, ChevronDown, ChevronUp,
  Shield, TrendingUp, AlertTriangle, Check,
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────
const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const DAYS_FULL  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const ALL_DAYS   = [0,1,2,3,4,5,6]

const CRITICAL_MEDS = [
  'tenofovir_lamivudine_efavirenz','cotrimoxazole_prophylaxis',
  'artemether_lumefantrine','metformin','amlodipine','enalapril',
  'atenolol','levothyroxine','warfarin','prednisolone',
]

const CAT_COLORS = {
  analgesic:'#0284C7', NSAID:'#EA580C', antibiotic:'#16A34A',
  antimalarial:'#7C3AED', rehydration:'#0891B2', supplement:'#C9A84C',
  bronchodilator:'#0284C7', antiviral:'#EC4899', antifungal:'#CA8A04',
  antihistamine:'#EC4899', cardiovascular:'#EA580C', antidiabetic:'#16A34A',
  thyroid:'#7C3AED', anticoagulant:'#DC2626',
}
const CAT_ICONS = {
  analgesic:'💊', NSAID:'💊', antibiotic:'🦠', antimalarial:'🦟',
  rehydration:'💧', supplement:'🌿', bronchodilator:'💨',
  antiviral:'🛡️', antifungal:'🍄', antihistamine:'🌸',
  cardiovascular:'❤️', antidiabetic:'⚗️', thyroid:'🦋', anticoagulant:'🩸',
}

// ── Notification permission ────────────────────────────────────
async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

// ── Play alarm sound from a WAV data URL ──────────────────────
// Called when app is open and SW broadcasts PLAY_ALARM.
// Uses HTMLAudioElement so it works even before a user gesture
// (browsers allow audio triggered by notifications/messages).
function playAlarmFromDataUrl(dataUrl) {
  try {
    const audio = new Audio(dataUrl)
    audio.volume = 0.85
    audio.play().catch(() => {
      // Fallback: Web Audio API beep if Audio element is blocked
      playWebAudioBeep()
    })
    if (navigator.vibrate) navigator.vibrate([400, 150, 400, 150, 600])
  } catch { playWebAudioBeep() }
}

function playWebAudioBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const doPlay = () => {
      const beep = (freq, start, dur) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'; osc.frequency.value = freq
        gain.gain.setValueAtTime(0, ctx.currentTime + start)
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + start + 0.04)
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur)
        osc.start(ctx.currentTime + start); osc.stop(ctx.currentTime + start + dur + 0.05)
      }
      beep(880,0,0.18); beep(1047,0.22,0.18); beep(1319,0.44,0.28)
      beep(880,0.85,0.18); beep(1047,1.07,0.18); beep(1319,1.29,0.35)
      setTimeout(() => { try { ctx.close() } catch { /* best-effort: failure is fine */ } }, 2500)
    }
    ctx.state === 'suspended' ? ctx.resume().then(doPlay) : doPlay()
    if (navigator.vibrate) navigator.vibrate([400, 150, 400, 150, 600])
  } catch { /* audio unavailable */ }
}

// ── Bind the BroadcastChannel listener (idempotent) ──────────
// FIX Bug 5: Old version captured currentSoundId via closure — stale if user
// changes sound. Now always reads the current sound (utils/alarmState) at fire time.
function bindAlarmListener() {
  if (!claimAlarmListener()) return
  const bc = new BroadcastChannel('saymydoc-alarms')
  bc.onmessage = (e) => {
    if (e.data?.type !== 'PLAY_ALARM') return
    // Prefer sound data sent by SW; fallback to whatever is currently selected
    const soundId   = getCurrentAlarmSound()
    const soundData = e.data.soundData || ALARM_SOUNDS[soundId]?.data || ALARM_SOUNDS.chime.data
    playAlarmFromDataUrl(soundData)
  }
  navigator.serviceWorker?.addEventListener('message', (e) => {
    if (e.data?.type === 'OPEN_LOG') {
      const soundId = getCurrentAlarmSound()
      playAlarmFromDataUrl(ALARM_SOUNDS[soundId]?.data || ALARM_SOUNDS.chime.data)
    }
  })
}

// ── Signal SW to reload reminders ────────────────────────────
function notifySwReload() {
  navigator.serviceWorker?.controller?.postMessage({ type: 'RELOAD_REMINDERS' })
}

// ── Save chosen alarm sound data URL into ys_preferences ─────
// so the SW can read it from IDB when the app is closed
async function persistAlarmSoundToDb(userId, soundId) {
  const soundData = ALARM_SOUNDS[soundId]?.data || ALARM_SOUNDS.chime.data
  await savePreferences(userId, { alarm_sound_id: soundId, alarm_sound_data: soundData })
  setCurrentAlarmSound(soundId)
}

// ── Fallback in-app scheduler (when SW unavailable) ──────────
function scheduleRemindersForToday(reminders, soundId = DEFAULT_ALARM_SOUND) {
  if (Notification.permission !== 'granted') return
  const now      = new Date()
  const todayDay = now.getDay()
  reminders.forEach(rem => {
    if (!rem.active || !rem.days.includes(todayDay)) return
    if (rem.course_days && rem.start_date) {
      const end = new Date(rem.start_date)
      end.setDate(end.getDate() + Number(rem.course_days))
      if (now > end) return
    }
    rem.times.forEach(timeStr => {
      const [h, m] = timeStr.split(':').map(Number)
      const fireAt = new Date(); fireAt.setHours(h, m, 0, 0)
      const delay  = fireAt - now
      if (delay > 0 && delay < 86_400_000) {
        setTimeout(() => {
          try {
            new Notification(`💊 ${rem.med_name}`, {
              body: rem.note || `Your ${timeStr} dose. Tap to log it.`,
              icon: '/pwa-192x192.png', badge: '/pwa-192x192.png',
              tag: `med-fallback-${rem.id}-${timeStr}`,
              requireInteraction: true, vibrate: [400, 150, 400, 150, 600],
            })
            playAlarmFromDataUrl(ALARM_SOUNDS[soundId]?.data || ALARM_SOUNDS.chime.data)
          } catch { /* silently fail */ }
        }, delay)
      }
    })
  })
}

// ── Streak calculator ─────────────────────────────────────────
function calcStreak(reminders, logs) {
  if (!reminders.length) return 0
  const logSet = new Set(logs.map(l => `${l.reminder_id}__${l.date}__${l.time_slot || ''}`))

  let streak = 0
  const today = new Date()

  for (let i = 0; i < 90; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dayOfWeek = d.getDay()
    const dateStr = d.toISOString().split('T')[0]

    const activeRems = reminders.filter(r => {
      if (!r.active) return false
      if (!r.days.includes(dayOfWeek)) return false
      if (r.start_date && dateStr < r.start_date) return false
      if (r.course_days && r.start_date) {
        const end = new Date(r.start_date)
        end.setDate(end.getDate() + r.course_days)
        if (dateStr > end.toISOString().split('T')[0]) return false
      }
      return true
    })

    if (!activeRems.length) continue // no meds due this day, skip

    const allTaken = activeRems.every(r =>
      r.times.every(t => logSet.has(`${r.id}__${dateStr}__${t}`))
    )

    if (i === 0 && !allTaken) continue // today may be incomplete, don't break streak
    if (allTaken) { streak++ } else { break }
  }
  return streak
}

function calcAdherenceRate(reminders, logs, days = 7) {
  if (!reminders.length) return null
  const logSet = new Set(logs.map(l => `${l.reminder_id}__${l.date}__${l.time_slot || ''}`))
  let due = 0, taken = 0
  const today = new Date()

  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dayOfWeek = d.getDay()
    const dateStr = d.toISOString().split('T')[0]

    reminders.filter(r => {
      if (!r.active) return false
      if (!r.days.includes(dayOfWeek)) return false
      if (r.start_date && dateStr < r.start_date) return false
      return true
    }).forEach(r => {
      r.times.forEach(t => {
        due++
        if (logSet.has(`${r.id}__${dateStr}__${t}`)) taken++
      })
    })
  }
  return due === 0 ? null : Math.round((taken / due) * 100)
}

// ── Add Reminder modal ────────────────────────────────────────
function AddReminderModal({ onSave, onClose }) {
  const [step, setStep] = useState('med') // med | config
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [times, setTimes] = useState(['08:00'])
  const [days, setDays] = useState(ALL_DAYS)
  const [note, setNote] = useState('')
  const [courseDays, setCourseDays] = useState('')
  const [notifPerm, setNotifPerm] = useState(Notification?.permission || 'default')

  const filtered = medsData.medications.filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return m.name.toLowerCase().includes(q) ||
      m.brand_names.some(b => b.toLowerCase().includes(q))
  })

  const isCritical = selected && CRITICAL_MEDS.includes(selected.id)

  const addTime = () => {
    if (times.length >= 6) return
    setTimes(t => [...t, '12:00'])
  }

  const updateTime = (idx, val) => {
    setTimes(t => t.map((x, i) => i === idx ? val : x))
  }

  const removeTime = (idx) => {
    if (times.length <= 1) return
    setTimes(t => t.filter((_, i) => i !== idx))
  }

  const toggleDay = (d) => {
    setDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()
    )
  }

  const handleRequestNotif = async () => {
    const result = await requestNotificationPermission()
    setNotifPerm(result)
    if (result === 'granted') {
      // FIX Bug 2: reg.active can be null during the permission grant flow.
      // Use the first available SW (active → installing → waiting) to ensure
      // START_ALARMS is always delivered after the user grants permission.
      navigator.serviceWorker?.ready?.then(reg => {
        const sw = reg.active ?? reg.installing ?? reg.waiting
        sw?.postMessage({ type: 'START_ALARMS' })
      }).catch(() => {})
    }
  }

  const handleSave = () => {
    if (!selected || !times.length || !days.length) return
    const today = new Date().toISOString().split('T')[0]
    onSave({
      med_id: selected.id,
      med_name: selected.name,
      med_category: selected.category,
      times: times.sort(),
      days,
      note: note.trim(),
      active: true,
      course_days: courseDays ? parseInt(courseDays) : null,
      start_date: today,
      is_critical: CRITICAL_MEDS.includes(selected.id),
    })
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-end' }}>
      <div className="w-full bg-charcoal rounded-t-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            {step === 'config' && (
              <button onClick={() => setStep('med')} className="p-1.5 rounded-xl bg-midnight text-mist active:opacity-70">
                <ChevronLeft size={16} />
              </button>
            )}
            <h2 className="font-display font-bold text-lg text-cream">
              {step === 'med' ? 'Choose Medication' : 'Set Reminder'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-midnight text-mist active:opacity-70">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === 'med' ? (
            <div className="px-5 py-4 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist/50" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search medication..."
                  className="w-full bg-midnight border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-cream text-sm placeholder-mist/40 focus:outline-none focus:border-emerald-600"
                  autoFocus
                />
              </div>

              {/* Critical banner */}
              <div className="bg-red-950/40 border border-red-800/30 rounded-2xl p-3 flex items-start gap-2">
                <Shield size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300/80 text-xs leading-relaxed">
                  Highlighted meds (ART, TB, malaria, heart, diabetes) — consistent dosing is critical. Never skip.
                </p>
              </div>

              {/* Medication list */}
              <div className="space-y-2">
                {filtered.map(med => {
                  const isCrit = CRITICAL_MEDS.includes(med.id)
                  const color = CAT_COLORS[med.category] || '#00A86B'
                  const icon = CAT_ICONS[med.category] || '💊'
                  return (
                    <button key={med.id}
                      onClick={() => { setSelected(med); setNote(''); setStep('config') }}
                      className={`w-full p-3.5 rounded-2xl flex items-center gap-3 active:scale-98 transition-all text-left border ${isCrit ? 'border-red-800/40 bg-red-950/20' : 'border-white/5 bg-midnight'}`}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: color + '22' }}>
                        <span className="text-base">{icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-cream text-sm font-semibold">{med.name}</p>
                          {isCrit && <span className="text-red-400 text-[10px] font-bold uppercase tracking-wide">Critical</span>}
                        </div>
                        <p className="text-mist text-xs truncate">{med.brand_names.slice(0,2).join(' • ')}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-5">
              {/* Selected med */}
              <div className="bg-midnight rounded-2xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: (CAT_COLORS[selected.category] || '#00A86B') + '22' }}>
                  <span className="text-lg">{CAT_ICONS[selected.category] || '💊'}</span>
                </div>
                <div>
                  <p className="text-cream font-semibold text-sm">{selected.name}</p>
                  <p className="text-mist text-xs">{selected.brand_names.slice(0,1).join('')}</p>
                </div>
                {isCritical && (
                  <div className="ml-auto bg-red-900/40 border border-red-700/30 rounded-xl px-2 py-1">
                    <p className="text-red-400 text-xs font-bold">CRITICAL</p>
                  </div>
                )}
              </div>

              {/* Dosage hint */}
              {selected.adult_dose && (
                <div className="bg-emerald-950/40 border border-emerald-800/20 rounded-2xl p-3">
                  <p className="text-emerald-400 text-xs font-semibold mb-1">📋 Standard Adult Dose</p>
                  <p className="text-mist text-xs leading-relaxed">{selected.adult_dose}</p>
                </div>
              )}

              {/* Notification permission */}
              {notifPerm !== 'granted' && (
                <div className="bg-amber-950/40 border border-amber-800/30 rounded-2xl p-3">
                  <p className="text-amber-300 text-xs font-semibold mb-2">🔔 Enable reminders?</p>
                  <p className="text-amber-200/70 text-xs mb-3">Allow notifications so SayMyDoc can remind you at dose time — even when the app is closed.</p>
                  {notifPerm === 'denied'
                    ? <p className="text-red-400 text-xs">Notifications blocked. Enable in your phone settings to receive reminders.</p>
                    : <button onClick={handleRequestNotif} className="bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-xl active:opacity-80">
                        Allow Notifications
                      </button>
                  }
                </div>
              )}

              {/* Reminder times */}
              <div>
                <p className="label-text mb-2">REMINDER TIMES</p>
                <div className="space-y-2">
                  {times.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1 bg-midnight border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                        <Clock size={14} className="text-emerald-500" />
                        <input
                          type="time" value={t}
                          onChange={e => updateTime(idx, e.target.value)}
                          className="bg-transparent text-cream text-sm font-medium focus:outline-none flex-1"
                        />
                      </div>
                      {times.length > 1 && (
                        <button onClick={() => removeTime(idx)}
                          className="w-9 h-9 bg-red-900/30 rounded-xl flex items-center justify-center active:opacity-70">
                          <X size={14} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {times.length < 6 && (
                  <button onClick={addTime}
                    className="mt-2 flex items-center gap-1.5 text-emerald-500 text-xs font-semibold active:opacity-70">
                    <Plus size={14} /> Add another time
                  </button>
                )}
              </div>

              {/* Days */}
              <div>
                <p className="label-text mb-2">DAYS</p>
                <div className="flex gap-1.5">
                  {DAYS_SHORT.map((d, i) => (
                    <button key={i} onClick={() => toggleDay(i)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${days.includes(i)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-midnight text-mist border border-white/10'}`}>
                      {d}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setDays(ALL_DAYS)} className="text-emerald-500 text-xs font-medium">Every day</button>
                  <span className="text-mist/30">|</span>
                  <button onClick={() => setDays([1,2,3,4,5])} className="text-emerald-500 text-xs font-medium">Weekdays</button>
                  <span className="text-mist/30">|</span>
                  <button onClick={() => setDays([0,6])} className="text-emerald-500 text-xs font-medium">Weekends</button>
                </div>
              </div>

              {/* Course duration */}
              <div>
                <p className="label-text mb-2">COURSE LENGTH (OPTIONAL)</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-midnight border border-white/10 rounded-2xl px-4 py-2.5">
                    <input
                      type="number" min="1" max="365"
                      value={courseDays}
                      onChange={e => setCourseDays(e.target.value)}
                      placeholder="e.g. 7 for Coartem, 180 for ART refill..."
                      className="bg-transparent text-cream text-sm w-full focus:outline-none placeholder-mist/30"
                    />
                  </div>
                  <span className="text-mist text-sm">days</span>
                </div>
                <p className="text-mist/50 text-xs mt-1">Leave blank for ongoing medications (BP, diabetes, ART)</p>
              </div>

              {/* Note */}
              <div>
                <p className="label-text mb-2">PERSONAL NOTE (OPTIONAL)</p>
                <textarea
                  value={note} onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Take with food. Take with plenty of water..."
                  rows={2}
                  className="w-full bg-midnight border border-white/10 rounded-2xl px-4 py-3 text-cream text-sm placeholder-mist/30 focus:outline-none focus:border-emerald-600 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {step === 'config' && (
          <div className="px-5 pb-6 pt-3 border-t border-white/5 flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={!days.length || !times.length}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40">
              <Bell size={16} /> Save Reminder
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Today's dose card ─────────────────────────────────────────
function TodayDoseCard({ reminder, todayLogs, onToggle }) {
  const today = new Date().toISOString().split('T')[0]
  const color = CAT_COLORS[reminder.med_category] || '#00A86B'
  const icon = CAT_ICONS[reminder.med_category] || '💊'
  const isCrit = reminder.is_critical

  const takenSlots = new Set(todayLogs
    .filter(l => l.reminder_id === reminder.id && l.date === today)
    .map(l => l.time_slot))

  const allTaken = reminder.times.every(t => takenSlots.has(t))
  const someTaken = reminder.times.some(t => takenSlots.has(t))

  return (
    <div className={`bg-charcoal rounded-2xl p-4 border ${isCrit ? 'border-red-800/30' : 'border-white/5'}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: color + '22' }}>
          <span className="text-base">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-cream font-semibold text-sm">{reminder.med_name}</p>
            {isCrit && <span className="text-red-400 text-[9px] font-bold uppercase">Critical</span>}
          </div>
          {reminder.note && <p className="text-mist text-xs mb-2 leading-relaxed">{reminder.note}</p>}
          {/* Dose slots */}
          <div className="flex flex-wrap gap-2">
            {reminder.times.map(t => {
              const taken = takenSlots.has(t)
              return (
                <button key={t}
                  onClick={() => onToggle(reminder, t, taken)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                    taken
                      ? 'bg-emerald-600/20 border border-emerald-600/40 text-emerald-400'
                      : 'bg-midnight border border-white/15 text-mist'
                  }`}>
                  {taken ? <CheckCircle size={12} /> : <Circle size={12} />}
                  {t}
                  {taken && ' ✓'}
                </button>
              )
            })}
          </div>
        </div>
        {allTaken && (
          <div className="w-8 h-8 bg-emerald-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Check size={16} className="text-emerald-400" />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Streak display ────────────────────────────────────────────
function StreakBadge({ streak }) {
  const tier = streak >= 30 ? { label: 'Champion', color: '#C9A84C', bg: '#C9A84C18' }
    : streak >= 14 ? { label: 'Committed', color: '#00A86B', bg: '#00A86B18' }
    : streak >= 7  ? { label: 'Building', color: '#0284C7', bg: '#0284C718' }
    : streak >= 3  ? { label: 'Starting', color: '#7C3AED', bg: '#7C3AED18' }
    : { label: 'Day 1', color: '#8BA99A', bg: '#8BA99A18' }

  return (
    <div className="flex flex-col items-center justify-center gap-1 px-5 py-4 rounded-2xl"
      style={{ background: tier.bg, border: `1px solid ${tier.color}40` }}>
      <div className="flex items-center gap-1.5">
        <Flame size={22} style={{ color: tier.color }} />
        <span className="font-display font-bold text-3xl" style={{ color: tier.color }}>{streak}</span>
      </div>
      <p className="text-mist text-xs font-medium">{streak === 1 ? 'day' : 'days'}</p>
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tier.color }}>{tier.label}</span>
    </div>
  )
}

// ── 7-day adherence grid ──────────────────────────────────────
function AdherenceGrid({ reminders, logs }) {
  const today = new Date()
  const logSet = new Set(logs.map(l => `${l.reminder_id}__${l.date}__${l.time_slot || ''}`))

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const dayOfWeek = d.getDay()

    const activeRems = reminders.filter(r => {
      if (!r.active) return false
      if (!r.days.includes(dayOfWeek)) return false
      if (r.start_date && dateStr < r.start_date) return false
      return true
    })

    const due = activeRems.reduce((sum, r) => sum + r.times.length, 0)
    const taken = activeRems.reduce((sum, r) =>
      sum + r.times.filter(t => logSet.has(`${r.id}__${dateStr}__${t}`)).length, 0)

    const isToday = dateStr === today.toISOString().split('T')[0]
    const isFuture = d > today

    return { dateStr, dayOfWeek, due, taken, isToday, isFuture }
  })

  return (
    <div className="flex gap-1.5 justify-between">
      {days.map(({ dayOfWeek, due, taken, isToday, isFuture }) => {
        const pct = due === 0 ? -1 : taken / due
        const color = isFuture || due === 0 ? '#3D5247'
          : pct === 1 ? '#00A86B'
          : pct >= 0.5 ? '#C9A84C'
          : '#C0392B'

        return (
          <div key={dayOfWeek + Math.random()} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full aspect-square rounded-xl flex items-center justify-center"
              style={{ background: color + '33', border: `2px solid ${isToday ? color : 'transparent'}` }}>
              {!isFuture && due > 0 && (
                pct === 1 ? <Check size={14} style={{ color }} />
                : <span className="text-[10px] font-bold" style={{ color }}>{taken}/{due}</span>
              )}
              {(isFuture || due === 0) && <span className="text-mist/30 text-[10px]">—</span>}
            </div>
            <span className="text-[9px] text-mist font-medium">{DAYS_SHORT[dayOfWeek]}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Reminder management card ──────────────────────────────────
function ReminderManageCard({ reminder, onDelete, onToggleActive }) {
  const [expanded, setExpanded] = useState(false)
  const color = CAT_COLORS[reminder.med_category] || '#00A86B'
  const icon = CAT_ICONS[reminder.med_category] || '💊'

  const daysLabel = reminder.days.length === 7 ? 'Every day'
    : reminder.days.length === 5 && !reminder.days.includes(0) && !reminder.days.includes(6) ? 'Weekdays'
    : reminder.days.map(d => DAYS_SHORT[d]).join(', ')

  return (
    <div className={`bg-charcoal rounded-2xl overflow-hidden border ${reminder.active ? 'border-white/5' : 'border-white/5 opacity-60'}`}>
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: color + '22' }}>
          <span>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-cream font-semibold text-sm">{reminder.med_name}</p>
          <p className="text-mist text-xs">{reminder.times.join(' • ')} · {daysLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => onToggleActive(reminder)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 ${reminder.active ? 'bg-emerald-600/20 text-emerald-400' : 'bg-white/5 text-mist'}`}>
            {reminder.active ? <Bell size={14} /> : <BellOff size={14} />}
          </button>
          <button onClick={() => setExpanded(e => !e)}
            className="w-8 h-8 rounded-xl bg-midnight flex items-center justify-center text-mist active:opacity-70">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-4 py-3 space-y-3 animate-slide-up">
          {reminder.note && (
            <p className="text-mist text-xs leading-relaxed italic">"{reminder.note}"</p>
          )}
          {reminder.course_days && (
            <p className="text-mist text-xs">
              Course: {reminder.course_days} days from {reminder.start_date}
            </p>
          )}
          {reminder.is_critical && (
            <div className="bg-red-950/40 border border-red-800/30 rounded-xl p-2.5 flex items-start gap-2">
              <AlertTriangle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300/80 text-xs leading-relaxed">
                Critical medication. Skipping doses can cause treatment failure, drug resistance, or serious health consequences.
              </p>
            </div>
          )}
          <button onClick={() => onDelete(reminder.id)}
            className="flex items-center gap-1.5 text-red-400 text-xs font-semibold active:opacity-70">
            <Trash2 size={13} /> Delete Reminder
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function MedicationTracker() {
  const { user } = useApp()
  const { tr } = useLang()
  const nav = useNavigate()

  const [tab, setTab] = useState('today') // today | manage | history
  const [reminders, setReminders] = useState([])
  const [todayLogs, setTodayLogs] = useState([])
  const [allLogs, setAllLogs] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const swRegistered = useRef(false)

  const remindersRef = useRef([])
  const [alarmSoundId, setAlarmSoundId] = useState(DEFAULT_ALARM_SOUND)

  // On mount: bind BroadcastChannel listener + tell the unified SW to start alarm loop
  useEffect(() => {
    if (swRegistered.current) return
    swRegistered.current = true

    // Load saved sound preference
    if (user?.id) {
      getPreferences(user.id).then(p => {
        const id = p?.alarm_sound_id || DEFAULT_ALARM_SOUND
        setAlarmSoundId(id)
        setCurrentAlarmSound(id)
        bindAlarmListener()  // FIX Bug 5: no stale closure arg needed
      }).catch(() => bindAlarmListener())
    } else {
      bindAlarmListener()
    }

    // FIX Bug 2: reg.active can be null. Use active ?? installing ?? waiting.
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(reg => {
        const sw = reg.active ?? reg.installing ?? reg.waiting
        sw?.postMessage({ type: 'START_ALARMS' })
      }).catch(() => {})
    }
  }, [user?.id])  // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    if (!user?.id) return
    const [rems, today, all] = await Promise.all([
      getReminders(user.id),
      getTodayAdherence(user.id),
      getAdherenceLogs(user.id, 60),
    ])
    setReminders(rems)
    remindersRef.current = rems
    setTodayLogs(today)
    setAllLogs(all)
    setLoading(false)

    // Tell the unified SW to reload reminders from IndexedDB
    if (Notification.permission === 'granted' && rems.length) {
      notifySwReload()
    }

    // FIX Bug 4: fallback in-app scheduler was defined but NEVER called.
    // Call it here as a safety net for browsers where SW notifications are blocked.
    if (Notification.permission === 'granted' && rems.length) {
      const soundId = getCurrentAlarmSound()
      scheduleRemindersForToday(rems, soundId)
    }
  }, [user?.id])

  useEffect(() => { load() }, [load])

  const handleSaveReminder = async (data) => {
    const id = await saveReminder({ ...data, user_id: user.id })
    setShowAdd(false)
    load()
  }

  const handleDeleteReminder = async (id) => {
    await deleteReminder(id)
    load()
  }

  const handleToggleActive = async (reminder) => {
    await saveReminder({ ...reminder, active: !reminder.active })
    load()
  }

  const handleDoseToggle = async (reminder, timeSlot, wasTaken) => {
    const today = new Date().toISOString().split('T')[0]
    if (wasTaken) {
      await unlogDose(user.id, reminder.id, today, timeSlot)
    } else {
      await logDose(user.id, reminder.id, today, timeSlot)
    }
    load()
  }

  // Derived
  const streak = calcStreak(reminders, allLogs)
  const rate7 = calcAdherenceRate(reminders, allLogs, 7)
  const rate30 = calcAdherenceRate(reminders, allLogs, 30)
  const activeReminders = reminders.filter(r => r.active)
  const today = new Date()
  const todayDue = activeReminders.filter(r => r.days.includes(today.getDay()))

  // Today's completion
  const logSet = new Set(todayLogs.map(l => `${l.reminder_id}__${l.time_slot}`))
  const todayTotal = todayDue.reduce((s, r) => s + r.times.length, 0)
  const todayTaken = todayDue.reduce((s, r) =>
    s + r.times.filter(t => logSet.has(`${r.id}__${t}`)).length, 0)

  return (
    <div className="h-full flex flex-col bg-midnight safe-top">
      {/* Header */}
      <div className="bg-charcoal border-b border-white/5 px-5 pt-8 pb-4 flex-shrink-0">
        <button onClick={() => nav(-1)} className="flex items-center gap-1 text-emerald-500 text-sm font-medium mb-3 active:opacity-70">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Pill size={20} className="text-emerald-500" />
              <h1 className="font-display font-bold text-2xl text-cream">Med Tracker</h1>
            </div>
            <p className="text-mist text-sm">Adherence saves lives. Don't miss a dose.</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center shadow-btn active:scale-90 transition-all">
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {/* Stats row */}
        {!loading && reminders.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <StreakBadge streak={streak} />
            <div className="bg-midnight rounded-2xl p-3 flex flex-col items-center justify-center gap-1 border border-white/5">
              <span className="font-display font-bold text-2xl text-cream">{todayTaken}/{todayTotal}</span>
              <p className="text-mist text-[10px] font-medium text-center">Today's doses</p>
              {todayTotal > 0 && todayTaken === todayTotal && (
                <span className="text-emerald-400 text-[9px] font-bold">ALL DONE ✓</span>
              )}
            </div>
            <div className="bg-midnight rounded-2xl p-3 flex flex-col items-center justify-center gap-1 border border-white/5">
              <span className="font-display font-bold text-2xl" style={{
                color: rate7 === null ? '#8BA99A' : rate7 >= 90 ? '#00A86B' : rate7 >= 70 ? '#C9A84C' : '#C0392B'
              }}>
                {rate7 === null ? '—' : `${rate7}%`}
              </span>
              <p className="text-mist text-[10px] font-medium text-center">7-day rate</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-midnight rounded-2xl p-1 gap-1">
          {[
            { key: 'today', label: "Today's Doses" },
            { key: 'manage', label: 'Reminders' },
            { key: 'history', label: 'History' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${tab === t.key ? 'bg-emerald-600 text-white' : 'text-mist'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-3">

        {/* ── TODAY TAB ── */}
        {tab === 'today' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
              </div>
            ) : todayDue.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 bg-emerald-600/10 rounded-3xl flex items-center justify-center mx-auto">
                  <Pill size={28} className="text-emerald-600/50" />
                </div>
                <p className="text-cream font-semibold">No medications today</p>
                <p className="text-mist text-sm leading-relaxed max-w-xs mx-auto">
                  Tap <strong className="text-emerald-500">+</strong> to add your first medication reminder. Track TB, HIV, malaria, diabetes, and more.
                </p>
                <button onClick={() => setShowAdd(true)}
                  className="btn-primary inline-flex items-center gap-2 text-sm px-5">
                  <Plus size={16} /> Add Medication
                </button>
              </div>
            ) : (
              <>
                {todayTaken === todayTotal && todayTotal > 0 && (
                  <div className="bg-emerald-950/50 border border-emerald-700/40 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={20} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-emerald-300 font-semibold text-sm">All doses complete! 🎉</p>
                      <p className="text-emerald-400/60 text-xs">Your streak continues. Consistency saves lives.</p>
                    </div>
                  </div>
                )}
                {todayDue.map(r => (
                  <TodayDoseCard
                    key={r.id}
                    reminder={r}
                    todayLogs={todayLogs}
                    userId={user.id}
                    onToggle={handleDoseToggle}
                  />
                ))}
              </>
            )}
          </>
        )}

        {/* ── MANAGE TAB ── */}
        {tab === 'manage' && (
          <>
            {reminders.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 bg-charcoal rounded-3xl flex items-center justify-center mx-auto">
                  <Bell size={28} className="text-mist/40" />
                </div>
                <p className="text-cream font-semibold">No reminders yet</p>
                <p className="text-mist text-sm max-w-xs mx-auto">Add medications and SayMyDoc will remind you at dose time.</p>
                <button onClick={() => setShowAdd(true)} className="btn-primary inline-flex items-center gap-2 text-sm px-5">
                  <Plus size={16} /> Add Reminder
                </button>
              </div>
            ) : (
              <>
                <div className="bg-amber-950/30 border border-amber-800/20 rounded-2xl p-3 flex items-start gap-2">
                  <Info size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-200/70 text-xs leading-relaxed">
                    Tap the bell to pause/resume a reminder without deleting it.
                  </p>
                </div>
                {reminders.map(r => (
                  <ReminderManageCard
                    key={r.id}
                    reminder={r}
                    onDelete={handleDeleteReminder}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </>
            )}
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <>
            {reminders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-mist text-sm">Add a medication reminder to start tracking history.</p>
              </div>
            ) : (
              <>
                {/* 7-day grid */}
                <div className="bg-charcoal rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="label-text">LAST 7 DAYS</p>
                    {rate7 !== null && (
                      <span className="text-xs font-bold" style={{
                        color: rate7 >= 90 ? '#00A86B' : rate7 >= 70 ? '#C9A84C' : '#C0392B'
                      }}>{rate7}% adherence</span>
                    )}
                  </div>
                  <AdherenceGrid reminders={reminders} logs={allLogs} />
                </div>

                {/* 30-day rate */}
                {rate30 !== null && (
                  <div className="bg-charcoal rounded-2xl p-4">
                    <p className="label-text mb-3">30-DAY OVERVIEW</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="w-full h-3 bg-midnight rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${rate30}%`,
                              background: rate30 >= 90 ? '#00A86B' : rate30 >= 70 ? '#C9A84C' : '#C0392B'
                            }} />
                        </div>
                      </div>
                      <span className="font-display font-bold text-xl text-cream w-14 text-right">{rate30}%</span>
                    </div>
                    <p className="text-mist text-xs mt-2">
                      {rate30 >= 95 ? '🏆 Excellent adherence — you\'re protected.'
                        : rate30 >= 80 ? '👍 Good adherence. Aim for 95%+ for full effectiveness.'
                        : rate30 >= 60 ? '⚠️ Moderate adherence. Missed doses can reduce treatment effectiveness.'
                        : '🚨 Low adherence. For TB, HIV, and malaria — missed doses cause treatment failure and resistance.'}
                    </p>
                  </div>
                )}

                {/* Per-medication breakdown */}
                <p className="label-text">PER MEDICATION (7 DAYS)</p>
                {reminders.map(r => {
                  const rate = calcAdherenceRate([r], allLogs, 7)
                  const color = rate === null ? '#8BA99A'
                    : rate >= 90 ? '#00A86B' : rate >= 70 ? '#C9A84C' : '#C0392B'
                  return (
                    <div key={r.id} className="bg-charcoal rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: (CAT_COLORS[r.med_category] || '#00A86B') + '22' }}>
                        <span className="text-sm">{CAT_ICONS[r.med_category] || '💊'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-cream text-sm font-semibold mb-1">{r.med_name}</p>
                        <div className="w-full h-2 bg-midnight rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${rate ?? 0}%`, background: color }} />
                        </div>
                      </div>
                      <span className="text-sm font-bold flex-shrink-0" style={{ color }}>
                        {rate === null ? '—' : `${rate}%`}
                      </span>
                    </div>
                  )
                })}
              </>
            )}
          </>
        )}
      </div>

      {showAdd && (
        <AddReminderModal
          onSave={handleSaveReminder}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
