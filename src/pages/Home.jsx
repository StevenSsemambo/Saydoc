import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import { getHealthTips, t } from '../engine/LanguageEngine.js'
import { getSessions, getTodayJournal, getJournalEntries, getReminders, getTodayAdherence } from '../db/database.js'
import { CONDITIONS } from '../engine/InferenceEngine.js'
import { analysePatterns, getPredictiveAlert } from '../engine/SoulEngine.js'
import { MessageCircle, ChevronRight, Zap, Heart, AlertCircle, Sparkles, Pill, CheckCircle, Menu, X, Stethoscope, BookOpen, Brain, BookMarked, Leaf, MapPin, BarChart2 } from 'lucide-react'
import { MessageAudioBtn } from '../components/ui/AudioReader.jsx'

const CAT_COLORS = { neurological:'#7C3AED',infectious:'#DC2626',cardiovascular:'#EA580C',gastrointestinal:'#CA8A04',respiratory:'#0284C7',mental_health:'#0891B2',urinary:'#16A34A',eye:'#0EA5E9',haematological:'#DC2626',metabolic:'#CA8A04',nutritional:'#16A34A',dermatological:'#7C3AED',musculoskeletal:'#EA580C',ent:'#0891B2',womens_health:'#EC4899',environmental:'#16A34A' }
const CAT_ICONS = { neurological:'🧠',infectious:'🦠',cardiovascular:'❤️',gastrointestinal:'🫁',respiratory:'💨',mental_health:'💭',urinary:'💧',eye:'👁️',haematological:'🩸',metabolic:'⚗️',nutritional:'🥗',dermatological:'🩹',musculoskeletal:'🦴',ent:'👂',womens_health:'🌸',environmental:'🌡️' }

const DRAWER_ITEMS = [
  { to: '/tools',    icon: Stethoscope, emoji: '⚕️',  label_en: 'Health Tools',  label_lg: "Ebikozesebwa by'Obulamu", sub_en: 'BMI, Hydration, Calories',   sub_lg: 'BMI, Amazzi, Emmere',       color: '#f59e0b', bg: 'bg-amber-500/15'   },
  { to: '/library',  icon: BookOpen,    emoji: '📚',  label_en: 'Library',        label_lg: 'Akatabo',                  sub_en: 'All conditions',             sub_lg: 'Obulwadde bwona',            color: '#60a5fa', bg: 'bg-blue-500/15'    },
  { to: '/insights', icon: BarChart2,   emoji: '🧠',  label_en: 'Insights',       label_lg: 'Ebirabika',                sub_en: 'Your health patterns',       sub_lg: 'Empisa z\'obulamu bwo',      color: '#60a5fa', bg: 'bg-blue-500/15'    },
  { to: '/journal',  icon: BookMarked,  emoji: '📓',  label_en: 'Journal',        label_lg: 'Katabo',                   sub_en: 'Track how you feel today',   sub_lg: 'Kola nga oli otya leero',    color: '#22d3ee', bg: 'bg-cyan-500/15'    },
  { to: '/remedies', icon: Leaf,        emoji: '🌿',  label_en: 'Remedies',       label_lg: 'Obuvuzi',                  sub_en: '12 African plants',          sub_lg: 'Ebirime 12 by\'Afrika',      color: '#34d399', bg: 'bg-emerald-500/15' },
  { to: '/history',  icon: Brain,       emoji: '🕐',  label_en: 'History',        label_lg: 'Ebyafaayo',                sub_en: 'Past symptom checks',        sub_lg: 'Ebibiizo ebyafaayo',         color: '#a78bfa', bg: 'bg-purple-500/15'  },
  { to: '/healthworker', icon: Heart,   emoji: '👩‍⚕️', label_en: 'Health Worker',  label_lg: 'Omukozi w\'Obulamu',       sub_en: 'Clinical reference mode',    sub_lg: 'Enkola y\'omusawo',          color: '#f472b6', bg: 'bg-pink-500/15'    },
]

