import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import meds from '../knowledge/medications.json'
import { Search, ChevronRight, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info, ChevronLeft } from 'lucide-react'
import AudioReader from '../components/ui/AudioReader.jsx'
import { useLang } from '../context/LangContext.jsx'

const CAT_COLORS = {
  analgesic: '#0284C7', NSAID: '#EA580C', antibiotic: '#16A34A',
  antimalarial: '#7C3AED', rehydration: '#0891B2', proton_pump_inhibitor: '#CA8A04',
  bronchodilator: '#0284C7', anthelmintic: '#16A34A', supplement: '#C9A84C',
  antihistamine: '#EC4899'
}
const CAT_ICONS = {
  analgesic: '💊', NSAID: '💊', antibiotic: '🦠', antimalarial: '🦟',
  rehydration: '💧', proton_pump_inhibitor: '🫁', bronchodilator: '💨',
  anthelmintic: '🐛', supplement: '🌿', antihistamine: '🌸'
}
const AVAIL_COLORS = { OTC: 'badge-emerald', Prescription: 'badge-gold', 'Prescription/OTC': 'badge-mist' }

function MedCard({ med, tr }) {
  const [open, setOpen] = useState(false)
  const color = CAT_COLORS[med.category] || '#00A86B'
  const icon = CAT_ICONS[med.category] || '💊'

  return (
    <div className="bg-charcoal rounded-3xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full p-4 flex items-center gap-3 active:opacity-80 transition-opacity">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: color + '22' }}>
          <span className="text-xl">{icon}</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-cream font-semibold text-sm">{med.name}</p>
          <p className="text-mist text-xs">{med.brand_names.slice(0, 2).join(' • ')}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className={AVAIL_COLORS[med.availability] || 'badge-mist'}
              style={{ display: 'inline-flex', alignItems: 'center', fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: med.availability === 'OTC' ? '#00A86B22' : '#C9A84C22', color: med.availability === 'OTC' ? '#4ade80' : '#C9A84C' }}>
              {med.availability}
            </span>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-mist flex-shrink-0" /> : <ChevronRight size={16} className="text-mist flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-white/5 animate-slide-up">
          {/* Uses */}
          <div className="px-4 py-3 border-b border-white/5">
            <p className="label-text mb-2">{tr('meds.used.for')}</p>
            <div className="flex flex-wrap gap-1.5">
              {med.uses.map(u => (
                <span key={u} className="bg-midnight text-mist text-xs px-2.5 py-1 rounded-xl">{u}</span>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="px-4 py-3 border-b border-white/5">
            <p className="label-text mb-2">{tr('meds.how.works')}</p>
            <p className="text-cream/80 text-xs leading-relaxed">{med.how_it_works}</p>
          </div>

          {/* Doses */}
          <div className="px-4 py-3 border-b border-white/5">
            <p className="label-text mb-2">{tr('meds.dosage')}</p>
            <div className="space-y-2">
              <div className="bg-midnight rounded-2xl p-3">
                <p className="text-emerald-400 text-xs font-semibold mb-1">{tr('meds.adult')}</p>
                <p className="text-cream text-xs leading-relaxed">{med.adult_dose}</p>
              </div>
              <div className="bg-midnight rounded-2xl p-3">
                <p className="text-blue-400 text-xs font-semibold mb-1">{tr('meds.child')}</p>
                <p className="text-cream text-xs leading-relaxed">{med.child_dose}</p>
              </div>
            </div>
          </div>

          {/* Warnings */}
          <div className="px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={12} className="text-orange-400" />
              <p className="label-text">{tr('meds.warnings')}</p>
            </div>
            <ul className="space-y-1.5">
              {med.key_warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-orange-400 text-xs flex-shrink-0 mt-0.5">⚠</span>
                  <p className="text-orange-200/80 text-xs leading-relaxed">{w}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Safety + Availability */}
          <div className="px-4 py-3">
            <div className="flex gap-3 mb-3">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${med.safe_in_pregnancy ? 'bg-emerald-600/15 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                {med.safe_in_pregnancy ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                {med.safe_in_pregnancy ? tr('meds.safe.pregnancy') : tr('meds.avoid.pregnancy')}
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${med.safe_in_children ? 'bg-emerald-600/15 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                {med.safe_in_children ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                {med.safe_in_children ? tr('meds.safe.children') : tr('meds.adults.only')}
              </div>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-800/20 rounded-2xl p-3">
              <p className="text-emerald-400 text-xs font-semibold mb-1">🇺🇬 {tr('meds.availability')}</p>
              <p className="text-mist text-xs leading-relaxed">{med.local_availability}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MedicationRef() {
  const { lang, tr } = useLang()
  const [search, setSearch] = useState('')
  const [selectedMed, setSelectedMed] = useState(null)
  const nav = useNavigate()

  const filtered = useMemo(() => {
    if (!search) return meds.medications
    const q = search.toLowerCase()
    return meds.medications.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.brand_names.some(b => b.toLowerCase().includes(q)) ||
      m.uses.some(u => u.toLowerCase().includes(q))
    )
  }, [search])

  const audioText = filtered.slice(0, 10).map(m =>
    `${m.name}. Also known as ${m.brand_names.slice(0,2).join(' or ')}. Used for: ${m.uses.slice(0,3).join(', ')}. Adult dose: ${m.adult_dose || 'see label'}. Key warning: ${(m.warnings || [])[0] || 'none'}.`
  ).join('\n\n')

  return (
    <div className="h-full flex flex-col bg-midnight safe-top">
      <div className="bg-charcoal border-b border-white/5 px-5 pt-8 pb-4 flex-shrink-0">
        <button onClick={() => nav(-1)} className="flex items-center gap-1 text-emerald-500 text-sm font-medium mb-3 active:opacity-70">
          <ChevronLeft size={16} />Back
        </button>
        <h1 className="font-display font-bold text-2xl text-cream mb-1">{tr('meds.title')}</h1>
        <p className="text-mist text-sm mb-3">{tr('meds.subtitle')} — uses, doses, warnings</p>
        <AudioReader text={audioText} label="Listen to medication info" compact />
        <div className="relative mt-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist/50" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tr('meds.search')}
            className="w-full bg-midnight border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-cream text-sm placeholder-mist/40 focus:outline-none focus:border-emerald-600 transition-colors" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-3">
        <div className="bg-orange-950/30 border border-orange-800/20 rounded-2xl p-3 flex items-start gap-2">
          <Info size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-orange-200/80 text-xs leading-relaxed">This is a reference guide. Always consult a qualified healthcare professional before starting or stopping any medication.</p>
        </div>
        {/* Tracker CTA */}
        <button onClick={() => nav('/tracker')}
          className="w-full bg-gradient-to-r from-emerald-950/60 to-emerald-900/30 border border-emerald-700/40 rounded-2xl p-4 flex items-center gap-3 active:scale-98 transition-all">
          <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl">💊</span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-emerald-300 font-semibold text-sm">Medication Reminder Tracker</p>
            <p className="text-emerald-400/60 text-xs">Set reminders, log doses, track your adherence streak</p>
          </div>
          <ChevronRight size={16} className="text-emerald-500 flex-shrink-0" />
        </button>

        <p className="label-text">{filtered.length} MEDICATION{filtered.length !== 1 ? 'S' : ''}</p>
        {filtered.map(med => <MedCard key={med.id} med={med} tr={tr} />)}
      </div>
    </div>
  )
}
