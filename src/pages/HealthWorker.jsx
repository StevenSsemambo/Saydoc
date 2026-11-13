import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import { useNavigate } from 'react-router-dom'
import { InferenceSession, CONDITIONS, ICD10 } from '../engine/InferenceEngine.js'
import { saveSession, getSessions } from '../db/database.js'
import {
  Send, RefreshCw, AlertTriangle, Stethoscope, ChevronLeft,
  FileText, ClipboardList, Users, ChevronDown, ChevronUp,
  Plus, XCircle, BookOpen, Activity, Zap, Download,
  Heart, Thermometer, Wind, Droplets, Scale, Eye,
  AlertCircle, CheckCircle, Clock, BarChart2, Baby,
  Shield, Pill, Coffee
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// ICD-10 MAP
// ─────────────────────────────────────────────────────────────────────────────
const ICD10_MAP = {
  migraine:'G43', tension_headache:'G44.2', cluster_headache:'G44.0',
  malaria:'B54', malaria_mild:'B54', typhoid:'A01.0', hypertension:'I10',
  flu:'J11', gastritis:'K29.7', uti:'N39.0', anxiety:'F41.1',
  asthma:'J45', sinusitis:'J32.9', back_pain:'M54.5', depression:'F32.9',
  food_poisoning:'A05.9', conjunctivitis:'H10.9', palpitations:'R00.2',
  anaemia:'D64.9', diabetes_symptoms:'E11', skin_rash:'L30.9',
  malnutrition:'E46', dengue:'A90', tb:'A15', pneumonia:'J18.9',
  cholera:'A00', hiv_symptoms:'B24', kidney_stones:'N20.0',
  appendicitis:'K37', stroke_symptoms:'I64', scabies:'B86',
  peptic_ulcer:'K27', meningitis:'G03.9', heart_failure:'I50.9',
  eye_strain:'H52.2', worms:'B82.0', period_pain:'N94.4',
  heat_exhaustion:'T67.5', hypertensive_headache:'I10',
}

const ANSWER_LABELS = {
  yes:'Yes', no:'No', one_side:'One side', both_sides:'Both sides',
  throbbing:'Throbbing', pressure:'Pressure', nausea_only:'Nausea',
  vomited:'Vomited', sudden:'Sudden onset', gradual:'Gradual',
  not_sure:'Not sure', positive:'Positive', negative:'Negative',
  not_tested:'Not tested', whole_head:'Whole head', both:'Both',
  upper_middle:'Epigastric', lower:'Lower abdomen', all_over:'Diffuse',
  above_40:'>40°C', between_38_40:'38–40°C', not_measured:'Not measured',
  severe:'Severe', mild:'Mild', moderate:'Moderate',
  before_and_during:'Pre & intra-menstrual', during_only:'Intra-menstrual',
}

const REFERRAL_LEVELS = {
  emergency:     { label:'Emergency Referral',  color:'text-red-400',     bg:'bg-red-900/30',    border:'border-red-500/40',    desc:'IMMEDIATE hospital referral' },
  high:          { label:'Urgent Referral',     color:'text-orange-400',  bg:'bg-orange-900/30', border:'border-orange-500/40', desc:'Same-day referral required' },
  moderate_high: { label:'Priority Referral',   color:'text-yellow-400',  bg:'bg-yellow-900/30', border:'border-yellow-500/40', desc:'Refer within 24–48 hours' },
  moderate:      { label:'Outpatient Referral', color:'text-blue-400',    bg:'bg-blue-900/30',   border:'border-blue-500/40',   desc:'Outpatient referral if >7 days' },
  mild_moderate: { label:'Community Management',color:'text-cyan-400',    bg:'bg-cyan-900/30',   border:'border-cyan-500/40',   desc:'Community-level management' },
  mild:          { label:'Home Management',     color:'text-emerald-400', bg:'bg-emerald-900/30',border:'border-emerald-500/40',desc:'Home care, follow up in 1 week' },
}

// ─────────────────────────────────────────────────────────────────────────────
// VITAL SIGN INTERPRETATION — color-flags abnormal values
// ─────────────────────────────────────────────────────────────────────────────
function interpretVital(key, value) {
  if (!value) return null
  const v = parseFloat(value)
  if (isNaN(v)) return null
  switch(key) {
    case 'temp':
      if (v >= 39.5) return { level:'danger', label:'High fever', color:'text-red-400', bg:'bg-red-900/20' }
      if (v >= 38.0) return { level:'warn',   label:'Fever',      color:'text-orange-400', bg:'bg-orange-900/20' }
      if (v < 35.5)  return { level:'danger', label:'Hypothermia',color:'text-blue-400', bg:'bg-blue-900/20' }
      return null
    case 'spo2':
      if (v < 90)  return { level:'danger', label:'Critical hypoxia', color:'text-red-400', bg:'bg-red-900/20' }
      if (v < 94)  return { level:'warn',   label:'Low SpO2',         color:'text-orange-400', bg:'bg-orange-900/20' }
      return null
    case 'hr':
      if (v > 120) return { level:'warn',   label:'Tachycardia', color:'text-orange-400', bg:'bg-orange-900/20' }
      if (v < 50)  return { level:'warn',   label:'Bradycardia', color:'text-orange-400', bg:'bg-orange-900/20' }
      return null
    case 'rr':
      if (v > 30)  return { level:'danger', label:'Severe tachypnoea', color:'text-red-400', bg:'bg-red-900/20' }
      if (v > 20)  return { level:'warn',   label:'Tachypnoea',        color:'text-orange-400', bg:'bg-orange-900/20' }
      return null
    default: return null
  }
}

function parseBP(bp) {
  if (!bp) return null
  const m = bp.match(/(\d+)[/\\](\d+)/)
  if (!m) return null
  return { sys: parseInt(m[1]), dia: parseInt(m[2]) }
}

function interpretBP(bp) {
  const p = parseBP(bp)
  if (!p) return null
  if (p.sys >= 180 || p.dia >= 110) return { level:'danger', label:'Hypertensive Crisis', color:'text-red-400', bg:'bg-red-900/20' }
  if (p.sys >= 160 || p.dia >= 100) return { level:'danger', label:'Stage 2 Hypertension', color:'text-red-400', bg:'bg-red-900/20' }
  if (p.sys >= 140 || p.dia >= 90)  return { level:'warn',   label:'Stage 1 Hypertension', color:'text-orange-400', bg:'bg-orange-900/20' }
  if (p.sys < 90)                   return { level:'danger', label:'Hypotension — check for shock', color:'text-red-400', bg:'bg-red-900/20' }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// PAEDIATRIC DOSE CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
function calcPaedDose(weightKg) {
  const wt = parseFloat(weightKg)
  if (!wt || wt <= 0) return null
  return {
    paracetamol:   `${Math.round(wt * 15)}mg every 6h (max 1g/dose)`,
    amoxicillin:   `${Math.round(wt * 25)}mg every 8h`,
    coartem:       wt < 5  ? 'Not recommended <5 kg'
                 : wt < 15 ? '1 tablet twice daily × 3 days'
                 : wt < 25 ? '2 tablets twice daily × 3 days'
                 : wt < 35 ? '3 tablets twice daily × 3 days'
                 : '4 tablets twice daily × 3 days',
    ibuprofen:     `${Math.round(wt * 10)}mg every 8h (max 400mg). GIVE WITH FOOD.`,
    cotrimoxazole: `${Math.round(wt * 6)}mg (TMP component) every 12h`,
    zinc_ors:      wt < 10 ? '10mg daily × 10 days' : '20mg daily × 10 days',
    albendazole:   wt < 10 ? '200mg single dose' : '400mg single dose',
    amoxicillin_pneumonia: `${Math.round(wt * 40)}mg every 8h (pneumonia dose)`,
    dexamethasone: `${(wt * 0.15).toFixed(2)}mg IV/IM (croup/severe allergic)`,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MUAC
// ─────────────────────────────────────────────────────────────────────────────
function getMuacClass(muacMm) {
  const v = parseFloat(muacMm)
  if (!v) return null
  if (v < 115) return { label:'SAM', color:'text-red-400',    bg:'bg-red-900/20',    desc:'Severe Acute Malnutrition — refer for RUTF + therapeutic feeding' }
  if (v < 125) return { label:'MAM', color:'text-orange-400', bg:'bg-orange-900/20', desc:'Moderate Acute Malnutrition — enrol in supplementary feeding program' }
  return             { label:'Normal', color:'text-emerald-400', bg:'bg-emerald-900/20', desc:'MUAC within normal range (≥125mm)' }
}

// ─────────────────────────────────────────────────────────────────────────────
// WHO DEHYDRATION SCORING
// ─────────────────────────────────────────────────────────────────────────────
const DEHYDRATION_SIGNS = [
  { id:'eyes',    label:'Sunken eyes',            opts:[{v:0,l:'Normal'},{v:1,l:'Slightly sunken'},{v:2,l:'Very sunken & dry'}] },
  { id:'skin',    label:'Skin pinch',             opts:[{v:0,l:'Returns quickly'},{v:1,l:'Returns slowly (<2s)'},{v:2,l:'Very slow (>2s)'}] },
  { id:'mouth',   label:'Mouth / tongue',         opts:[{v:0,l:'Moist'},{v:1,l:'Dry'},{v:2,l:'Very dry / parched'}] },
  { id:'urine',   label:'Urine output',           opts:[{v:0,l:'Normal'},{v:1,l:'Reduced'},{v:2,l:'None in 6+ hours'}] },
  { id:'thirst',  label:'Thirst',                 opts:[{v:0,l:'Not thirsty'},{v:1,l:'Thirsty'},{v:2,l:'Drinks eagerly / cannot drink'}] },
  { id:'general', label:'General appearance',     opts:[{v:0,l:'Well, alert'},{v:1,l:'Restless, irritable'},{v:2,l:'Lethargic / unconscious'}] },
]

function DehydrationTool({ weightKg }) {
  const [scores, setScores] = useState({})
  const total = Object.values(scores).reduce((a,b) => a+b, 0)
  const answered = Object.keys(scores).length

  let level, orsText, action, levelColor
  if (answered < DEHYDRATION_SIGNS.length) {
    level = null
  } else if (total <= 1) {
    level = 'No dehydration'; levelColor = 'text-emerald-400'
    orsText = `ORS: 10ml/kg after each loose stool`
    action = 'Home management. Continue feeding. Return if worsening.'
  } else if (total <= 6) {
    level = 'Some dehydration'; levelColor = 'text-orange-400'
    const wt = parseFloat(weightKg) || 10
    const orsVol = Math.round(wt * 75)
    orsText = `ORS: ${orsVol}ml over 4 hours (${Math.round(wt * 75 / 4)}ml/hr)`
    action = 'Give ORS at facility. Reassess after 4 hours. Refer if not improving.'
  } else {
    level = 'Severe dehydration'; levelColor = 'text-red-400'
    const wt = parseFloat(weightKg) || 10
    orsText = `IV/IO Ringer's Lactate: ${Math.round(wt * 100)}ml over 3 hours. REFER URGENTLY.`
    action = 'START IV FLUIDS IMMEDIATELY. Refer to hospital.'
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="label-text">WHO DEHYDRATION ASSESSMENT</p>
        <button onClick={() => setScores({})} className="text-mist/60 text-xs">Reset</button>
      </div>
      <div className="space-y-2">
        {DEHYDRATION_SIGNS.map(sign => (
          <div key={sign.id} className="bg-midnight rounded-xl p-2.5">
            <p className="text-cream text-xs font-semibold mb-2">{sign.label}</p>
            <div className="flex gap-1.5 flex-wrap">
              {sign.opts.map(opt => (
                <button key={opt.v} onClick={() => setScores(s => ({...s, [sign.id]: opt.v}))}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${scores[sign.id] === opt.v ? (opt.v === 0 ? 'bg-emerald-600 text-white' : opt.v === 1 ? 'bg-orange-600 text-white' : 'bg-red-600 text-white') : 'bg-white/5 text-mist'}`}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {level && (
        <div className={`rounded-2xl p-3 border ${total > 6 ? 'border-red-500/40 bg-red-900/20' : total > 1 ? 'border-orange-500/40 bg-orange-900/20' : 'border-emerald-500/40 bg-emerald-900/20'}`}>
          <p className={`font-bold text-sm mb-1 ${levelColor}`}>{level} (score: {total}/12)</p>
          <p className="text-cream text-xs font-mono mb-1.5">💧 {orsText}</p>
          <p className="text-mist text-xs leading-relaxed">{action}</p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AVPU + GCS
// ─────────────────────────────────────────────────────────────────────────────
function AVPUTool() {
  const [avpu, setAvpu] = useState(null)
  const [gcs, setGcs] = useState({ eyes:4, verbal:5, motor:6 })
  const [showGcs, setShowGcs] = useState(false)
  const gcsTotal = gcs.eyes + gcs.verbal + gcs.motor

  const avpuOptions = [
    { v:'A', label:'Alert',           sub:'Fully awake and oriented',            color:'text-emerald-400', bg:'bg-emerald-900/20', border:'border-emerald-500/30' },
    { v:'V', label:'Voice',           sub:'Responds to voice only',              color:'text-yellow-400',  bg:'bg-yellow-900/20',  border:'border-yellow-500/30' },
    { v:'P', label:'Pain',            sub:'Responds to pain stimuli only',       color:'text-orange-400',  bg:'bg-orange-900/20',  border:'border-orange-500/30' },
    { v:'U', label:'Unresponsive',    sub:'No response to any stimulus',         color:'text-red-400',     bg:'bg-red-900/20',     border:'border-red-500/30' },
  ]

  const getGcsInfo = (score) => {
    if (score <= 8)  return { label:'Severe impairment', color:'text-red-400',    action:'INTUBATE / REFER IMMEDIATELY. Risk of airway loss.' }
    if (score <= 12) return { label:'Moderate impairment', color:'text-orange-400', action:'URGENT referral. Monitor airway. Nurse on side.' }
    return               { label:'Mild impairment / normal', color:'text-emerald-400', action:'Monitor closely. Reassess every 30 minutes.' }
  }
  const gcsInfo = getGcsInfo(gcsTotal)

  return (
    <div className="space-y-3">
      <p className="label-text">AVPU NEUROLOGICAL ASSESSMENT</p>
      <div className="grid grid-cols-2 gap-2">
        {avpuOptions.map(o => (
          <button key={o.v} onClick={() => setAvpu(o.v)}
            className={`rounded-xl p-3 text-left border transition-all ${avpu === o.v ? `${o.bg} ${o.border}` : 'bg-midnight border-white/8'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-lg font-bold ${avpu === o.v ? o.color : 'text-cream'}`}>{o.v}</span>
              <span className={`text-xs font-semibold ${avpu === o.v ? o.color : 'text-cream'}`}>{o.label}</span>
            </div>
            <p className="text-mist text-[10px] leading-tight">{o.sub}</p>
          </button>
        ))}
      </div>
      {avpu && (avpu === 'V' || avpu === 'P' || avpu === 'U') && (
        <div className={`rounded-2xl p-3 border ${avpu === 'U' || avpu === 'P' ? 'border-red-500/40 bg-red-900/20' : 'border-orange-500/40 bg-orange-900/20'}`}>
          <p className={`font-bold text-xs mb-1 ${avpu === 'U' || avpu === 'P' ? 'text-red-400' : 'text-orange-400'}`}>
            {avpu === 'U' ? '🚨 EMERGENCY — Refer immediately. Protect airway.' : avpu === 'P' ? '⚠️ URGENT — Patient has reduced consciousness.' : '⚠️ Monitor closely. Consider urgent referral.'}
          </p>
        </div>
      )}

      <button onClick={() => setShowGcs(!showGcs)} className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold">
        {showGcs ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
        Glasgow Coma Scale (GCS)
      </button>

      {showGcs && (
        <div className="space-y-2">
          {[
            { key:'eyes',   label:'Eye Opening',   opts:[{v:4,l:'Spontaneous'},{v:3,l:'To voice'},{v:2,l:'To pain'},{v:1,l:'None'}] },
            { key:'verbal', label:'Verbal Response',opts:[{v:5,l:'Oriented'},{v:4,l:'Confused'},{v:3,l:'Words'},{v:2,l:'Sounds'},{v:1,l:'None'}] },
            { key:'motor',  label:'Motor Response', opts:[{v:6,l:'Obeys'},{v:5,l:'Localises'},{v:4,l:'Withdraws'},{v:3,l:'Flexion'},{v:2,l:'Extension'},{v:1,l:'None'}] },
          ].map(row => (
            <div key={row.key} className="bg-midnight rounded-xl p-2.5">
              <p className="text-cream text-xs font-semibold mb-2">{row.label}</p>
              <div className="flex gap-1.5 flex-wrap">
                {row.opts.map(opt => (
                  <button key={opt.v} onClick={() => setGcs(g => ({...g, [row.key]: opt.v}))}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] transition-all ${gcs[row.key] === opt.v ? 'bg-blue-600 text-white font-semibold' : 'bg-white/5 text-mist'}`}>
                    {opt.v} – {opt.l}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className={`rounded-2xl p-3 border ${gcsTotal <= 8 ? 'border-red-500/40 bg-red-900/20' : gcsTotal <= 12 ? 'border-orange-500/40 bg-orange-900/20' : 'border-emerald-500/40 bg-emerald-900/20'}`}>
            <p className={`font-bold text-sm mb-1 ${gcsInfo.color}`}>GCS: {gcsTotal}/15 — {gcsInfo.label}</p>
            <p className="text-mist text-xs leading-relaxed">{gcsInfo.action}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MALARIA RDT PROTOCOL
// ─────────────────────────────────────────────────────────────────────────────
function MalariaRDT({ weightKg, age }) {
  const [result, setResult] = useState(null)
  const [severity, setSeverity] = useState(null)

  const wt = parseFloat(weightKg) || 0
  const ageYr = parseFloat(age) || 0

  const coartemDose = wt < 5  ? 'Not recommended <5 kg'
    : wt < 15 ? '1 tablet (20/120mg) twice daily × 3 days'
    : wt < 25 ? '2 tablets twice daily × 3 days'
    : wt < 35 ? '3 tablets twice daily × 3 days'
    : '4 tablets twice daily × 3 days'

  const adultDose = ageYr >= 14 && wt >= 35

  const severeActions = [
    'Refer IMMEDIATELY to hospital',
    'Give pre-referral IM/IV artesunate or quinine if available',
    'Ensure IV access. Give fluids cautiously.',
    'Do NOT give artemether suppositories alone — refer after pre-treatment',
    'Monitor blood glucose (hypoglycaemia common in severe malaria)',
  ]

  return (
    <div className="space-y-3">
      <p className="label-text">MALARIA RDT RESULT</p>
      <div className="flex gap-2">
        {['positive','negative','invalid'].map(r => (
          <button key={r} onClick={() => { setResult(r); setSeverity(null) }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all capitalize ${result === r
              ? r === 'positive' ? 'bg-red-900/30 border-red-500/50 text-red-300'
              : r === 'negative' ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-300'
              : 'bg-yellow-900/30 border-yellow-500/50 text-yellow-300'
              : 'bg-midnight border-white/8 text-mist'}`}>
            {r === 'positive' ? '+ Positive' : r === 'negative' ? '– Negative' : '? Invalid'}
          </button>
        ))}
      </div>

      {result === 'positive' && (
        <div className="space-y-2">
          <p className="label-text text-red-400">ASSESS SEVERITY</p>
          <div className="flex gap-2">
            {['uncomplicated','severe'].map(s => (
              <button key={s} onClick={() => setSeverity(s)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all capitalize ${severity === s
                  ? s === 'uncomplicated' ? 'bg-orange-900/30 border-orange-500/50 text-orange-300' : 'bg-red-900/40 border-red-500/60 text-red-300'
                  : 'bg-midnight border-white/8 text-mist'}`}>
                {s === 'uncomplicated' ? 'Uncomplicated' : 'Severe / Danger signs'}
              </button>
            ))}
          </div>
          <p className="text-mist text-[10px] italic">Severe = convulsions, altered consciousness, respiratory distress, prostration, heavy vomiting, jaundice, haemoglobin &lt;7g/dL</p>

          {severity === 'uncomplicated' && (
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-2xl p-3 space-y-1.5">
              <p className="text-orange-300 font-bold text-xs">TREATMENT — Uncomplicated Malaria</p>
              <p className="text-cream text-xs"><span className="text-mist">ACT (Coartem): </span>{adultDose ? '4 tablets twice daily × 3 days' : coartemDose}</p>
              <p className="text-cream text-xs"><span className="text-mist">Paracetamol: </span>{wt > 0 ? `${Math.round(wt*15)}mg every 6h for fever` : '500mg–1g every 6h for fever'}</p>
              <p className="text-cream text-xs"><span className="text-mist">Advise: </span>Finish full 3-day course. Return immediately if worsens.</p>
              {ageYr < 5 && <p className="text-yellow-300 text-xs font-semibold">⚠️ Under-5: Give with food or milk to reduce vomiting.</p>}
            </div>
          )}

          {severity === 'severe' && (
            <div className="bg-red-900/30 border border-red-500/40 rounded-2xl p-3 space-y-1.5">
              <p className="text-red-300 font-bold text-xs">🚨 SEVERE MALARIA — EMERGENCY REFERRAL</p>
              {severeActions.map((a,i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-red-400 text-xs flex-shrink-0">{i+1}.</span>
                  <p className="text-red-100 text-xs leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {result === 'negative' && (
        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-3 space-y-1.5">
          <p className="text-emerald-300 font-bold text-xs">RDT Negative — Consider Alternatives</p>
          <p className="text-mist text-xs">• If fever ≥38°C and malaria strongly suspected clinically, treat as malaria AND refer for blood smear</p>
          <p className="text-mist text-xs">• Consider: Typhoid, UTI, Pneumonia, Dengue, Flu</p>
          <p className="text-mist text-xs">• Give paracetamol for fever control while investigating</p>
        </div>
      )}

      {result === 'invalid' && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-3">
          <p className="text-yellow-300 font-bold text-xs">Invalid Result</p>
          <p className="text-mist text-xs mt-1">Repeat test with a new RDT. Check: sufficient blood on strip, test not expired, correct storage temperature. If repeated invalid, treat clinically based on presentation.</p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK PROTOCOLS LIBRARY (Uganda MoH aligned)
// ─────────────────────────────────────────────────────────────────────────────
const PROTOCOLS = [
  {
    id:'ors', icon:'💧', title:'ORS Preparation', category:'Diarrhoea',
    steps:[
      'Wash hands thoroughly with soap and water.',
      'Use 1 litre of clean, safe water (boiled and cooled, or treated).',
      'Add 1 ORS sachet (WHO formula) and stir until fully dissolved.',
      'If no ORS sachet: Add 6 level teaspoons of sugar + ½ teaspoon of salt to 1 litre water. Stir well.',
      'Give the prepared solution within 24 hours. Discard after 24 hours.',
    ],
    dosing:'Under 2 years: 50–100ml after each loose stool.\n2–10 years: 100–200ml after each loose stool.\nOver 10 years: as much as tolerated (200–400ml).',
    warning:'If child cannot drink, vomits everything, is drowsy or unconscious → IV fluids + REFER URGENTLY.',
  },
  {
    id:'pep', icon:'🛡️', title:'HIV PEP Protocol', category:'HIV / STI',
    steps:[
      'PEP must start within 72 hours of exposure (sooner = better).',
      'First: counsel patient — explain what PEP is and full 28-day course requirement.',
      'Baseline HIV test to confirm HIV-negative status before starting.',
      'Recommended regimen (adults): TDF 300mg + 3TC 300mg + DTG 50mg once daily × 28 days.',
      'Paediatric: consult facility prescriber — weight-based dosing required.',
      'Test again at 6 weeks and 3 months post-exposure.',
    ],
    dosing:'TDF/3TC/DTG once daily × 28 days. Do not miss doses.',
    warning:'PEP is NOT 100% effective. Does NOT replace barrier protection. Counsel on ongoing prevention.',
  },
  {
    id:'epi', icon:'💉', title:'EPI Vaccination Schedule', category:'Preventive',
    steps:[
      'Birth: BCG + OPV 0',
      '6 weeks: DPT-HepB-Hib 1 + OPV 1 + PCV 1 + Rota 1',
      '10 weeks: DPT-HepB-Hib 2 + OPV 2 + PCV 2 + Rota 2',
      '14 weeks: DPT-HepB-Hib 3 + OPV 3 + PCV 3 + IPV',
      '6 months: Vitamin A (start), Albendazole (start)',
      '9 months: Measles-Rubella 1 + Yellow Fever',
      '18 months: Measles-Rubella 2 booster',
      '5 years: DT booster',
    ],
    dosing:'Give Vitamin A every 6 months from 6 months to 5 years.',
    warning:'If child presents late, vaccinate as per catch-up schedule. Never refuse vaccination to a sick child unless severely ill.',
  },
  {
    id:'anc', icon:'🤰', title:'ANC Schedule', category:'Maternal',
    steps:[
      'Contact 1 (≤12 weeks): Confirm pregnancy, LMP, EDD. Blood tests: Hb, blood group, syphilis, HIV. BP, weight. Start folic acid + iron.',
      'Contact 2 (20 weeks): Fundal height. Anaemia screen. Repeat syphilis if high risk.',
      'Contact 3 (26 weeks): Fundal height. Glucose screen if risk factors. TT vaccine.',
      'Contact 4 (30 weeks): Fundal height. Lie/presentation. Malaria prophylaxis (SP).',
      'Contact 5 (34 weeks): Fundal height. Fetal movement check. Birth preparedness.',
      'Contact 6 (36 weeks): Presentation. Referral if breech. Birth plan finalised.',
      'Contact 7 (38 weeks): Review. Danger signs checklist.',
      'Contact 8 (40 weeks): If not yet delivered, assess fetal wellbeing. Arrange for delivery.',
    ],
    dosing:'Iron/Folate: 1 tablet daily throughout pregnancy.\nSP (IPTp): 3 doses from 13 weeks, 4 weeks apart.\nTT: 2 doses minimum if not immunised.',
    warning:'Danger signs: heavy bleeding, severe headache, visual disturbance, severe swelling, no fetal movement, fever → REFER IMMEDIATELY.',
  },
  {
    id:'sepsis', icon:'🔴', title:'Sepsis Recognition', category:'Emergency',
    steps:[
      'Suspect sepsis in any sick patient with a known or suspected infection PLUS any danger sign.',
      'DANGER SIGNS: RR >22/min, altered mental state (AVPU ≠ A), SBP <100mmHg, HR >100, Temp <36 or >38.3.',
      'If sepsis suspected: START CLOCK. Sepsis = medical emergency.',
      'Take blood for culture if available BEFORE giving antibiotics (do not delay treatment).',
      'Give broad-spectrum IV antibiotics: Ampicillin + Gentamicin OR Ceftriaxone 2g IV.',
      'Give IV fluid bolus: Ringer\'s Lactate 500ml over 30 min. Reassess.',
      'Give oxygen if SpO2 <94%.',
      'REFER IMMEDIATELY to hospital.',
    ],
    dosing:'Ceftriaxone: 2g IV daily. Gentamicin: 5mg/kg IV daily. Metronidazole: 500mg IV 8-hourly if abdominal source.',
    warning:'Time is tissue. Every hour of delay in antibiotics increases mortality by 7%. Act fast.',
  },
  {
    id:'pph', icon:'❤️', title:'PPH Management', category:'Maternal Emergency',
    steps:[
      'CALL FOR HELP IMMEDIATELY.',
      'Step 1: Rub uterine fundus firmly (massage) to stimulate contraction.',
      'Step 2: Oxytocin 10 IU IM immediately (if not already given for AMTSL).',
      'Step 3: Empty bladder — catheterise if needed.',
      'Step 4: IV access — 2 large-bore cannulas. Give Ringer\'s Lactate rapidly.',
      'Step 5: If oxytocin fails → Misoprostol 800mcg sublingually OR Ergometrine 0.2mg IM.',
      'Step 6: If still bleeding → Bimanual uterine compression.',
      'Step 7: Apply non-pneumatic anti-shock garment (NASG) if available.',
      'TRANSFER to hospital for surgical management if bleeding continues >1 litre.',
    ],
    dosing:'Oxytocin 10 IU IM is first-line. Misoprostol 800mcg sublingual if no oxytocin.',
    warning:'Normal blood loss at delivery ≤500ml vaginal / ≤1000ml caesarean. Any excess = PPH. Do not wait.',
  },
]

function ProtocolsLibrary() {
  const [active, setActive] = useState(null)
  const [category, setCategory] = useState('All')

  const categories = ['All', ...new Set(PROTOCOLS.map(p => p.category))]
  const filtered = category === 'All' ? PROTOCOLS : PROTOCOLS.filter(p => p.category === category)

  return (
    <div className="space-y-3">
      <p className="label-text">CLINICAL PROTOCOLS — Uganda MoH Aligned</p>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {categories.map(c => (
          <button key={c} onClick={() => { setCategory(c); setActive(null) }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${category === c ? 'bg-blue-600 text-white' : 'bg-midnight text-mist'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Protocol cards */}
      {active === null ? (
        <div className="space-y-2">
          {filtered.map(p => (
            <button key={p.id} onClick={() => setActive(p.id)}
              className="w-full flex items-center gap-3 bg-midnight rounded-2xl px-3 py-3 active:scale-[0.98] transition-all text-left border border-white/5 hover:border-blue-500/30">
              <span className="text-xl flex-shrink-0">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-cream text-xs font-semibold">{p.title}</p>
                <p className="text-mist text-[10px]">{p.category}</p>
              </div>
              <ChevronDown size={12} className="text-mist flex-shrink-0 -rotate-90"/>
            </button>
          ))}
        </div>
      ) : (
        (() => {
          const p = PROTOCOLS.find(x => x.id === active)
          return (
            <div className="space-y-3">
              <button onClick={() => setActive(null)} className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold">
                <ChevronLeft size={13}/> Back to protocols
              </button>
              <div className="bg-midnight rounded-2xl p-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{p.icon}</span>
                  <div>
                    <p className="text-cream font-semibold text-sm">{p.title}</p>
                    <p className="text-mist text-[10px]">{p.category}</p>
                  </div>
                </div>
                <p className="label-text mb-2">STEPS</p>
                <div className="space-y-2 mb-3">
                  {p.steps.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-blue-400 text-xs font-bold flex-shrink-0 mt-0.5">{i+1}.</span>
                      <p className="text-cream text-xs leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
                {p.dosing && (
                  <div className="bg-charcoal rounded-xl p-2.5 mb-3">
                    <p className="label-text mb-1">DOSING REFERENCE</p>
                    <p className="text-cream text-xs font-mono leading-relaxed whitespace-pre-line">{p.dosing}</p>
                  </div>
                )}
                {p.warning && (
                  <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-2.5">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={11} className="text-orange-400 flex-shrink-0 mt-0.5"/>
                      <p className="text-orange-200 text-xs leading-relaxed">{p.warning}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })()
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VITALS PANEL with auto-interpretation
// ─────────────────────────────────────────────────────────────────────────────
function VitalSigns({ vitals, onChange }) {
  const fields = [
    { key:'bp',   icon:<Heart size={11}/>,       label:'BP',   placeholder:'120/80', unit:'mmHg' },
    { key:'temp', icon:<Thermometer size={11}/>,  label:'Temp', placeholder:'37.0',  unit:'°C'   },
    { key:'hr',   icon:<Activity size={11}/>,     label:'HR',   placeholder:'72',    unit:'bpm'  },
    { key:'spo2', icon:<Wind size={11}/>,         label:'SpO2', placeholder:'98',    unit:'%'    },
    { key:'wt',   icon:<Scale size={11}/>,        label:'Wt',   placeholder:'65',    unit:'kg'   },
    { key:'rr',   icon:<Droplets size={11}/>,     label:'RR',   placeholder:'16',    unit:'/min' },
    { key:'muac', icon:<Eye size={11}/>,          label:'MUAC', placeholder:'135',   unit:'mm'   },
  ]

  const muacClass = getMuacClass(vitals.muac)
  const paedDoses = calcPaedDose(vitals.wt)
  const bpFlag = interpretBP(vitals.bp)

  const flags = fields
    .filter(f => f.key !== 'bp' && f.key !== 'muac' && f.key !== 'wt')
    .map(f => ({ field: f.label, flag: interpretVital(f.key, vitals[f.key]) }))
    .filter(x => x.flag)

  if (bpFlag) flags.unshift({ field:'BP', flag: bpFlag })

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5">
        {fields.map(f => (
          <div key={f.key} className="bg-midnight rounded-xl p-2">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-mist">{f.icon}</span>
              <span className="text-mist text-[9px] font-semibold uppercase">{f.label}</span>
            </div>
            <input
              className="w-full bg-transparent text-cream text-xs font-mono focus:outline-none placeholder-mist/30"
              placeholder={f.placeholder}
              value={vitals[f.key] || ''}
              onChange={e => onChange({ ...vitals, [f.key]: e.target.value })}
            />
            <span className="text-mist/50 text-[9px]">{f.unit}</span>
          </div>
        ))}
      </div>

      {/* Abnormal vital flags */}
      {flags.length > 0 && (
        <div className="space-y-1">
          {flags.map((x,i) => (
            <div key={i} className={`rounded-xl px-3 py-2 flex items-center gap-2 ${x.flag.bg}`}>
              <AlertCircle size={11} className={x.flag.color}/>
              <span className={`text-xs font-bold ${x.flag.color}`}>{x.field}: {x.flag.label}</span>
              {x.flag.level === 'danger' && <span className="text-red-300 text-[10px] ml-auto">REFER</span>}
            </div>
          ))}
        </div>
      )}

      {muacClass && (
        <div className={`rounded-xl px-3 py-2 ${muacClass.bg} flex items-start gap-2`}>
          <span className={`text-xs font-bold ${muacClass.color}`}>MUAC: {muacClass.label}</span>
          <span className="text-mist text-[11px] leading-tight">{muacClass.desc}</span>
        </div>
      )}

      {paedDoses && (
        <details className="bg-midnight rounded-xl overflow-hidden">
          <summary className="px-3 py-2 text-[11px] text-blue-300 font-semibold cursor-pointer">
            💊 Weight-based doses ({vitals.wt} kg)
          </summary>
          <div className="px-3 pb-3 pt-1 space-y-1.5">
            {Object.entries(paedDoses).map(([drug, dose]) => (
              <div key={drug} className="flex justify-between items-start gap-2">
                <span className="text-mist text-[10px] capitalize flex-shrink-0">{drug.replace(/_/g,' ')}</span>
                <span className="text-cream text-[10px] font-mono text-right">{dose}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REFERRAL LETTER (enhanced)
// ─────────────────────────────────────────────────────────────────────────────
function ReferralLetter({ patient, result, vitals, facility, onFacilityChange, clinicalNotes, avpuScore }) {
  const [copied, setCopied] = React.useState(false)
  const today = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
  const icd = ICD10_MAP[result?.condition] || '---'
  const refLevel = CONDITIONS[result?.condition]?.severity_class || 'moderate'
  const ref = REFERRAL_LEVELS[refLevel] || REFERRAL_LEVELS.moderate
  const muacClass = getMuacClass(vitals?.muac)
  const bpFlag = interpretBP(vitals?.bp)

  const lines = [
    'PATIENT REFERRAL LETTER',
    '═'.repeat(44),
    'DATE:     ' + today,
    'FACILITY: ' + (facility || '[Receiving Health Facility]'),
    '',
    'TO:   The Medical Officer In Charge',
    'FROM: Health Worker / VHT — SayMyDoc Clinical Tool',
    'RE:   PATIENT REFERRAL — ' + (ref.label.toUpperCase()),
    '',
    '── PATIENT INFORMATION ──────────────────────────',
    'Name:        ' + (patient?.name || '[Anonymous]'),
    'Age / Sex:   ' + (patient?.age || '?') + ' years / ' + (patient?.sex || '?'),
    patient?.pregnant ? ('Pregnancy:   ' + patient.pregnant) : null,
    '',
    '── PRESENTING COMPLAINT ─────────────────────────',
    'Chief complaint: ' + (patient?.complaint || result?.symptoms_detected?.slice(0,4).join(', ') || '?'),
    'Symptoms noted:  ' + (result?.symptoms_detected?.join(', ') || '?'),
    '',
    '── PROVISIONAL DIAGNOSIS ────────────────────────',
    'Diagnosis:     ' + (result?.name || '?'),
    'ICD-10:        ' + icd,
    'AI Confidence: ' + (result?.confidence || '?') + '%',
    '',
    '── VITAL SIGNS ──────────────────────────────────',
    'BP:        ' + (vitals?.bp   || 'Not recorded') + ' mmHg' + (bpFlag ? ' ⚠️ ' + bpFlag.label : ''),
    'Temp:      ' + (vitals?.temp || 'Not recorded') + ' °C',
    'HR:        ' + (vitals?.hr   || 'Not recorded') + ' bpm',
    'SpO2:      ' + (vitals?.spo2 || 'Not recorded') + ' %' + (parseFloat(vitals?.spo2) < 94 ? ' ⚠️ LOW' : ''),
    'Weight:    ' + (vitals?.wt   || 'Not recorded') + ' kg',
    'Resp Rate: ' + (vitals?.rr   || 'Not recorded') + ' /min',
    vitals?.muac ? ('MUAC:      ' + vitals.muac + ' mm' + (muacClass ? ' (' + muacClass.label + ')' : '')) : null,
    avpuScore ? ('AVPU:      ' + avpuScore) : null,
    '',
    '── REFERRAL URGENCY ─────────────────────────────',
    'Level:  ' + ref.label,
    'Action: ' + ref.desc,
    '',
    clinicalNotes ? ('── CLINICAL NOTES ───────────────────────────────\n' + clinicalNotes) : null,
    clinicalNotes ? '' : null,
    'Please assess, investigate, and manage accordingly.',
    'This referral was generated with SayMyDoc AI clinical decision support.',
    'This is a clinical aid — the referring health worker takes responsibility for clinical judgment.',
    '',
    'Yours sincerely,',
    '',
    '________________________________   Date: ' + today,
    'Health Worker Signature / Stamp',
  ].filter(l => l !== null).join('\n')

  const shareLetter = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Referral — ' + (patient?.name || 'Patient'), text: lines }); return } catch { /* best-effort: failure is fine */ }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(lines)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="label-text mb-1.5">RECEIVING FACILITY</p>
        <input
          className="w-full bg-midnight border border-white/10 rounded-xl px-3 py-2 text-cream text-xs focus:outline-none focus:border-blue-500 placeholder-mist/40"
          placeholder="e.g. Mulago National Referral Hospital"
          value={facility}
          onChange={e => onFacilityChange(e.target.value)}
        />
      </div>
      <p className="label-text">REFERRAL LETTER PREVIEW</p>
      <div className="bg-midnight rounded-xl p-3 font-mono text-[10px] text-cream/80 leading-relaxed whitespace-pre-wrap border border-white/5 max-h-64 overflow-y-auto">
        {lines}
      </div>
      <button onClick={shareLetter}
        className={`w-full border font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all ${copied ? 'bg-emerald-600/20 border-emerald-600/30 text-emerald-300' : 'bg-blue-600/20 border-blue-600/30 text-blue-300'}`}>
        <FileText size={13} />
        {copied ? '✅ Copied to clipboard!' : navigator.share ? '📤 Share Referral Letter' : '📋 Copy Referral Letter'}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION HISTORY
// ─────────────────────────────────────────────────────────────────────────────
function SessionHistory({ userId }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!userId) return
    getSessions(userId, 30).then(s => {
      setSessions(s.filter(x => x.patient))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [userId])

  const exportCSV = () => {
    const headers = 'Date,Patient Name,Age,Sex,Diagnosis,ICD-10,Confidence,Referral Level'
    const rows = sessions.map(s => [
      new Date(s.timestamp).toLocaleDateString('en-GB'),
      s.patient?.name || 'Anonymous',
      s.patient?.age || '?',
      s.patient?.sex || '?',
      (s.primary_condition||'').replace(/_/g,' '),
      ICD10_MAP[s.primary_condition] || '---',
      (s.confidence || '?') + '%',
      CONDITIONS[s.primary_condition]?.severity_class || '?',
    ].join(','))
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `sessions-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  if (loading) return <div className="text-mist text-xs text-center py-8">Loading sessions...</div>
  if (!sessions.length) return (
    <div className="text-center py-12">
      <ClipboardList size={28} className="text-mist/40 mx-auto mb-2" />
      <p className="text-mist text-xs">No clinical sessions saved yet</p>
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-cream text-xs font-semibold">{sessions.length} sessions recorded</p>
          <p className="text-mist text-[10px]">Today: {sessions.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString()).length} patients seen</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 bg-blue-600/20 border border-blue-600/30 text-blue-300 text-[10px] font-semibold px-3 py-1.5 rounded-xl">
          <Download size={11}/> Export CSV
        </button>
      </div>
      <div className="space-y-2">
        {sessions.map((s, i) => (
          <div key={s.id} className="bg-midnight rounded-2xl overflow-hidden">
            <button className="w-full flex items-center gap-3 px-3 py-2.5" onClick={() => setExpanded(expanded === i ? null : i)}>
              <div className="w-7 h-7 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 text-[10px] font-bold">{(s.patient?.sex||'?')[0]?.toUpperCase()}</span>
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-cream text-xs font-semibold truncate">{s.patient?.name || 'Unknown'}</p>
                <p className="text-mist text-[10px]">{(s.primary_condition||'').replace(/_/g,' ')} · {new Date(s.timestamp).toLocaleDateString('en-GB')}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-emerald-400 text-[10px] font-bold">{s.confidence}%</span>
                {expanded === i ? <ChevronUp size={12} className="text-mist"/> : <ChevronDown size={12} className="text-mist"/>}
              </div>
            </button>
            {expanded === i && s.result && (
              <div className="px-3 pb-3 border-t border-white/5 pt-2 space-y-1">
                <p className="text-cream text-xs"><span className="text-mist">Diagnosis: </span>{s.result.name}</p>
                <p className="text-cream text-xs"><span className="text-mist">ICD-10: </span>{ICD10_MAP[s.primary_condition] || '---'}</p>
                <p className="text-cream text-xs"><span className="text-mist">Symptoms: </span>{(s.symptoms||[]).slice(0,4).join(', ')}</p>
                <p className="text-cream text-xs"><span className="text-mist">Patient: </span>{s.patient?.name}, {s.patient?.age}y, {s.patient?.sex}</p>
                {s.vitals && Object.values(s.vitals).some(Boolean) && (
                  <p className="text-cream text-xs"><span className="text-mist">Vitals: </span>
                    {s.vitals.bp ? `BP ${s.vitals.bp} ` : ''}{s.vitals.temp ? `T ${s.vitals.temp}°C ` : ''}{s.vitals.spo2 ? `SpO2 ${s.vitals.spo2}% ` : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CLINICAL RESULT CARD (enhanced with all new tabs)
// ─────────────────────────────────────────────────────────────────────────────
function ClinicalResultCard({ result, patient, vitals }) {
  const icd = ICD10_MAP[result.condition] || '---'
  const [section, setSection] = useState('summary')
  const [facility, setFacility] = useState('')
  const [notes, setNotes] = useState('')
  const refLevel = CONDITIONS[result.condition]?.severity_class || 'moderate'
  const ref = REFERRAL_LEVELS[refLevel] || REFERRAL_LEVELS.moderate
  const bpFlag = interpretBP(vitals?.bp)

  const tabs = [
    { id:'summary',    label:'Clinical' },
    { id:'management', label:'Rx Plan' },
    { id:'tools',      label:'Tools' },
    { id:'referral',   label:'Referral' },
    { id:'soap',       label:'SOAP' },
    { id:'letter',     label:'Letter' },
  ]

  return (
    <div className="w-full space-y-3 animate-slide-up">
      {/* Diagnosis header */}
      <div className="bg-charcoal rounded-3xl p-4">
        <div className="mb-3">
          <p className="label-text mb-1">PRIMARY DIAGNOSIS</p>
          <h3 className="text-cream font-display font-bold text-xl">{result.name}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-lg">ICD-10: {icd}</span>
            <span className="bg-emerald-600/20 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-lg">{result.confidence}% confidence</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${ref.color} ${ref.bg} ${ref.border}`}>{ref.label}</span>
          </div>
        </div>

        {/* Vital alerts inline */}
        {(bpFlag || (parseFloat(vitals?.spo2) < 94) || (parseFloat(vitals?.temp) >= 38)) && (
          <div className="space-y-1 mb-3">
            {bpFlag && <div className={`rounded-xl px-3 py-1.5 flex items-center gap-2 ${bpFlag.bg}`}><AlertCircle size={11} className={bpFlag.color}/><span className={`text-xs font-bold ${bpFlag.color}`}>{bpFlag.label}</span></div>}
            {parseFloat(vitals?.spo2) < 94 && <div className="rounded-xl px-3 py-1.5 flex items-center gap-2 bg-orange-900/20"><AlertCircle size={11} className="text-orange-400"/><span className="text-xs font-bold text-orange-400">SpO2 low — consider oxygen</span></div>}
          </div>
        )}

        {result.all_candidates?.length > 1 && (
          <div className="border-t border-white/5 pt-3">
            <p className="label-text mb-2">DIFFERENTIAL DIAGNOSIS</p>
            {result.all_candidates.slice(1, 4).map((c, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-mist text-xs w-4">{i + 2}.</span>
                  <span className="text-cream text-xs">{c.name}</span>
                  <span className="text-blue-400 text-xs">({ICD10_MAP[c.key] || '---'})</span>
                </div>
                <span className="text-mist text-xs">{c.confidence}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setSection(t.id)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wide transition-all ${section === t.id ? 'bg-emerald-600 text-white' : 'bg-charcoal text-mist'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-charcoal rounded-3xl p-4">

        {section === 'summary' && (
          <div className="space-y-3">
            <div>
              <p className="label-text mb-1">CLINICAL DESCRIPTION</p>
              <p className="text-cream text-xs leading-relaxed">{result.description}</p>
            </div>
            {result.body_mechanism && (
              <div className="border-t border-white/5 pt-3">
                <p className="label-text mb-1">PATHOPHYSIOLOGY</p>
                <p className="text-cream/80 text-xs leading-relaxed">{result.body_mechanism}</p>
              </div>
            )}
            {result.symptoms_detected?.length > 0 && (
              <div className="border-t border-white/5 pt-3">
                <p className="label-text mb-2">PRESENTING SYMPTOMS</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.symptoms_detected.map(s => (
                    <span key={s} className="bg-midnight text-mist text-xs px-2 py-1 rounded-lg capitalize">{s.replace(/_/g,' ')}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {section === 'management' && result.action_plan && (
          <div className="space-y-4">
            {[
              { key:'immediate',  label:'IMMEDIATE MANAGEMENT', color:'text-red-400' },
              { key:'short_term', label:'SHORT-TERM (1–7 DAYS)', color:'text-yellow-400' },
              { key:'long_term',  label:'LONG-TERM / PREVENTION', color:'text-emerald-400' },
            ].map(({ key, label, color }) => result.action_plan[key]?.length > 0 && (
              <div key={key}>
                <p className={`label-text mb-2 ${color}`}>{label}</p>
                {result.action_plan[key].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2">
                    <span className="text-xs text-mist flex-shrink-0 mt-0.5">{i + 1}.</span>
                    <p className="text-cream text-xs leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            ))}
            {result.home_remedies?.length > 0 && (
              <div className="border-t border-white/5 pt-3">
                <p className="label-text text-green-400 mb-2">SUPPORTIVE CARE</p>
                {result.home_remedies.slice(0,4).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2">
                    <span className="text-green-500 text-xs">🌿</span>
                    <p className="text-cream/80 text-xs leading-relaxed">{r}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {section === 'tools' && (
          <div className="space-y-4">
            <AVPUTool />
            <div className="border-t border-white/5 pt-4">
              <MalariaRDT weightKg={vitals?.wt} age={patient?.age} />
            </div>
            <div className="border-t border-white/5 pt-4">
              <DehydrationTool weightKg={vitals?.wt} />
            </div>
          </div>
        )}

        {section === 'referral' && (
          <div className="space-y-3">
            <div className={`rounded-2xl p-3 border ${ref.bg} ${ref.border}`}>
              <p className="label-text mb-1">REFERRAL LEVEL</p>
              <p className={`font-bold text-sm ${ref.color}`}>{ref.label}</p>
              <p className="text-cream/80 text-xs mt-1">{ref.desc}</p>
            </div>
            {result.see_doctor_if?.length > 0 && (
              <div>
                <p className="label-text mb-2">REFER URGENTLY IF ANY OF THESE APPLY</p>
                {result.see_doctor_if.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2">
                    <AlertTriangle size={11} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    <p className="text-orange-200/80 text-xs leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            )}
            {result.local_context && (
              <div className="bg-emerald-950/40 border border-emerald-800/20 rounded-2xl p-3">
                <p className="text-emerald-400 text-xs font-semibold mb-1">🇺🇬 Uganda Context</p>
                <p className="text-mist text-xs leading-relaxed">{result.local_context}</p>
              </div>
            )}
          </div>
        )}

        {section === 'soap' && (
          <div className="space-y-3">
            <p className="label-text mb-2">AUTO-GENERATED SOAP NOTES</p>
            <div className="bg-midnight rounded-2xl p-3 font-mono text-xs text-cream/80 leading-relaxed space-y-1.5 border border-white/5">
              <p className="text-blue-400 font-bold">SUBJECTIVE</p>
              <p>Patient: {patient?.name || '---'} | {patient?.age || '?'}y {patient?.sex?.[0]?.toUpperCase() || '?'}</p>
              {patient?.pregnant && <p>Pregnancy: {patient.pregnant}</p>}
              <p>CC: {result.symptoms_detected?.slice(0,3).join(', ') || '---'}</p>
              <p className="text-blue-400 font-bold mt-2">OBJECTIVE</p>
              <p>BP: {vitals?.bp||'---'} | T: {vitals?.temp||'---'}°C | HR: {vitals?.hr||'---'} | SpO2: {vitals?.spo2||'---'}%</p>
              <p>Wt: {vitals?.wt||'---'}kg | RR: {vitals?.rr||'---'}/min{vitals?.muac ? ` | MUAC: ${vitals.muac}mm` : ''}</p>
              {(bpFlag || parseFloat(vitals?.spo2) < 94) && (
                <p className="text-orange-400">⚠️ Abnormal vitals noted — see flags above</p>
              )}
              <p className="text-blue-400 font-bold mt-2">ASSESSMENT</p>
              <p>{result.name} (ICD-10: {ICD10_MAP[result.condition] || '---'})</p>
              <p>Confidence: {result.confidence}% | Severity: {CONDITIONS[result.condition]?.severity_class || '---'}</p>
              {result.all_candidates?.length > 1 && <p>DDx: {result.all_candidates.slice(1,3).map(c=>c.name).join(', ')}</p>}
              <p className="text-blue-400 font-bold mt-2">PLAN</p>
              <p>{result.action_plan?.immediate?.[0] || 'See management tab'}</p>
              <p>Referral: {ref.label}</p>
              <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
            </div>
            <div>
              <p className="label-text mb-1.5">ADDITIONAL CLINICAL NOTES</p>
              <textarea
                className="w-full bg-midnight border border-white/10 rounded-xl px-3 py-2.5 text-cream text-xs font-mono leading-relaxed focus:outline-none focus:border-blue-500 resize-none placeholder-mist/30"
                rows={4}
                placeholder="Add clinical observations, examination findings, treatment given..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        {section === 'letter' && (
          <ReferralLetter
            patient={patient}
            result={result}
            vitals={vitals}
            clinicalNotes={notes}
            facility={facility}
            onFacilityChange={setFacility}
          />
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPING INDICATOR
// ─────────────────────────────────────────────────────────────────────────────
function TypingDots() {
  return <div className="flex gap-1.5 items-center p-1"><div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/></div>
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HEALTH WORKER PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function HealthWorker() {
  const { user } = useApp()
  const { lang, tr } = useLang()
  const nav = useNavigate()

  // Tab state
  const [activeTab, setActiveTab] = useState('assess')

  // Assess state
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [done, setDone] = useState(false)
  const [patient, setPatient] = useState({ name:'', age:'', sex:'', complaint:'', pregnant:'', muac:'' })
  const [vitals, setVitals] = useState({})
  const [showPatientForm, setShowPatientForm] = useState(true)
  const [showVitals, setShowVitals] = useState(false)

  // Queue state
  const [queue, setQueue] = useState([])
  const [queueForm, setQueueForm] = useState({ name:'', age:'', sex:'', complaint:'' })

  const sessionRef = useRef(null)
  const bottomRef = useRef(null)

  const addMsg = useCallback((role, content, type = 'text') => {
    setMessages(m => [...m, { role, content, type, id: Date.now() + Math.random() }])
  }, [])

  const handleResponse = useCallback(async (response) => {
    setTyping(false)
    if (!response) return
    if (response.type === 'emergency') {
      addMsg('ai', response.message, 'emergency')
      setDone(true)
      return
    }
    if (response.type === 'follow_up') {
      addMsg('ai', { question:response.question, answers:response.answers, question_key:response.question_key }, 'follow_up')
      return
    }
    if (response.type === 'condition_select') {
      addMsg('ai', { message: response.message, candidates: response.candidates }, 'condition_select')
      return
    }
    if (response.type === 'result') {
      await saveSession({
        user_id: user?.id,
        primary_condition: response.result.condition,
        confidence: response.result.confidence,
        symptoms: response.result.symptoms_detected,
        result: response.result,
        patient,
        vitals,
        timestamp: Date.now()
      })
      addMsg('ai', response.result, 'hw_result')
      setDone(true)
      return
    }
    if (response.type === 'clarify') addMsg('ai', response.message, 'text')
  }, [addMsg, user, patient, vitals])

  const startSession = useCallback((overridePatient) => {
    const p = overridePatient || patient
    const s = new InferenceSession({ name: p.name || user?.name, age: p.age || user?.age, sex: p.sex || user?.sex, hwMode: true })
    sessionRef.current = s
    setMessages([])
    setDone(false)
    setInput('')

    const intro = `Clinical assessment started — ${p.name || 'Patient'}, ${p.age || '?'}y, ${p.sex || '?'}.`
    addMsg('ai', intro, 'text')

    if (p.complaint?.trim()) {
      setTimeout(() => {
        addMsg('user', p.complaint.trim(), 'text')
        setTyping(true)
        setTimeout(() => { handleResponse(s.process(p.complaint.trim())) }, 700)
      }, 400)
    } else {
      setTimeout(() => { addMsg('ai', 'Describe the presenting complaint.', 'text') }, 400)
    }
  }, [patient, user, addMsg, handleResponse])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, typing])

  const sendMessage = useCallback(async (text) => {
    const t2 = (text || input).trim()
    if (!t2 || !sessionRef.current || typing) return
    setInput('')
    setMessages(m => [...m.filter(msg => msg.type !== 'follow_up' && msg.type !== 'condition_select'), { role:'user', content:t2, type:'text', id: Date.now() + Math.random() }])
    setTyping(true)
    await new Promise(r => setTimeout(r, 700 + Math.random() * 400))
    handleResponse(sessionRef.current.process(t2))
  }, [input, typing, handleResponse])

  const answerFollowUp = useCallback(async (questionKey, answerKey) => {
    if (!sessionRef.current || typing) return
    const label = ANSWER_LABELS[answerKey] || answerKey.replace(/_/g, ' ')
    setMessages(m => [...m.filter(msg => msg.type !== 'follow_up' && msg.type !== 'condition_select'), { role:'user', content:label, type:'text', id: Date.now() + Math.random() }])
    setTyping(true)
    await new Promise(r => setTimeout(r, 500 + Math.random() * 300))
    handleResponse(sessionRef.current.processFollowUpAnswer(questionKey, answerKey))
  }, [typing, handleResponse])

  const selectCondition = useCallback(async (conditionKey) => {
    if (!sessionRef.current || typing) return
    const condName = CONDITIONS[conditionKey]?.name || conditionKey.replace(/_/g, ' ')
    setMessages(m => [...m.filter(msg => msg.type !== 'condition_select'), { role:'user', content:'Selected: ' + condName, type:'text', id: Date.now() + Math.random() }])
    setTyping(true)
    await new Promise(r => setTimeout(r, 600))
    handleResponse(sessionRef.current.selectCondition(conditionKey))
  }, [typing, handleResponse])

  const addToQueue = () => {
    if (!queueForm.name && !queueForm.complaint) return
    setQueue(q => [...q, { ...queueForm, id: Date.now(), time: new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }) }])
    setQueueForm({ name:'', age:'', sex:'', complaint:'' })
  }

  const loadFromQueue = (p) => {
    setPatient({ name:p.name, age:p.age, sex:p.sex, complaint:p.complaint })
    setQueue(q => q.filter(x => x.id !== p.id))
    setActiveTab('assess')
    setShowPatientForm(false)
    startSession({ name:p.name, age:p.age, sex:p.sex, complaint:p.complaint })
  }

  const resetSession = () => {
    setPatient({ name:'', age:'', sex:'', complaint:'', pregnant:'', muac:'' })
    setVitals({})
    setShowPatientForm(true)
    setDone(false)
    setMessages([])
    sessionRef.current = null
  }

  const TABS = [
    { id:'assess',    label:'Assess',                                       badge: null },
    { id:'tools',     label:'Tools',                                        badge: null },
    { id:'protocols', label:'Protocols',                                    badge: null },
    { id:'queue',     label:'Queue',  badge: queue.length > 0 ? queue.length : null },
    { id:'history',   label:'History',                                      badge: null },
  ]

  return (
    <div className="h-full flex flex-col bg-midnight safe-top">

      {/* ── Header ── */}
      <div className="bg-charcoal border-b border-white/5 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => nav(-1)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center active:opacity-70 mr-1">
            <ChevronLeft size={18} className="text-mist"/>
          </button>
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Stethoscope size={18} className="text-white"/>
          </div>
          <div>
            <p className="text-cream font-semibold text-sm">Health Worker Mode</p>
            <p className="text-blue-400 text-xs">Clinical Decision Support</p>
          </div>
        </div>
        {queue.length > 0 && (
          <div className="flex items-center gap-1.5 bg-blue-600/20 border border-blue-600/30 rounded-xl px-2.5 py-1.5">
            <Users size={11} className="text-blue-400"/>
            <span className="text-blue-300 text-xs font-bold">{queue.length} waiting</span>
          </div>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="bg-charcoal/80 border-b border-white/5 flex flex-shrink-0 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-semibold transition-all border-b-2 min-w-0 ${activeTab === tab.id ? 'text-blue-400 border-blue-500' : 'text-mist border-transparent'}`}>
            {tab.label}
            {tab.badge && (
              <span className="bg-blue-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════ ASSESS TAB ════════════════════ */}
      {activeTab === 'assess' && (
        <>
          {showPatientForm && (
            <div className="bg-charcoal/60 border-b border-white/5 px-4 py-3 flex-shrink-0 space-y-2">
              <div className="flex gap-2">
                <input className="input-field flex-1 py-2 text-xs" placeholder="Name / ID" value={patient.name} onChange={e => setPatient(p => ({...p, name:e.target.value}))}/>
                <input className="input-field w-14 py-2 text-xs" placeholder="Age" value={patient.age} onChange={e => setPatient(p => ({...p, age:e.target.value}))}/>
                <select className="input-field w-20 py-2 text-xs" value={patient.sex} onChange={e => setPatient(p => ({...p, sex:e.target.value}))}>
                  <option value="">Sex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              {patient.sex === 'female' && (
                <select className="input-field w-full py-2 text-xs" value={patient.pregnant} onChange={e => setPatient(p => ({...p, pregnant:e.target.value}))}>
                  <option value="">Pregnancy status (optional)</option>
                  <option value="Not pregnant">Not pregnant</option>
                  <option value="Pregnant — 1st trimester">Pregnant — 1st trimester</option>
                  <option value="Pregnant — 2nd trimester">Pregnant — 2nd trimester</option>
                  <option value="Pregnant — 3rd trimester">Pregnant — 3rd trimester</option>
                  <option value="Postpartum (within 6 weeks)">Postpartum (within 6 weeks)</option>
                  <option value="Breastfeeding">Breastfeeding</option>
                </select>
              )}
              <input className="input-field w-full py-2 text-xs" placeholder="Chief complaint (e.g. 'fever and headache for 3 days')" value={patient.complaint} onChange={e => setPatient(p => ({...p, complaint:e.target.value}))}/>
              <button onClick={() => setShowVitals(v => !v)} className="flex items-center gap-1.5 text-mist text-xs">
                {showVitals ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                Record vitals (optional)
              </button>
              {showVitals && <VitalSigns vitals={vitals} onChange={setVitals}/>}
              <button onClick={() => { startSession(); setShowPatientForm(false) }}
                className="w-full btn-primary py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
                <Stethoscope size={14}/> Start Clinical Assessment
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && showPatientForm && (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Stethoscope size={24} className="text-blue-400"/>
                </div>
                <p className="text-cream text-sm font-semibold mb-1">Clinical Assessment Mode</p>
                <p className="text-mist text-xs max-w-xs mx-auto leading-relaxed">Enter patient details above to start. The AI will guide you through a structured diagnostic interview with ICD-10 coding, differentials, and a management plan.</p>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                {msg.role === 'ai' && msg.type === 'text' && <div className="bubble-ai">{msg.content}</div>}
                {msg.role === 'ai' && msg.type === 'emergency' && (
                  <div className="bg-red-900/60 border border-red-500/40 rounded-3xl p-4 mx-1 w-full">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertTriangle size={16} className="text-red-400"/>
                      <p className="text-red-200 font-semibold text-sm">Emergency Flags Detected</p>
                    </div>
                    <p className="text-red-100 text-sm leading-relaxed">{msg.content}</p>
                  </div>
                )}
                {msg.role === 'ai' && msg.type === 'follow_up' && (
                  <div className="animate-slide-up w-full">
                    <div className="bubble-ai mb-2">{msg.content.question}</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.keys(msg.content.answers).map(k => (
                        <button key={k} onClick={() => answerFollowUp(msg.content.question_key, k)}
                          className="bg-blue-600/20 border border-blue-600/30 text-blue-300 text-sm px-4 py-2 rounded-2xl active:scale-95 transition-all font-medium">
                          {ANSWER_LABELS[k] || k.replace(/_/g,' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {msg.role === 'ai' && msg.type === 'condition_select' && (
                  <div className="animate-slide-up w-full">
                    <div className="bubble-ai mb-3">{msg.content.message}</div>
                    <div className="space-y-2">
                      {msg.content.candidates.map(c => (
                        <button key={c.key} onClick={() => selectCondition(c.key)}
                          className="w-full text-left bg-charcoal border border-white/10 rounded-2xl px-4 py-3 active:scale-[0.98] transition-all hover:border-blue-500/40">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-cream text-sm font-semibold">{c.name}</span>
                            <span className="text-blue-400 text-xs font-bold bg-blue-600/20 px-2 py-0.5 rounded-lg">{c.score}%</span>
                          </div>
                          <p className="text-mist text-xs leading-relaxed">{c.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {msg.role === 'ai' && msg.type === 'hw_result' && (
                  <ClinicalResultCard result={msg.content} patient={patient} vitals={vitals}/>
                )}
                {msg.role === 'user' && <div className="bubble-user">{msg.content}</div>}
              </div>
            ))}
            {typing && <div className="flex justify-start"><div className="bubble-ai"><TypingDots/></div></div>}
            <div ref={bottomRef}/>
          </div>

          {!done ? (
            <div className="bg-charcoal border-t border-white/5 px-4 py-3 flex-shrink-0 safe-bottom">
              <div className="flex items-end gap-2">
                <textarea value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Describe presenting complaint..." rows={1}
                  className="flex-1 bg-midnight border border-white/10 rounded-2xl px-4 py-3 text-cream text-sm placeholder-mist/40 focus:outline-none focus:border-blue-500 resize-none leading-relaxed transition-colors"
                  style={{ minHeight:'44px', maxHeight:'100px' }}
                  onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px' }}/>
                <button onClick={() => sendMessage()} disabled={!input.trim() || typing || messages.some(m => m.type === 'condition_select')}
                  className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 flex-shrink-0">
                  <Send size={18} className="text-white"/>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-charcoal border-t border-white/5 px-4 py-3 flex-shrink-0 safe-bottom space-y-2">
              <button onClick={resetSession} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2">
                <RefreshCw size={16}/> New Patient Assessment
              </button>
              {queue.length > 0 && (
                <button onClick={() => setActiveTab('queue')} className="w-full bg-charcoal border border-white/10 text-mist font-semibold py-2.5 rounded-2xl flex items-center justify-center gap-2 text-sm">
                  <Users size={14}/> Next Patient ({queue.length} waiting)
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* ════════════════════ TOOLS TAB ════════════════════ */}
      {activeTab === 'tools' && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="bg-charcoal rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-600/20 rounded-xl flex items-center justify-center">
                <AlertCircle size={16} className="text-red-400"/>
              </div>
              <div>
                <p className="text-cream text-xs font-semibold">Neurological Assessment</p>
                <p className="text-mist text-[10px]">AVPU scale + Glasgow Coma Score</p>
              </div>
            </div>
            <AVPUTool />
          </div>

          <div className="bg-charcoal rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-600/20 rounded-xl flex items-center justify-center">
                <span className="text-red-400 text-sm">🦟</span>
              </div>
              <div>
                <p className="text-cream text-xs font-semibold">Malaria RDT Protocol</p>
                <p className="text-mist text-[10px]">Guided RDT result → treatment</p>
              </div>
            </div>
            <MalariaRDT weightKg={vitals?.wt} age={patient?.age} />
          </div>

          <div className="bg-charcoal rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <Droplets size={16} className="text-blue-400"/>
              </div>
              <div>
                <p className="text-cream text-xs font-semibold">WHO Dehydration Tool</p>
                <p className="text-mist text-[10px]">Assess + calculate ORS volume</p>
              </div>
            </div>
            <DehydrationTool weightKg={vitals?.wt} />
          </div>

          <div className="bg-charcoal rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                <Baby size={16} className="text-emerald-400"/>
              </div>
              <div>
                <p className="text-cream text-xs font-semibold">Paediatric Dose Calculator</p>
                <p className="text-mist text-[10px]">Enter weight to calculate doses</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  className="input-field flex-1 py-2 text-xs"
                  placeholder="Patient weight (kg)"
                  value={vitals?.wt || ''}
                  onChange={e => setVitals(v => ({...v, wt: e.target.value}))}
                />
                <span className="text-mist text-xs">kg</span>
              </div>
              {calcPaedDose(vitals?.wt) ? (
                <div className="space-y-1.5">
                  {Object.entries(calcPaedDose(vitals.wt)).map(([drug, dose]) => (
                    <div key={drug} className="flex justify-between items-start gap-2 bg-midnight rounded-xl px-3 py-2">
                      <span className="text-mist text-[10px] capitalize flex-shrink-0">{drug.replace(/_/g,' ')}</span>
                      <span className="text-cream text-[10px] font-mono text-right">{dose}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-mist text-xs text-center py-4">Enter weight above to see doses</p>
              )}
            </div>
          </div>

          <div className="bg-charcoal rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-600/20 rounded-xl flex items-center justify-center">
                <Activity size={16} className="text-orange-400"/>
              </div>
              <div>
                <p className="text-cream text-xs font-semibold">Vital Signs Assessment</p>
                <p className="text-mist text-[10px]">Record + interpret vital signs</p>
              </div>
            </div>
            <VitalSigns vitals={vitals} onChange={setVitals} />
          </div>
        </div>
      )}

      {/* ════════════════════ PROTOCOLS TAB ════════════════════ */}
      {activeTab === 'protocols' && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <ProtocolsLibrary />
        </div>
      )}

      {/* ════════════════════ QUEUE TAB ════════════════════ */}
      {activeTab === 'queue' && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="bg-charcoal rounded-3xl p-4 space-y-2">
            <p className="label-text mb-1">ADD PATIENT TO QUEUE</p>
            <div className="flex gap-2">
              <input className="input-field flex-1 py-2 text-xs" placeholder="Name / ID" value={queueForm.name} onChange={e => setQueueForm(f => ({...f, name:e.target.value}))}/>
              <input className="input-field w-14 py-2 text-xs" placeholder="Age" value={queueForm.age} onChange={e => setQueueForm(f => ({...f, age:e.target.value}))}/>
              <select className="input-field w-20 py-2 text-xs" value={queueForm.sex} onChange={e => setQueueForm(f => ({...f, sex:e.target.value}))}>
                <option value="">Sex</option>
                <option value="male">M</option>
                <option value="female">F</option>
              </select>
            </div>
            <input className="input-field w-full py-2 text-xs" placeholder="Chief complaint" value={queueForm.complaint} onChange={e => setQueueForm(f => ({...f, complaint:e.target.value}))}/>
            <button onClick={addToQueue} className="w-full bg-blue-600/20 border border-blue-600/30 text-blue-300 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
              <Plus size={13}/> Add to Queue
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="label-text">WAITING PATIENTS ({queue.length})</p>
              {queue.length > 0 && (
                <button onClick={() => setQueue([])} className="text-mist/60 text-[10px]">Clear all</button>
              )}
            </div>
            {queue.length === 0 ? (
              <div className="text-center py-8">
                <Users size={24} className="text-mist/40 mx-auto mb-2"/>
                <p className="text-mist text-xs">No patients in queue</p>
              </div>
            ) : (
              <div className="space-y-2">
                {queue.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 bg-midnight rounded-xl px-3 py-2.5">
                    <div className="w-7 h-7 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-cream text-xs font-semibold truncate">{p.name || 'Unnamed'}</p>
                      <p className="text-mist text-[10px]">{p.age ? p.age + 'y' : '?y'} · {p.sex || '?'} · {p.complaint || 'No complaint'}</p>
                      {p.time && <p className="text-mist/50 text-[9px]">Added {p.time}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => loadFromQueue(p)} className="text-blue-400 text-[10px] font-semibold bg-blue-600/10 border border-blue-600/20 px-2.5 py-1 rounded-lg">
                        Assess
                      </button>
                      <button onClick={() => setQueue(q => q.filter((_,idx) => idx !== i))} className="text-mist/60 p-1">
                        <XCircle size={13}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════ HISTORY TAB ════════════════════ */}
      {activeTab === 'history' && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <SessionHistory userId={user?.id}/>
        </div>
      )}
    </div>
  )
}
