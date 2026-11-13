import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import remediesData from '../knowledge/remedies.json'
import { Leaf, ChevronRight, ChevronDown, Star, Info, ChevronLeft } from 'lucide-react'
import AudioReader from '../components/ui/AudioReader.jsx'
import { useLang } from '../context/LangContext.jsx'

const EVIDENCE_CONFIG = {
  strong:   { label: 'Well-researched', color: '#00A86B', bg: '#00A86B22', stars: 3 },
  moderate: { label: 'Good evidence',   color: '#C9A84C', bg: '#C9A84C22', stars: 2 },
  limited:  { label: 'Traditional use', color: '#8BA99A', bg: '#8BA99A22', stars: 1 },
}

function EvidenceBadge({ rating, label }) {
  const cfg = EVIDENCE_CONFIG[rating] || EVIDENCE_CONFIG.limited
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
      style={{ background: cfg.bg }}>
      <div className="flex gap-0.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Star key={i} size={9} fill={i < cfg.stars ? cfg.color : 'transparent'}
            stroke={cfg.color} strokeWidth={2} />
        ))}
      </div>
      <span className="text-xs font-semibold" style={{ color: cfg.color }}>{label || cfg.label}</span>
    </div>
  )
}

// Normalize a remedy so both old and new field schemas work
function normalizeRemedy(remedy) {
  return {
    ...remedy,
    helps_with: remedy.helps_with || remedy.traditional_uses || [],
    how_to_use: remedy.how_to_use || remedy.preparation || [],
    evidence_rating: remedy.evidence_rating || (
      (remedy.evidence_level || '').toLowerCase().includes('strong') ? 'strong' :
      (remedy.evidence_level || '').toLowerCase().includes('good') ? 'moderate' : 'limited'
    ),
    local_names: Array.isArray(remedy.local_names) ? remedy.local_names : [],
  }
}

function RemedyCard({ remedy: rawRemedy, tr }) {
  const remedy = normalizeRemedy(rawRemedy)
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-charcoal rounded-3xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full p-4 flex items-center gap-3 active:opacity-80 transition-opacity">
        <div className="w-11 h-11 rounded-2xl bg-emerald-600/15 flex items-center justify-center flex-shrink-0">
          <Leaf size={20} className="text-emerald-500" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-cream font-semibold text-sm">{remedy.name}</p>
          <p className="text-mist text-xs">{remedy.local_names.slice(0, 2).join(' • ')}</p>
          <div className="mt-1.5">
            <EvidenceBadge rating={remedy.evidence_rating} label={remedy.evidence_label} />
          </div>
        </div>
        {open ? <ChevronDown size={16} className="text-mist flex-shrink-0" /> : <ChevronRight size={16} className="text-mist flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-white/5 animate-slide-up">
          {/* Helps with */}
          <div className="px-4 py-3 border-b border-white/5">
            <p className="label-text mb-2">{tr('remedy.helps.with')}</p>
            <div className="flex flex-wrap gap-1.5">
              {remedy.helps_with.map(h => (
                <span key={h} className="bg-emerald-600/15 text-emerald-400 text-xs px-2.5 py-1 rounded-xl font-medium">{h}</span>
              ))}
            </div>
          </div>

          {/* Active compounds */}
          <div className="px-4 py-3 border-b border-white/5">
            <p className="label-text mb-2">{tr('remedy.compounds')}</p>
            <p className="text-cream/80 text-xs leading-relaxed">{remedy.active_compounds}</p>
          </div>

          {/* How to use */}
          <div className="px-4 py-3 border-b border-white/5">
            <p className="label-text mb-2">{tr('remedy.how.to.use')}</p>
            <ul className="space-y-2">
              {(Array.isArray(remedy.how_to_use) ? remedy.how_to_use : [remedy.how_to_use]).map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-400 text-xs font-bold">{i + 1}</span>
                  </div>
                  <p className="text-cream text-xs leading-relaxed">{step}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Safety */}
          {remedy.safety && (
            <div className="px-4 py-3 border-b border-white/5">
              <p className="label-text mb-2">{tr('remedy.safety')}</p>
              <p className="text-orange-200/80 text-xs leading-relaxed">{remedy.safety}</p>
            </div>
          )}

          {/* Science note */}
          {remedy.science_note && (
            <div className="px-4 py-3">
              <div className="bg-blue-950/30 border border-blue-800/20 rounded-2xl p-3">
                <p className="text-blue-400 text-xs font-semibold mb-1">🔬 {tr('remedy.science')}</p>
                <p className="text-blue-100/70 text-xs leading-relaxed">{remedy.science_note}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function RemedyLibrary() {
  const { tr } = useLang()
  const nav = useNavigate()
  const audioText = remediesData.remedies.map(r => {
    const norm = normalizeRemedy(r)
    return `${norm.name}. ${norm.description || ''}. Used for: ${(norm.helps_with || []).join(', ')}. How to use: ${Array.isArray(norm.how_to_use) ? norm.how_to_use.join('. ') : norm.how_to_use || ''}`
  }).join('\n\n')
  return (
    <div className="h-full flex flex-col bg-midnight safe-top">
      <div className="bg-charcoal border-b border-white/5 px-5 pt-8 pb-5 flex-shrink-0">
        <button onClick={() => nav(-1)} className="flex items-center gap-1 text-emerald-500 text-sm font-medium mb-3 active:opacity-70">
          <ChevronLeft size={16} />Back
        </button>
        <div className="flex items-center gap-2 mb-1">
          <Leaf size={20} className="text-emerald-500" />
          <h1 className="font-display font-bold text-2xl text-cream">{tr('remedy.title')}</h1>
        </div>
        <p className="text-mist text-sm mb-3">{tr('remedy.subtitle')} — evidence-rated</p>
        <div className="flex gap-2 text-xs mb-3">
          {[
            { stars: 3, label: 'Well-researched', color: '#00A86B' },
            { stars: 2, label: 'Good evidence', color: '#C9A84C' },
            { stars: 1, label: 'Traditional', color: '#8BA99A' },
          ].map(({ stars, label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="flex">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} size={8} fill={color} stroke={color} />
                ))}
              </div>
              <span style={{ color }} className="font-medium">{label}</span>
            </div>
          ))}
        </div>
        <AudioReader text={audioText} label="Listen to remedy guide" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-3">
        <div className="bg-emerald-950/40 border border-emerald-800/20 rounded-2xl p-3 flex items-start gap-2">
          <Info size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-emerald-200/70 text-xs leading-relaxed">Natural remedies can complement but should not replace medical treatment for serious conditions. Always tell your doctor about remedies you are using.</p>
        </div>
        <p className="label-text">{remediesData.remedies.length} REMEDIES</p>
        {remediesData.remedies.map(r => <RemedyCard key={r.id} remedy={r} tr={tr} />)}
      </div>
    </div>
  )
}