export default function Home() {
  const { user } = useApp()
  const nav = useNavigate()
  const [sessions, setSessions] = useState([])
  const [alert, setAlert] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { lang, tr } = useLang()
  const [tip] = useState(() => { const tips = getHealthTips(lang); return tips[Math.floor(Math.random() * tips.length)] })
  const [trackerSummary, setTrackerSummary] = useState(null)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? tr('home.greeting.morning') : hour < 17 ? tr('home.greeting.afternoon') : tr('home.greeting.evening')

  useEffect(() => {
    if (!user?.id) return
    getSessions(user.id, 5).then(setSessions)
    Promise.all([getReminders(user.id), getTodayAdherence(user.id)]).then(([rems, logs]) => {
      const activeRems = rems.filter(r => r.active)
      const todayDay = new Date().getDay()
      const todayDue = activeRems.filter(r => r.days && r.days.includes(todayDay))
      const logSet = new Set(logs.map(l => `${l.reminder_id}__${l.time_slot}`))
      const total = todayDue.reduce((s, r) => s + (r.times || []).length, 0)
      const taken = todayDue.reduce((s, r) => s + (r.times || []).filter(t => logSet.has(`${r.id}__${t}`)).length, 0)
      if (total > 0) setTrackerSummary({ total, taken, allDone: taken === total })
    }).catch(() => {})
    async function loadAlert() {
      const [today, , patterns] = await Promise.all([
        getTodayJournal(user.id),
        getJournalEntries(user.id, 30),
        analysePatterns(user.id),
      ])
      if (today && patterns) {
        const a = getPredictiveAlert(today, patterns)
        if (a) setAlert(a)
      }
    }
    loadAlert()
  }, [user])

  const recent = sessions.slice(0, 3)

  const navigateTo = (path) => {
    setDrawerOpen(false)
    nav(path)
  }

  return (
    <div className="h-full overflow-y-auto bg-midnight relative">

      {/* ── Side Drawer overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Side Drawer panel ── */}
      <div
        className="fixed top-0 left-0 h-full z-50 w-72 bg-charcoal border-r border-white/8 flex flex-col shadow-2xl transition-transform duration-300"
        style={{ transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        {/* Drawer header */}
        <div className="bg-gradient-to-b from-emerald-950/80 to-charcoal px-5 pt-12 pb-5 safe-top flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600/20 border border-emerald-600/30 rounded-xl flex items-center justify-center">
                <Heart size={16} className="text-emerald-500" />
              </div>
              <span className="font-display font-bold text-cream text-lg">More</span>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center active:scale-90 transition-all"
            >
              <X size={16} className="text-mist" />
            </button>
          </div>
          <p className="text-mist text-xs mt-1 ml-10">All SayMyDoc features</p>
        </div>

        {/* Drawer items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {DRAWER_ITEMS.map(({ to, icon: Icon, emoji, label_en, label_lg, sub_en, sub_lg, color, bg }) => {
            const label = lang === 'lg' ? label_lg : label_en
            const sub   = lang === 'lg' ? sub_lg   : sub_en
            return (
              <button
                key={to}
                onClick={() => navigateTo(to)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl active:scale-95 transition-all hover:bg-white/5"
              >
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <span className="text-lg">{emoji}</span>
                </div>
                <div className="text-left min-w-0">
                  <p className="text-cream text-sm font-semibold">{label}</p>
                  <p className="text-mist text-xs truncate">{sub}</p>
                </div>
                <ChevronRight size={14} className="text-mist/40 ml-auto flex-shrink-0" />
              </button>
            )
          })}
        </div>

        {/* Drawer footer */}
        <div className="px-5 py-4 border-t border-white/5 flex-shrink-0">
          <button
            onClick={() => navigateTo('/settings')}
            className="w-full flex items-center gap-3 text-mist text-sm active:opacity-70 transition-all"
          >
            <span className="text-base">⚙️</span>
            <span>{lang === 'lg' ? 'Entegeka' : 'Settings'}</span>
          </button>
        </div>
      </div>

      {/* ── Main content ── */}

      {/* Header */}
      <div className="bg-gradient-to-b from-charcoal to-midnight px-5 pt-10 pb-6 safe-top">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-mist text-sm font-medium">{greeting} 👋</p>
            <h1 className="font-display font-bold text-2xl text-cream mt-0.5">{user?.name || 'there'}</h1>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-11 h-11 rounded-2xl bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center active:scale-90 transition-all"
          >
            <Menu size={20} className="text-emerald-500" />
          </button>
        </div>

        {/* Alert */}
        {alert && (
          <div className={`mb-4 rounded-2xl p-3 border flex items-start gap-2 ${alert.level === 'warning' ? 'border-yellow-700/40 bg-yellow-950/30' : 'border-blue-700/40 bg-blue-950/30'}`}>
            <span className="text-lg flex-shrink-0">{alert.icon}</span>
            <div>
              <p className={`font-semibold text-xs mb-0.5 ${alert.level === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`}>{alert.title}</p>
              <p className="text-cream/70 text-xs leading-relaxed">{alert.message}</p>
            </div>
          </div>
        )}

        {/* Dual CTA */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => nav('/chat')}
            className="bg-emerald-600 rounded-2xl p-4 flex flex-col items-start shadow-btn active:scale-95 transition-all">
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center mb-2">
              <MessageCircle size={20} className="text-white" />
            </div>
            <p className="text-white/70 text-xs mb-0.5">{tr('home.symptom.label')}</p>
            <p className="text-white font-display font-bold text-sm leading-tight">{tr('home.symptom.desc')}</p>
          </button>
          <button onClick={() => nav('/companion')}
            className="bg-gradient-to-br from-purple-700 to-purple-900 rounded-2xl p-4 flex flex-col items-start active:scale-95 transition-all">
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center mb-2">
              <Sparkles size={20} className="text-white" />
            </div>
            <p className="text-white/70 text-xs mb-0.5">{tr('home.companion.label')}</p>
            <p className="text-white font-display font-bold text-sm leading-tight">{tr('home.companion.desc')}</p>
          </button>
        </div>
      </div>

      <div className="px-5 pb-24 space-y-5">

        {/* Medication Tracker Banner */}
        {trackerSummary && (
          <button onClick={() => nav('/tracker')}
            className={`w-full rounded-2xl p-4 flex items-center gap-3 active:scale-98 transition-all border ${
              trackerSummary.allDone
                ? 'bg-emerald-950/50 border-emerald-700/40'
                : 'bg-red-950/30 border-red-800/30'
            }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              trackerSummary.allDone ? 'bg-emerald-600/20' : 'bg-red-900/30'
            }`}>
              {trackerSummary.allDone
                ? <CheckCircle size={20} className="text-emerald-400" />
                : <Pill size={20} className="text-red-400" />
              }
            </div>
            <div className="flex-1 text-left">
              <p className={`font-semibold text-sm ${trackerSummary.allDone ? 'text-emerald-300' : 'text-red-300'}`}>
                {trackerSummary.allDone ? 'All doses taken today ✓' : `${trackerSummary.taken}/${trackerSummary.total} doses taken today`}
              </p>
              <p className={`text-xs ${trackerSummary.allDone ? 'text-emerald-400/60' : 'text-red-400/70'}`}>
                {trackerSummary.allDone ? 'Your streak continues — keep it up!' : 'Tap to log your remaining doses'}
              </p>
            </div>
            <ChevronRight size={16} className={trackerSummary.allDone ? 'text-emerald-500' : 'text-red-400'} />
          </button>
        )}

        {/* Feature grid — 4 core cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-cream">Quick Access</h2>
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-emerald-500 text-sm font-medium flex items-center gap-1"
            >
              More <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/firstaid', icon: '🩹', label: 'First Aid',   sub: '11 emergencies',          color: 'text-red-400',     bg: 'bg-red-500/15'     },
              { to: '/bodymap',  icon: '🗺️', label: tr('bodymap.title'), sub: 'Tap where it hurts', color: 'text-purple-400',  bg: 'bg-purple-500/15'  },
              { to: '/tracker',  icon: '💊', label: 'Med Tracker', sub: 'Streak & reminders',       color: 'text-red-400',     bg: 'bg-red-500/15'     },
              { to: '/clinics',  icon: '📍', label: 'Find Clinic', sub: 'Nearest to you · offline', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
            ].map(({ to, icon, label, sub, color, bg }) => (
              <button key={to} onClick={() => nav(to)}
                className="bg-charcoal rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-all">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <span className="text-lg">{icon}</span>
                </div>
                <div className="text-left min-w-0">
                  <p className="text-cream text-sm font-semibold">{label}</p>
                  <p className="text-mist text-xs truncate">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Daily Tip */}
        <div className="bg-emerald-950/50 border border-emerald-800/30 rounded-3xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-emerald-500" />
              <p className="label-text">{tr('home.tip.label')}</p>
            </div>
            <MessageAudioBtn text={tip} />
          </div>
          <p className="text-cream text-sm leading-relaxed">{tip}</p>
        </div>

        {/* Recent Sessions */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-lg text-cream">{tr('home.recent')}</h2>
              <button onClick={() => nav('/history')} className="text-emerald-500 text-sm font-medium">{tr('home.see.all')}</button>
            </div>
            <div className="space-y-2">
              {recent.map((s, i) => {
                const cond = CONDITIONS[s.primary_condition]
                const cat = cond?.category || 'general'
                const color = CAT_COLORS[cat] || '#00A86B'
                const icon = CAT_ICONS[cat] || '🩺'
                const dateStr = new Date(s.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                return (
                  <button key={i} onClick={() => nav('/history')}
                    className="w-full bg-charcoal rounded-2xl p-4 flex items-center gap-3 active:scale-98 transition-all">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '22' }}>
                      <span>{icon}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-cream text-sm font-semibold">{cond?.name || 'Health Check'}</p>
                      <p className="text-mist text-xs">{dateStr} • {s.confidence || 0}% confidence</p>
                    </div>
                    <ChevronRight size={16} className="text-mist" />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Library preview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-cream">{tr('library.title')}</h2>
            <button onClick={() => nav('/library')} className="text-emerald-500 text-sm font-medium">All {Object.keys(CONDITIONS).length}</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CONDITIONS).slice(0, 6).map(([key, cond]) => {
              const color = CAT_COLORS[cond.category] || '#00A86B'
              const icon = CAT_ICONS[cond.category] || '🩺'
              return (
                <button key={key} onClick={() => nav(`/condition/${key}`)}
                  className="bg-charcoal rounded-2xl p-3 flex items-center gap-2 active:scale-95 transition-all text-left">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '22' }}>
                    <span className="text-base">{icon}</span>
                  </div>
                  <p className="text-cream text-xs font-semibold leading-tight">{cond.name}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Emergency Banner */}
        <div className="bg-red-950/40 border border-red-800/30 rounded-3xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 text-sm font-semibold mb-1">In a Medical Emergency?</p>
            <p className="text-red-300/70 text-xs leading-relaxed mb-2">Sudden severe headache, chest pain, difficulty breathing, one-sided weakness, or confusion — go to hospital immediately. Use our First Aid guide while travelling.</p>
            <button onClick={() => nav('/firstaid')} className="bg-red-700/50 border border-red-600/30 text-red-200 text-xs font-semibold px-3 py-1.5 rounded-xl active:scale-95 transition-all">
              Open First Aid Guide →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
