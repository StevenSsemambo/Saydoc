import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext.jsx'
import {
  ChevronLeft, Calculator, Droplets, Baby, Utensils,
  ChevronRight, RotateCcw, Info, CheckCircle, Plus, Minus
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)) }

// ── Tool hub card ─────────────────────────────────────────────
function ToolCard({ icon, label, sub, color, bgColor, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all active:scale-95 w-full text-left
        ${active
          ? `border-${color}/50 bg-${bgColor}`
          : 'border-white/8 bg-charcoal'}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? `bg-${bgColor}` : 'bg-midnight'}`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${active ? `text-${color}` : 'text-cream'}`}>{label}</p>
        <p className="text-mist text-xs mt-0.5 leading-tight">{sub}</p>
      </div>
      <ChevronRight size={14} className="text-mist/40 flex-shrink-0" />
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
// TOOL 1 — BMI Calculator
// ═══════════════════════════════════════════════════════════════
function BMICalculator({ lang }) {
  const [unit, setUnit] = useState('metric')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [result, setResult] = useState(null)

  const calculate = () => {
    let h, w
    if (unit === 'metric') {
      h = parseFloat(height) / 100
      w = parseFloat(weight)
    } else {
      const totalIn = (parseFloat(heightFt) || 0) * 12 + (parseFloat(heightIn) || 0)
      h = totalIn * 0.0254
      w = parseFloat(weight) * 0.453592
    }
    if (!h || !w || h <= 0 || w <= 0) return
    const bmi = w / (h * h)
    setResult(bmi)
  }

  const reset = () => {
    setHeight(''); setWeight(''); setHeightFt(''); setHeightIn(''); setResult(null)
  }

  const getBMIInfo = (bmi) => {
    if (bmi < 18.5) return {
      label: lang === 'lg' ? 'Obungi Buteebwa' : 'Underweight',
      color: 'text-blue-400', bar: 'bg-blue-500', pct: Math.round((bmi / 40) * 100),
      advice: lang === 'lg'
        ? 'Omubiri gwo mulungi okusingayo. Lya ebyokulya ebirina amaanyi: amagi, bunyebwa, groundnut, avocado, n\'amazzi ga mabeere. Keba omusawo singa obungi bunafuuka.'
        : 'Your weight is below the healthy range. Focus on nutrient-dense foods: eggs, beans, groundnuts, avocado, and milk. See a doctor if weight loss is unintentional.',
      emoji: '💙'
    }
    if (bmi < 25) return {
      label: lang === 'lg' ? 'Obulamu Obulungi' : 'Healthy Weight',
      color: 'text-emerald-400', bar: 'bg-emerald-500', pct: Math.round(((bmi - 18.5) / 21.5) * 100),
      advice: lang === 'lg'
        ? 'Weebale! Obungi bwo bulungi ennyo. Endeera ne endagiriro nziza: lya mmere ezimu buli lunaku, nywa amazzi mangi, era tambula eddakiika 30 buli lunaku.'
        : 'Excellent! Your BMI is in the healthy range. Maintain this with balanced meals, 8+ glasses of water daily, and 30 minutes of activity.',
      emoji: '✅'
    }
    if (bmi < 30) return {
      label: lang === 'lg' ? 'Obungi Obukira Ebbeeyi' : 'Overweight',
      color: 'text-yellow-400', bar: 'bg-yellow-500', pct: Math.round(((bmi - 25) / 15) * 100),
      advice: lang === 'lg'
        ? 'Omubiri gwo mulungi okusingayo. Gabanya ebyokulya ebirina sukaali n\'emienda. Tambula eddakiika 30–45 buli lunaku. Keba pressure y\'omusaayi gwo buli mwaka.'
        : 'Slightly above healthy range. Reduce sugary drinks and fried foods. Walk 30–45 minutes daily. Check blood pressure annually — risk begins in this range.',
      emoji: '⚠️'
    }
    if (bmi < 35) return {
      label: lang === 'lg' ? 'Obungi Obungi Ennyo (I)' : 'Obese (Class I)',
      color: 'text-orange-400', bar: 'bg-orange-500', pct: 80,
      advice: lang === 'lg'
        ? 'Obungi bwo buteesezza omusujja, pressure, ne diabetes. Genda ku omusawo okusaba endagiriro ey\'okulya n\'okukolera. Tandika ne kutambula eddakiika 20 buli lunaku.'
        : 'Increased risk of diabetes, hypertension, and heart disease. Consult a healthcare provider for a structured plan. Start with 20-minute daily walks and reducing posho/white rice portions.',
      emoji: '🔶'
    }
    return {
      label: lang === 'lg' ? 'Obungi Obungi Ennyo (II+)' : 'Obese (Class II+)',
      color: 'text-red-400', bar: 'bg-red-500', pct: 95,
      advice: lang === 'lg'
        ? 'Genda ku omusawo mangu. Obungi buno buteesezza obulwadde obw\'omutima, diabetes, ne HIV. Obuyambi bw\'omusawo buweebwa buteerevu mu Uganda.'
        : 'Please see a doctor. This level significantly increases risk of heart disease, stroke, diabetes, and joint problems. Medical weight management support is available at Uganda health facilities.',
      emoji: '🚨'
    }
  }

  const info = result ? getBMIInfo(result) : null

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Unit toggle */}
      <div className="flex gap-2 bg-midnight rounded-2xl p-1">
        {['metric', 'imperial'].map(u => (
          <button key={u} onClick={() => { setUnit(u); reset() }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${unit === u ? 'bg-emerald-600 text-white' : 'text-mist'}`}>
            {u === 'metric'
              ? (lang === 'lg' ? 'Metric (kg/cm)' : 'Metric (kg/cm)')
              : (lang === 'lg' ? 'Imperial (lbs/ft)' : 'Imperial (lbs/ft)')}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        {unit === 'metric' ? (
          <>
            <div>
              <label className="label-text block mb-1.5">{lang === 'lg' ? 'OBUWANVU (cm)' : 'HEIGHT (cm)'}</label>
              <input className="input-field" type="number" placeholder="e.g. 168"
                value={height} onChange={e => setHeight(e.target.value)} />
            </div>
            <div>
              <label className="label-text block mb-1.5">{lang === 'lg' ? 'OBUNGI (kg)' : 'WEIGHT (kg)'}</label>
              <input className="input-field" type="number" placeholder="e.g. 65"
                value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="label-text block mb-1.5">HEIGHT</label>
              <div className="grid grid-cols-2 gap-2">
                <input className="input-field" type="number" placeholder="ft"
                  value={heightFt} onChange={e => setHeightFt(e.target.value)} />
                <input className="input-field" type="number" placeholder="in"
                  value={heightIn} onChange={e => setHeightIn(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label-text block mb-1.5">WEIGHT (lbs)</label>
              <input className="input-field" type="number" placeholder="e.g. 143"
                value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
          </>
        )}
      </div>

      <button onClick={calculate} className="btn-primary w-full">
        {lang === 'lg' ? 'Bala BMI' : 'Calculate BMI'}
      </button>

      {/* Result */}
      {result && info && (
        <div className="bg-midnight rounded-3xl p-5 animate-slide-up border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="label-text">{lang === 'lg' ? 'BMI YO' : 'YOUR BMI'}</p>
              <p className={`font-display font-bold text-4xl mt-1 ${info.color}`}>
                {result.toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <span className="text-4xl">{info.emoji}</span>
              <p className={`text-xs font-semibold mt-1 ${info.color}`}>{info.label}</p>
            </div>
          </div>

          {/* BMI scale bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-mist/60 mb-1">
              <span>16</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/10 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-[15%] bg-blue-500/60 rounded-l-full" />
              <div className="absolute inset-y-0 left-[15%] w-[27%] bg-emerald-500/60" />
              <div className="absolute inset-y-0 left-[42%] w-[18%] bg-yellow-500/60" />
              <div className="absolute inset-y-0 left-[60%] w-[15%] bg-orange-500/60" />
              <div className="absolute inset-y-0 left-[75%] right-0 bg-red-500/60 rounded-r-full" />
              {/* Cursor */}
              <div className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white ${info.bar}`}
                style={{ left: `${clamp(((result - 16) / 24) * 100, 2, 98)}%` }} />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-blue-400">{lang === 'lg' ? 'Tebwa' : 'Under'}</span>
              <span className="text-emerald-400">{lang === 'lg' ? 'Bulungi' : 'Healthy'}</span>
              <span className="text-yellow-400">{lang === 'lg' ? 'Singayo' : 'Over'}</span>
              <span className="text-red-400">{lang === 'lg' ? 'Bungi' : 'Obese'}</span>
            </div>
          </div>

          <div className="bg-charcoal rounded-2xl p-3">
            <p className="text-cream/85 text-xs leading-relaxed">{info.advice}</p>
          </div>

          <button onClick={reset} className="w-full mt-3 flex items-center justify-center gap-2 text-mist text-xs py-2 active:opacity-70">
            <RotateCcw size={12} /> {lang === 'lg' ? 'Tandika Denuo' : 'Reset'}
          </button>
        </div>
      )}

      <div className="bg-charcoal/50 rounded-2xl p-3 flex gap-2">
        <Info size={13} className="text-mist/50 flex-shrink-0 mt-0.5" />
        <p className="text-mist/60 text-xs leading-relaxed">
          {lang === 'lg'
            ? 'BMI bw\'okutegeera. Tekikuumirwa okukoleza omubiri gwa muscles oba abakazi abeembuto.'
            : 'BMI is a screening tool, not a diagnosis. It may not accurately reflect health in very muscular individuals or during pregnancy.'}
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TOOL 2 — Hydration Tracker
// ═══════════════════════════════════════════════════════════════
const WATER_KEY = 'saymydoc_water_' + new Date().toISOString().split('T')[0]

function HydrationTracker({ lang }) {
  const [glasses, setGlasses] = useState(() => {
    try { return parseInt(localStorage.getItem(WATER_KEY) || '0') } catch { return 0 }
  })
  const [goal, setGoal] = useState(8)

  const update = (n) => {
    const v = clamp(n, 0, 20)
    setGlasses(v)
    try { localStorage.setItem(WATER_KEY, String(v)) } catch { /* best-effort: failure is fine */ }
  }

  const pct = Math.min(100, Math.round((glasses / goal) * 100))
  const status = pct >= 100 ? 'done' : pct >= 60 ? 'good' : pct >= 30 ? 'low' : 'very-low'
  const statusInfo = {
    done:     { label: lang === 'lg' ? 'Ogobereddwa!' : 'Goal reached!', color: 'text-emerald-400', emoji: '🎉' },
    good:     { label: lang === 'lg' ? 'Oli ku Nzira!' : 'On track!',    color: 'text-blue-400',    emoji: '💧' },
    low:      { label: lang === 'lg' ? 'Nywa Mangi' : 'Drink more',      color: 'text-yellow-400',  emoji: '⚠️' },
    'very-low': { label: lang === 'lg' ? 'Obunafu bw\'Amazzi' : 'Dehydrated', color: 'text-red-400', emoji: '🔴' },
  }[status]

  const tips = lang === 'lg' ? [
    'Nywa ikopo limmu nga bwe ozuukuka ku makya',
    'Wa amazzi ku meza ne mu kopo ng\'ombeeredde',
    'Nywa nga bwe ogenda ku buwumbi',
    'Singa omyojo gulaba nga gabalala — nywa amazzi mangi',
  ] : [
    'Drink one glass immediately on waking up',
    'Keep a water bottle on your desk or nearby',
    'Drink a glass before every meal',
    'Dark yellow urine means you need more water',
  ]

  const glasses_grid = Array.from({ length: goal }, (_, i) => i < glasses)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Goal selector */}
      <div className="bg-charcoal rounded-3xl p-4">
        <p className="label-text mb-3">{lang === 'lg' ? 'EKIGENDERERWA KYO (EBIKOPO)' : 'DAILY GOAL (GLASSES)'}</p>
        <div className="flex items-center justify-between">
          <button onClick={() => setGoal(g => clamp(g - 1, 4, 16))}
            className="w-10 h-10 rounded-xl bg-midnight flex items-center justify-center active:scale-90">
            <Minus size={16} className="text-mist" />
          </button>
          <div className="text-center">
            <p className="font-display font-bold text-3xl text-cream">{goal}</p>
            <p className="text-mist text-xs">{lang === 'lg' ? 'ebikopo (~250ml)' : 'glasses (~250ml)'}</p>
          </div>
          <button onClick={() => setGoal(g => clamp(g + 1, 4, 16))}
            className="w-10 h-10 rounded-xl bg-midnight flex items-center justify-center active:scale-90">
            <Plus size={16} className="text-mist" />
          </button>
        </div>
      </div>

      {/* Progress display */}
      <div className="bg-charcoal rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="label-text">{lang === 'lg' ? 'LEERO' : 'TODAY'}</p>
            <p className="font-display font-bold text-4xl text-cream mt-1">
              {glasses}<span className="text-mist text-lg font-normal">/{goal}</span>
            </p>
          </div>
          <div className="text-center">
            <span className="text-4xl">{statusInfo.emoji}</span>
            <p className={`text-xs font-semibold mt-1 ${statusInfo.color}`}>{statusInfo.label}</p>
          </div>
        </div>

        {/* Visual glasses grid */}
        <div className="grid grid-cols-8 gap-1.5 mb-4">
          {glasses_grid.map((filled, i) => (
            <button key={i} onClick={() => update(filled ? i : i + 1)}
              className={`h-8 rounded-lg transition-all active:scale-90 flex items-end justify-center pb-1
                ${filled ? 'bg-blue-500/80' : 'bg-midnight border border-white/10'}`}>
              <span className="text-[9px]">{filled ? '💧' : ''}</span>
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-midnight rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }} />
        </div>
        <p className="text-right text-mist text-xs mt-1">{pct}%</p>
      </div>

      {/* Add / Remove buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => update(glasses + 1)}
          className="bg-blue-600 rounded-2xl py-3.5 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-btn">
          <Plus size={18} className="text-white" />
          <span className="text-white font-semibold text-sm">
            {lang === 'lg' ? 'Yongera Ekikopo' : 'Add Glass'}
          </span>
        </button>
        <button onClick={() => update(glasses - 1)}
          className="bg-midnight border border-white/10 rounded-2xl py-3.5 flex items-center justify-center gap-2 active:scale-95 transition-all">
          <Minus size={18} className="text-mist" />
          <span className="text-mist font-semibold text-sm">
            {lang === 'lg' ? 'Gyamu' : 'Remove'}
          </span>
        </button>
      </div>

      {/* Tips */}
      <div className="bg-charcoal rounded-3xl p-4">
        <p className="label-text mb-3">{lang === 'lg' ? 'AMAKUBO' : 'HYDRATION TIPS'}</p>
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
              <p className="text-mist text-xs leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-950/30 border border-blue-800/20 rounded-2xl p-3">
        <p className="text-blue-300 text-xs leading-relaxed">
          {lang === 'lg'
            ? '🇺🇬 Mu Uganda\'s omusana, omubiri gwo agya amazzi mangi okusingayo. Abakozi abakolera ebweru bagya ebikopo 10–12 buli lunaku.'
            : "🇺🇬 In Uganda's heat, you need more than the standard 8 glasses. People working outdoors or in hot conditions need 10–12 glasses daily."}
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TOOL 3 — Due Date Calculator
// ═══════════════════════════════════════════════════════════════
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_LG = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function DueDateCalculator({ lang }) {
  const [mode, setMode] = useState('lmp') // lmp | conception | ultrasound
  const [date, setDate] = useState('')
  const [weeks, setWeeks] = useState('')
  const [result, setResult] = useState(null)

  const calculate = () => {
    if (!date) return
    const d = new Date(date)
    if (isNaN(d)) return

    let conception, edd
    if (mode === 'lmp') {
      conception = new Date(d.getTime() + 14 * 86400000)
      edd = new Date(d.getTime() + 280 * 86400000)
    } else if (mode === 'conception') {
      conception = d
      edd = new Date(d.getTime() + 266 * 86400000)
    } else {
      const w = parseInt(weeks) || 0
      const daysPregnant = w * 7
      const lmp = new Date(d.getTime() - daysPregnant * 86400000 - 14 * 86400000)
      edd = new Date(lmp.getTime() + 280 * 86400000)
      conception = new Date(lmp.getTime() + 14 * 86400000)
    }

    const today = new Date()
    const daysPreg = Math.floor((today - conception) / 86400000)
    const currentWeek = Math.max(0, Math.floor(daysPreg / 7) + 2)
    const daysLeft = Math.ceil((edd - today) / 86400000)
    const trimester = currentWeek <= 12 ? 1 : currentWeek <= 27 ? 2 : 3

    const milestones = [
      { week: 8,  en: 'All major organs forming', lg: 'Emizira gyona egitandika okutondebwa' },
      { week: 12, en: 'End of 1st trimester — risk drops significantly', lg: 'Nkomerero y\'olugendo lwa 1 — obusoba bwagwa ennyo' },
      { week: 16, en: 'Baby can make facial expressions', lg: 'Omwana asobola okwoleka ebimu ku maaso' },
      { week: 20, en: 'Anatomy scan (fetal anomaly ultrasound)', lg: 'Ultrasound y\'omubiri gw\'omwana' },
      { week: 24, en: 'Viability milestone — baby can survive if born', lg: 'Omwana asobola okuzaaliwa n\'okufuga' },
      { week: 28, en: 'Start of 3rd trimester', lg: 'Entandika y\'olugendo lwa 3' },
      { week: 32, en: 'Baby is head-down (ideally)', lg: 'Omutwe gw\'omwana guwungedde wansi (ng\'ekibeera' },
      { week: 36, en: 'Considered term — lungs nearly mature', lg: 'Amawafu g\'omwana gamala okumala' },
      { week: 40, en: 'Due date 🎉', lg: 'Olunaku lw\'okumaliririza 🎉' },
    ]

    setResult({ edd, conception, currentWeek: clamp(currentWeek, 0, 42), daysLeft, trimester, milestones })
  }

  const fmt = (d) => {
    const m = MONTHS_EN[d.getMonth()]
    return `${d.getDate()} ${m} ${d.getFullYear()}`
  }

  const trim_label = lang === 'lg'
    ? ['', 'Olugendo lwa 1 (wiiki 1–12)', 'Olugendo lwa 2 (wiiki 13–27)', 'Olugendo lwa 3 (wiiki 28–40)']
    : ['', '1st Trimester (weeks 1–12)', '2nd Trimester (weeks 13–27)', '3rd Trimester (weeks 28–40)']

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Mode tabs */}
      <div className="flex gap-1 bg-midnight rounded-2xl p-1">
        {[
          { id: 'lmp', label: lang === 'lg' ? 'LMP' : 'Last Period' },
          { id: 'conception', label: lang === 'lg' ? 'Olunaku' : 'Conception' },
          { id: 'ultrasound', label: 'Ultrasound' },
        ].map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setResult(null) }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${mode === m.id ? 'bg-pink-600 text-white' : 'text-mist'}`}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="space-y-3">
        <div>
          <label className="label-text block mb-1.5">
            {mode === 'lmp'
              ? (lang === 'lg' ? 'OLUNAKU LW\'EMPINDI EYA NKOMERERO' : 'FIRST DAY OF LAST PERIOD')
              : mode === 'conception'
              ? (lang === 'lg' ? 'OLUNAKU LW\'OKUZAALA' : 'ESTIMATED CONCEPTION DATE')
              : (lang === 'lg' ? 'OLUNAKU LW\'ULTRASOUND' : 'DATE OF ULTRASOUND')}
          </label>
          <input type="date" className="input-field"
            value={date} onChange={e => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]} />
        </div>
        {mode === 'ultrasound' && (
          <div>
            <label className="label-text block mb-1.5">
              {lang === 'lg' ? 'WIIKI EZALI KU ULTRASOUND' : 'GESTATIONAL WEEKS AT ULTRASOUND'}
            </label>
            <input type="number" className="input-field" placeholder="e.g. 12"
              min="4" max="42" value={weeks} onChange={e => setWeeks(e.target.value)} />
          </div>
        )}
      </div>

      <button onClick={calculate} className="w-full py-3 rounded-2xl bg-pink-600 text-white font-semibold text-sm active:scale-95 transition-all">
        {lang === 'lg' ? 'Bala Olunaku' : 'Calculate Due Date'}
      </button>

      {/* Result */}
      {result && (
        <div className="space-y-3 animate-slide-up">
          {/* EDD card */}
          <div className="bg-pink-950/40 border border-pink-700/30 rounded-3xl p-5">
            <p className="label-text text-pink-400/80 mb-1">
              {lang === 'lg' ? 'OLUNAKU LW\'OKUZAALA' : 'ESTIMATED DUE DATE'}
            </p>
            <p className="font-display font-bold text-2xl text-pink-300">{fmt(result.edd)}</p>
            {result.daysLeft > 0
              ? <p className="text-pink-200/70 text-sm mt-1">
                  {result.daysLeft} {lang === 'lg' ? 'ennaku ezisigadde' : 'days to go'}
                </p>
              : <p className="text-pink-200/70 text-sm mt-1">
                  {lang === 'lg' ? 'Olunaku lw\'okuzaala lwavaako!' : 'Due date has passed!'}
                </p>
            }
          </div>

          {/* Current status */}
          <div className="bg-charcoal rounded-3xl p-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: lang === 'lg' ? 'Wiiki' : 'Week', value: result.currentWeek > 0 ? result.currentWeek : '—' },
                { label: lang === 'lg' ? 'Olugendo' : 'Trimester', value: result.currentWeek > 0 ? result.trimester : '—' },
                { label: lang === 'lg' ? 'Ennaku' : 'Days left', value: result.daysLeft > 0 ? result.daysLeft : '—' },
              ].map(s => (
                <div key={s.label} className="bg-midnight rounded-2xl p-3 text-center">
                  <p className="font-display font-bold text-xl text-cream">{s.value}</p>
                  <p className="text-mist text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Trimester bar */}
            {result.currentWeek > 0 && (
              <>
                <p className="text-xs text-pink-300 font-semibold mb-2">{trim_label[result.trimester]}</p>
                <div className="h-2 bg-midnight rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-gradient-to-r from-pink-700 to-pink-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (result.currentWeek / 40) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-mist/50">
                  <span>{lang === 'lg' ? 'Wiiki 1' : 'Week 1'}</span>
                  <span>12</span><span>27</span>
                  <span>{lang === 'lg' ? 'Wiiki 40' : 'Week 40'}</span>
                </div>
              </>
            )}
          </div>

          {/* Milestones */}
          <div className="bg-charcoal rounded-3xl p-4">
            <p className="label-text mb-3">{lang === 'lg' ? 'EBIMU EBY\'ENJAWULO' : 'KEY MILESTONES'}</p>
            <div className="space-y-2.5">
              {result.milestones.map(m => {
                const past = result.currentWeek > m.week
                const current = result.currentWeek === m.week
                return (
                  <div key={m.week} className={`flex gap-3 items-start ${past ? 'opacity-50' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold
                      ${current ? 'bg-pink-600 text-white' : past ? 'bg-emerald-700/30 text-emerald-500' : 'bg-midnight text-mist'}`}>
                      {past ? '✓' : m.week}
                    </div>
                    <div>
                      <p className="text-mist text-xs mb-0.5">{lang === 'lg' ? `Wiiki ${m.week}` : `Week ${m.week}`}</p>
                      <p className={`text-xs leading-relaxed ${current ? 'text-pink-300 font-semibold' : 'text-cream/80'}`}>
                        {lang === 'lg' ? m.lg : m.en}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Uganda ANC schedule */}
          <div className="bg-pink-950/30 border border-pink-700/20 rounded-2xl p-3">
            <p className="text-pink-400 text-xs font-semibold mb-2">
              🇺🇬 {lang === 'lg' ? 'Endagiriro y\'ANC mu Uganda' : 'Uganda ANC Schedule'}
            </p>
            <p className="text-pink-200/70 text-xs leading-relaxed">
              {lang === 'lg'
                ? 'Genda ku nnyumba y\'obulamu omulundi gumu buli myezi 1 okutuuka wiiki 28, era omulundi gumu buli wiiki 2 okutuuka ku nkomerero. Enkingo ez\'omusujja (IPTp) eweebwa buteerevu.'
                : 'Visit a health facility monthly until week 28, then every 2 weeks until delivery. Malaria prevention (IPTp) and iron/folic acid supplements are provided free at all Uganda health centres.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TOOL 4 — Calorie Estimator (Uganda foods)
// ═══════════════════════════════════════════════════════════════
const UGANDA_FOODS = [
  { name: 'Posho (maize meal)', name_lg: 'Posho', cal: 362, per: '100g', cat: 'staple' },
  { name: 'Matooke (cooked)', name_lg: 'Matooke', cal: 89, per: '100g', cat: 'staple' },
  { name: 'Sweet potato', name_lg: 'Lumonde', cal: 86, per: '100g', cat: 'staple' },
  { name: 'Cassava (boiled)', name_lg: 'Muwogo', cal: 116, per: '100g', cat: 'staple' },
  { name: 'Rice (cooked)', name_lg: 'Mule', cal: 130, per: '100g', cat: 'staple' },
  { name: 'Beans (cooked)', name_lg: 'Buganda beans', cal: 127, per: '100g', cat: 'protein' },
  { name: 'Groundnuts', name_lg: 'Ebinyebwa', cal: 567, per: '100g', cat: 'protein' },
  { name: 'Egg (1 whole)', name_lg: 'Limuli (1)', cal: 78, per: 'each', cat: 'protein' },
  { name: 'Mukene (fried)', name_lg: 'Mukene', cal: 350, per: '100g', cat: 'protein' },
  { name: 'Beef (lean, cooked)', name_lg: 'Enyama', cal: 215, per: '100g', cat: 'protein' },
  { name: 'Chicken (cooked)', name_lg: 'Enkoko', cal: 165, per: '100g', cat: 'protein' },
  { name: 'Milk (whole, 250ml)', name_lg: 'Amata', cal: 149, per: '250ml', cat: 'dairy' },
  { name: 'Avocado (half)', name_lg: 'Avocado (kimwe)', cal: 120, per: 'half', cat: 'fat' },
  { name: 'Banana (ripe)', name_lg: 'Menvu (limwe)', cal: 89, per: 'each', cat: 'fruit' },
  { name: 'Moringa leaves (100g)', name_lg: 'Omuzinga', cal: 64, per: '100g', cat: 'veg' },
  { name: 'Spinach/greens (100g)', name_lg: 'Doodo', cal: 23, per: '100g', cat: 'veg' },
  { name: 'Cabbage (100g)', name_lg: 'Kabeeji', cal: 25, per: '100g', cat: 'veg' },
  { name: 'Soda (330ml can)', name_lg: 'Ssoda', cal: 139, per: '330ml', cat: 'drink' },
  { name: 'Chapati (1 piece)', name_lg: 'Chapati (limwe)', cal: 230, per: 'each', cat: 'staple' },
  { name: 'Mandazi (1 piece)', name_lg: 'Mandazi (limwe)', cal: 190, per: 'each', cat: 'snack' },
]

const CAT_COLORS = { staple:'bg-amber-500/20 text-amber-400', protein:'bg-red-500/20 text-red-400', dairy:'bg-blue-500/20 text-blue-400', fat:'bg-green-500/20 text-green-400', fruit:'bg-yellow-500/20 text-yellow-400', veg:'bg-emerald-500/20 text-emerald-400', drink:'bg-purple-500/20 text-purple-400', snack:'bg-pink-500/20 text-pink-400' }

function CalorieEstimator({ lang }) {
  const [selected, setSelected] = useState([])  // [{food, qty}]
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const toggle = (food) => {
    setSelected(prev => {
      const exists = prev.find(s => s.food.name === food.name)
      if (exists) return prev.filter(s => s.food.name !== food.name)
      return [...prev, { food, qty: 1 }]
    })
  }

  const updateQty = (foodName, delta) => {
    setSelected(prev => prev.map(s =>
      s.food.name === foodName
        ? { ...s, qty: clamp(s.qty + delta, 0.5, 10) }
        : s
    ).filter(s => s.qty > 0))
  }

  const totalCal = selected.reduce((sum, s) => sum + (s.food.cal * s.qty), 0)

  const categories = ['all', 'staple', 'protein', 'dairy', 'fat', 'fruit', 'veg', 'drink', 'snack']
  const cat_labels = { all: lang === 'lg' ? 'Byona' : 'All', staple: lang === 'lg' ? 'Emmere' : 'Staples', protein: lang === 'lg' ? 'Protein' : 'Protein', dairy: lang === 'lg' ? 'Amata' : 'Dairy', fat: lang === 'lg' ? 'Mafuta' : 'Fats', fruit: lang === 'lg' ? 'Ebibala' : 'Fruits', veg: lang === 'lg' ? 'Enva' : 'Veggies', drink: lang === 'lg' ? 'Ekinywi' : 'Drinks', snack: lang === 'lg' ? 'Ekyokulya' : 'Snacks' }

  const filtered = UGANDA_FOODS.filter(f => {
    const matchCat = filter === 'all' || f.cat === filter
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.name_lg.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const getDailyGuide = () => {
    if (totalCal < 1200) return { label: lang === 'lg' ? 'Tono ennyo' : 'Too low', color: 'text-blue-400', msg: lang === 'lg' ? 'Omubiri gwo wagya ebyokulya ebingi okusingayo.' : 'Your body needs significantly more calories to function.' }
    if (totalCal < 1800) return { label: lang === 'lg' ? 'Tono' : 'Below target', color: 'text-yellow-400', msg: lang === 'lg' ? 'Yongera ebyokulya ebirina protein n\'amaanyi.' : 'Add more protein and energy-dense foods to your meals.' }
    if (totalCal < 2500) return { label: lang === 'lg' ? 'Bulungi' : 'Healthy range', color: 'text-emerald-400', msg: lang === 'lg' ? 'Weebale! Ebyokulya byo biri mu bbeeyi ey\'obulamu.' : 'Good balance. Maintain variety and eat vegetables with every meal.' }
    if (totalCal < 3200) return { label: lang === 'lg' ? 'Bwangu' : 'High', color: 'text-orange-400', msg: lang === 'lg' ? 'Okusinga ebyokulya kuno kwongera obungi. Gabanya ebyokulya ebinena sukaali.' : 'This level may lead to weight gain over time. Reduce sugary drinks and fried snacks.' }
    return { label: lang === 'lg' ? 'Bunene ennyo' : 'Very high', color: 'text-red-400', msg: lang === 'lg' ? 'Ebyokulya bingi ennyo. Gabanya emmere n\'ekinywi ebirina sukaali.' : 'Very high intake. Consider portion control and reducing sodas and fried foods.' }
  }
  const guide = getDailyGuide()

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search */}
      <input className="input-field" placeholder={lang === 'lg' ? 'Noonya emmere...' : 'Search food...'}
        value={search} onChange={e => setSearch(e.target.value)} />

      {/* Category filter scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
              ${filter === c ? 'bg-emerald-600 text-white' : 'bg-charcoal text-mist'}`}>
            {cat_labels[c]}
          </button>
        ))}
      </div>

      {/* Food list */}
      <div className="space-y-2">
        {filtered.map(food => {
          const sel = selected.find(s => s.food.name === food.name)
          return (
            <div key={food.name}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all
                ${sel ? 'border-emerald-600/40 bg-emerald-950/20' : 'border-white/5 bg-charcoal'}`}>
              <button onClick={() => toggle(food)}
                className={`w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all
                  ${sel ? 'bg-emerald-600 border-emerald-600' : 'border-white/20'}`}>
                {sel && <CheckCircle size={12} className="text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-cream text-sm font-medium truncate">
                  {lang === 'lg' ? food.name_lg : food.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-md ${CAT_COLORS[food.cat] || ''}`}>
                    {food.cat}
                  </span>
                  <span className="text-mist text-xs">{food.cal} kcal / {food.per}</span>
                </div>
              </div>
              {sel && (
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(food.name, -0.5)}
                    className="w-6 h-6 rounded-lg bg-midnight flex items-center justify-center active:scale-90">
                    <Minus size={10} className="text-mist" />
                  </button>
                  <span className="text-cream text-xs font-bold w-5 text-center">{sel.qty}</span>
                  <button onClick={() => updateQty(food.name, 0.5)}
                    className="w-6 h-6 rounded-lg bg-midnight flex items-center justify-center active:scale-90">
                    <Plus size={10} className="text-mist" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Total */}
      {selected.length > 0 && (
        <div className="sticky bottom-2 bg-charcoal border border-white/10 rounded-3xl p-4 shadow-card animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="label-text">{lang === 'lg' ? 'AMAANYI AYONA (KCAL)' : 'TOTAL CALORIES'}</p>
              <p className={`font-display font-bold text-3xl mt-0.5 ${guide.color}`}>
                {Math.round(totalCal).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${guide.color}`}>{guide.label}</p>
              <p className="text-mist text-xs mt-0.5">{selected.length} {lang === 'lg' ? 'emmere' : 'foods'}</p>
            </div>
          </div>
          <p className="text-mist/80 text-xs leading-relaxed">{guide.msg}</p>
          <button onClick={() => setSelected([])}
            className="mt-3 flex items-center gap-1.5 text-mist text-xs active:opacity-70">
            <RotateCcw size={11} /> {lang === 'lg' ? 'Sazaamu' : 'Clear all'}
          </button>
        </div>
      )}

      <div className="bg-charcoal/50 rounded-2xl p-3">
        <p className="text-mist/60 text-xs leading-relaxed">
          {lang === 'lg'
            ? 'Ebirala ebiweebwa: abasajja 2000–2500 kcal, abakazi 1800–2200 kcal buli lunaku. Abakazi abeembuto bagya 300 kcal okusingayo.'
            : 'General guidelines: men need 2000–2500 kcal/day, women 1800–2200 kcal/day. Pregnant women need ~300 extra kcal daily.'}
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
const TOOLS = [
  { id: 'bmi',      icon: '⚖️',  color: 'emerald-400', bg: 'emerald-950/30',
    label_en: 'BMI Calculator',       label_lg: 'Okulinga BMI',
    sub_en: 'Check if your weight is healthy',  sub_lg: 'Kebera obungi bwo mu obulamu' },
  { id: 'water',    icon: '💧',  color: 'blue-400',    bg: 'blue-950/30',
    label_en: 'Hydration Tracker',    label_lg: 'Okubala Amazzi',
    sub_en: 'Track daily water intake', sub_lg: 'Bala amazzi ge omwa buli lunaku' },
  { id: 'duedate',  icon: '🤰',  color: 'pink-400',    bg: 'pink-950/30',
    label_en: 'Due Date Calculator',  label_lg: 'Okulinga Olunaku lw\'Okuzaala',
    sub_en: 'Pregnancy week & EDD',  sub_lg: 'Wiiki ey\'okubeera embuto n\'olunaku' },
  { id: 'calories', icon: '🍽️',  color: 'amber-400',   bg: 'amber-950/30',
    label_en: 'Calorie Estimator',    label_lg: 'Okubala Amaanyi g\'Emmere',
    sub_en: 'Uganda food calorie guide', sub_lg: 'Amaanyi ag\'emmere ey\'Uganda' },
]

export default function HealthTools() {
  const { lang, tr } = useLang()
  const nav = useNavigate()
  const [active, setActive] = useState('bmi')

  const tool = TOOLS.find(t => t.id === active)

  return (
    <div className="h-full flex flex-col bg-midnight safe-top">
      {/* Header */}
      <div className="bg-charcoal border-b border-white/5 px-5 pt-8 pb-4 flex-shrink-0">
        <button onClick={() => nav(-1)}
          className="flex items-center gap-1 text-emerald-500 text-sm font-medium mb-3 active:opacity-70">
          <ChevronLeft size={16} /> {tr('ui.back').replace('← ', '')}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600/20 rounded-2xl flex items-center justify-center">
            <Calculator size={20} className="text-emerald-500" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-cream">
              {lang === 'lg' ? 'Ebyokukebera Obulamu' : 'Health Tools'}
            </h1>
            <p className="text-mist text-xs">
              {lang === 'lg' ? 'Ebikozesebwa eby\'obulamu — butereevu, obutayagala inneti' : '4 offline health calculators'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {/* Tool selector */}
        <div className="grid grid-cols-2 gap-2 py-4">
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95
                ${active === t.id
                  ? `border-${t.color}/40 bg-${t.bg}`
                  : 'border-white/5 bg-charcoal'}`}>
              <span className="text-2xl block mb-1.5">{t.icon}</span>
              <p className={`text-xs font-bold leading-tight ${active === t.id ? `text-${t.color}` : 'text-cream'}`}>
                {lang === 'lg' ? t.label_lg : t.label_en}
              </p>
              <p className="text-mist text-[10px] mt-0.5 leading-tight">
                {lang === 'lg' ? t.sub_lg : t.sub_en}
              </p>
            </button>
          ))}
        </div>

        {/* Active tool */}
        <div className="mt-1">
          {active === 'bmi'      && <BMICalculator lang={lang} />}
          {active === 'water'    && <HydrationTracker lang={lang} />}
          {active === 'duedate'  && <DueDateCalculator lang={lang} />}
          {active === 'calories' && <CalorieEstimator lang={lang} />}
        </div>
      </div>
    </div>
  )
}
