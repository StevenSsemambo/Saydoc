import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext.jsx'
import { useApp } from '../context/AppContext.jsx'
import { getPreferences, savePreferences } from '../db/database.js'
import { ALARM_SOUND_LIST, DEFAULT_ALARM_SOUND } from '../utils/alarmSounds.js'
import { setCurrentAlarmSound } from '../utils/alarmState.js'
import { Globe, Stethoscope, Bell, CheckCircle, Info, Volume2, Play, Sparkles } from 'lucide-react'
import { isAIEnabled, setAIEnabled } from '../utils/aiClient.js'

export default function Settings() {
  const nav = useNavigate()
  const { lang, setLang, hwMode, setHwMode, LANGUAGES, tr } = useLang()
  const { user } = useApp()
  const [saved, setSaved] = useState(false)
  const [aiOn, setAiOn] = useState(isAIEnabled)
  const [alarmSoundId, setAlarmSoundId] = useState(DEFAULT_ALARM_SOUND)
  const [playing, setPlaying] = useState(null)
  const [notifPerm, setNotifPerm] = useState(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )

  // Load saved alarm sound preference
  useEffect(() => {
    if (!user?.id) return
    getPreferences(user.id).then(p => {
      if (p?.alarm_sound_id) setAlarmSoundId(p.alarm_sound_id)
    }).catch(() => {})
  }, [user?.id])

  const handleLang = async (l) => {
    await setLang(l)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleHwMode = async () => {
    await setHwMode(!hwMode)
  }

  const handleSelectAlarmSound = async (soundId) => {
    setAlarmSoundId(soundId)
    setCurrentAlarmSound(soundId)
    if (user?.id) {
      const sound = ALARM_SOUND_LIST.find(s => s.id === soundId)
      await savePreferences(user.id, {
        alarm_sound_id: soundId,
        alarm_sound_data: sound?.data || null,
      }).catch(() => {})
      // Tell the SW to reload so it picks up the new sound preference
      navigator.serviceWorker?.controller?.postMessage({ type: 'RELOAD_REMINDERS' })
    }
  }

  const handlePreviewSound = (sound) => {
    try {
      setPlaying(sound.id)
      const audio = new Audio(sound.data)
      audio.volume = 0.8
      audio.play().catch(() => {})
      audio.onended = () => setPlaying(null)
      setTimeout(() => setPlaying(null), 4000)
    } catch { setPlaying(null) }
  }

  const handleRequestNotif = async () => {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setNotifPerm(result)
    if (result === 'granted') {
      navigator.serviceWorker?.ready?.then(reg => {
        reg.active?.postMessage({ type: 'START_ALARMS' })
      }).catch(() => {})
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-midnight safe-top pb-24">
      <div className="bg-charcoal border-b border-white/5 px-5 pt-8 pb-5 flex-shrink-0">
        <button onClick={() => nav(-1)} className="text-emerald-500 text-sm font-medium mb-3">← Back</button>
        <h1 className="font-display font-bold text-2xl text-cream">{tr('settings.title')}</h1>
        <p className="text-mist text-sm">{tr('settings.subtitle')}</p>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Language */}
        <div className="bg-charcoal rounded-3xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-600/15 rounded-xl flex items-center justify-center">
              <Globe size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-cream font-semibold text-sm">{tr('settings.language')} / Olulimi / Lugha</p>
              <p className="text-mist text-xs">{tr('settings.language.sub')}</p>
            </div>
            {saved && <CheckCircle size={16} className="text-emerald-400 ml-auto" />}
          </div>
          <div className="space-y-2">
            {Object.entries(LANGUAGES).map(([code, info]) => (
              <button key={code} onClick={() => handleLang(code)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${lang === code ? 'bg-emerald-600/20 border border-emerald-600/40' : 'bg-midnight border border-white/5'}`}>
                <span className="text-2xl">{info.flag}</span>
                <div className="text-left flex-1">
                  <p className={`text-sm font-semibold ${lang === code ? 'text-emerald-300' : 'text-cream'}`}>{info.native}</p>
                  <p className="text-mist text-xs">{info.name}</p>
                </div>
                {lang === code && <CheckCircle size={16} className="text-emerald-400" />}
              </button>
            ))}
          </div>
          <div className="mt-3 bg-midnight rounded-2xl p-3">
            <p className="text-mist text-xs leading-relaxed">
              <span className="text-emerald-400 font-semibold">Luganda:</span> {tr('settings.lang.luganda.note')} ✓<br />
              <span className="text-yellow-400 font-semibold">Swahili:</span> Full translation — East Africa coverage ✓<br />
              <span className="text-mist/60 font-semibold">More languages coming:</span> Runyankole, Acholi, Ateso, Amharic
            </p>
          </div>
        </div>

        {/* {tr('settings.health.worker')} */}
        <div className="bg-charcoal rounded-3xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/15 rounded-xl flex items-center justify-center">
              <Stethoscope size={18} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-cream font-semibold text-sm">{tr('settings.health.worker')}</p>
              <p className="text-mist text-xs">{tr('settings.health.worker.sub')}</p>
            </div>
            <button onClick={handleHwMode}
              className={`w-12 h-6 rounded-full transition-all relative ${hwMode ? 'bg-blue-600' : 'bg-midnight border border-white/20'}`}>
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${hwMode ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>
          {hwMode && (
            <div className="bg-blue-950/30 border border-blue-800/20 rounded-2xl p-3">
              <p className="text-blue-400 text-xs font-semibold mb-1">{tr('settings.health.worker')} is ON</p>
              <p className="text-blue-200/70 text-xs leading-relaxed mb-2">Enhanced features enabled: ICD-10 codes, differential diagnosis, referral guidance, clinical notes template.</p>
              <button onClick={() => nav('/healthworker')}
                className="bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5">
                <Stethoscope size={12} /> Open Health Worker Assessment
              </button>
            </div>
          )}
        </div>

        {/* Online AI (privacy control) */}
        <div className="bg-charcoal rounded-3xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600/15 rounded-xl flex items-center justify-center">
              <Sparkles size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-cream font-semibold text-sm">{tr('ai.settings.title')}</p>
              <p className="text-mist text-xs">{tr('ai.settings.sub')}</p>
            </div>
            <button role="switch" aria-checked={aiOn} aria-label={tr('ai.settings.title')}
              onClick={() => { const next = !aiOn; setAiOn(next); setAIEnabled(next) }}
              className={`w-12 h-6 rounded-full transition-all relative ${aiOn ? 'bg-emerald-600' : 'bg-midnight border border-white/20'}`}>
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${aiOn ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>
          <p className="text-mist/80 text-xs leading-relaxed">{tr('ai.settings.detail')}</p>
        </div>

        {/* Notifications & Alarm Sound */}
        <div className="bg-charcoal rounded-3xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600/15 rounded-xl flex items-center justify-center">
              <Bell size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-cream font-semibold text-sm">Medication Reminders</p>
              <p className="text-mist text-xs">Notifications & alarm sound</p>
            </div>
          </div>

          {/* Notification permission row */}
          <div className="bg-midnight rounded-2xl p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-cream text-xs font-semibold">Push Notifications</p>
              <p className="text-mist text-[11px]">
                {notifPerm === 'granted' ? '✅ Enabled — reminders will fire on time'
                  : notifPerm === 'denied' ? '🚫 Blocked — enable in phone settings'
                  : notifPerm === 'unsupported' ? '⚠️ Not supported on this device'
                  : '⚠️ Not yet enabled'}
              </p>
            </div>
            {notifPerm === 'default' && (
              <button onClick={handleRequestNotif}
                className="bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl whitespace-nowrap active:opacity-80">
                Enable
              </button>
            )}
            {notifPerm === 'denied' && (
              <span className="text-red-400 text-[10px] font-semibold">Check Settings</span>
            )}
            {notifPerm === 'granted' && (
              <span className="text-emerald-400 text-[10px] font-bold">ON</span>
            )}
          </div>

          {/* Alarm sound picker */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Volume2 size={13} className="text-mist" />
              <p className="text-mist text-xs font-semibold uppercase tracking-wide">Alarm Sound</p>
            </div>
            <div className="space-y-2">
              {ALARM_SOUND_LIST.map(sound => (
                <div key={sound.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${alarmSoundId === sound.id ? 'bg-emerald-600/15 border-emerald-600/40' : 'bg-midnight border-white/5'}`}>
                  <button onClick={() => handleSelectAlarmSound(sound.id)}
                    className="flex-1 flex items-center gap-3 text-left">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${alarmSoundId === sound.id ? 'border-emerald-500' : 'border-white/20'}`}>
                      {alarmSoundId === sound.id && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                    </div>
                    <span className={`text-sm font-medium ${alarmSoundId === sound.id ? 'text-emerald-300' : 'text-cream'}`}>
                      {sound.label}
                    </span>
                  </button>
                  <button onClick={() => handlePreviewSound(sound)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 ${playing === sound.id ? 'bg-emerald-600/40 text-emerald-300' : 'bg-white/5 text-mist'}`}>
                    <Play size={13} fill={playing === sound.id ? 'currentColor' : 'none'} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-mist/50 text-[11px] mt-2 leading-relaxed">
              Tap ▶ to preview. The selected sound plays when your medication time arrives.
            </p>
          </div>
        </div>

        {/* About SayMyDoc */}
        <div className="bg-charcoal rounded-3xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-emerald-500" />
            <p className="text-cream font-semibold text-sm">About This Build</p>
          </div>
          <div className="space-y-2 text-xs text-mist">
            {[
              ['Version', `v${__APP_VERSION__}`],
              ['Conditions', '39 fully profiled'],
              ['Follow-up questions', '114 intelligent questions'],
              ['Languages', 'English, Luganda, Swahili'],
              ['Medications', '12 Uganda-specific profiles'],
              ['Natural remedies', '12 evidence-rated remedies'],
              ['Emergency flags', '10 life-threat patterns'],
              ['AI Engine', 'Rule-based, 100% offline'],
              ['Data storage', 'On-device only (Dexie.js)'],
              ['Created by', 'SayMyTech Developers, Kampala'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-mist/60">{k}</span>
                <span className="text-cream font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-mist/30 text-xs">
          © 2026 SayMyTech Developers<br />
          "Because understanding your health is a human right."
        </p>
      </div>
    </div>
  )
}
