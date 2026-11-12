import React,{useState}from'react'
import{useNavigate}from'react-router-dom'
import{useLang}from'../../context/LangContext.jsx'
import{ChevronRight,AlertCircle,CheckCircle,Leaf,Pill,FlaskConical}from'lucide-react'

const CAT_COLORS={
  neurological:'#7C3AED',infectious:'#DC2626',cardiovascular:'#EA580C',
  gastrointestinal:'#CA8A04',respiratory:'#0284C7',mental_health:'#0891B2',
  urinary:'#16A34A',musculoskeletal:'#B45309',skin:'#9333EA',
  endocrine:'#0D9488',reproductive:'#DB2777',haematological:'#7C3AED',
}
const CAT_ICONS={
  neurological:'🧠',infectious:'🦠',cardiovascular:'❤️',gastrointestinal:'🫁',
  respiratory:'💨',mental_health:'💭',urinary:'💧',musculoskeletal:'🦴',
  skin:'🩹',endocrine:'⚗️',reproductive:'🌸',haematological:'🩸',
}

function ConfBar({value,color='#00A86B'}){
  return(
    <div className="confidence-bar mt-1">
      <div className="confidence-fill" style={{width:`${value}%`,background:color}}/>
    </div>
  )
}

function MedsTab({meds}){
  if(!meds||meds.length===0)return(
    <p className="text-mist text-sm">No specific medication data available. Please consult a health worker.</p>
  )
  return(
    <div className="space-y-3">
      {meds.map((med,i)=>(
        <div key={med.id||i} className="bg-black/20 rounded-2xl p-3 border border-white/5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-cream text-xs font-bold">{med.name}</p>
              {med.brand_names?.length>0&&(
                <p className="text-mist/70 text-[10px]">{med.brand_names.slice(0,3).join(' · ')}</p>
              )}
            </div>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-700/30 flex-shrink-0 ml-2">
              {med.local_availability||med.availability||'Uganda'}
            </span>
          </div>
          {med.adult_dose&&(
            <p className="text-amber-300/90 text-[11px] mt-1">
              💊 <span className="font-medium">Adult:</span> {med.adult_dose}
            </p>
          )}
          {med.child_dose&&(
            <p className="text-sky-300/90 text-[11px] mt-0.5">
              👶 <span className="font-medium">Child:</span> {med.child_dose}
            </p>
          )}
          {med.key_warnings?.length>0&&(
            <p className="text-orange-300/80 text-[10px] mt-1 leading-relaxed">
              ⚠️ {med.key_warnings[0]}
            </p>
          )}
          <div className="flex gap-2 mt-1.5">
            {med.safe_in_pregnancy!==undefined&&(
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                med.safe_in_pregnancy
                  ?'bg-emerald-900/30 text-emerald-400'
                  :'bg-red-900/30 text-red-400'
              }`}>
                {med.safe_in_pregnancy?'✅ Safe in pregnancy':'❌ Avoid in pregnancy'}
              </span>
            )}
          </div>
        </div>
      ))}
      <p className="text-mist/40 text-[10px] leading-relaxed pt-1">
        Always confirm dosage with a qualified health worker before taking medication.
      </p>
    </div>
  )
}

function RemediesTab({remedies,homeRemedies}){
  const hasRich=remedies&&remedies.length>0
  const hasHome=homeRemedies&&homeRemedies.length>0
  if(!hasRich&&!hasHome)return(
    <p className="text-mist text-sm">No specific home remedies for this condition.</p>
  )
  return(
    <div className="space-y-3">
      {hasRich&&remedies.map((r,i)=>(
        <div key={r.id||i} className="bg-black/20 rounded-2xl p-3 border border-white/5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-cream text-xs font-bold">{r.name}</p>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2 ${
              r.evidence_rating==='strong'
                ?'bg-emerald-900/40 text-emerald-400 border border-emerald-700/30'
                :r.evidence_rating==='moderate'
                ?'bg-yellow-900/30 text-yellow-400 border border-yellow-700/20'
                :'bg-white/5 text-mist border border-white/10'
            }`}>
              {r.evidence_label||r.evidence_rating||'Traditional'}
            </span>
          </div>
          {r.local_names?.length>0&&(
            <p className="text-mist/60 text-[10px] mb-1">{r.local_names.slice(0,2).join(' / ')}</p>
          )}
          {Array.isArray(r.how_to_use)&&r.how_to_use.length>0?(
            <p className="text-mist text-[11px] leading-relaxed">{r.how_to_use[0]}</p>
          ):r.how_to_use?(
            <p className="text-mist text-[11px] leading-relaxed">{r.how_to_use}</p>
          ):null}
          {r.safety&&(
            <p className="text-orange-300/70 text-[10px] mt-1">⚠️ {r.safety}</p>
          )}
        </div>
      ))}
      {hasHome&&(
        <div>
          {hasRich&&<p className="text-mist/50 text-[10px] uppercase tracking-wider mb-2 mt-1">Also</p>}
          <ul className="space-y-2">
            {homeRemedies.map((r,i)=>(
              <li key={i} className="flex items-start gap-2">
                <Leaf size={13} className="text-emerald-500 flex-shrink-0 mt-0.5"/>
                <p className="text-cream text-xs leading-relaxed">{r}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function ConditionResult({result}){
  const nav=useNavigate()
  const{tr}=useLang()
  const[tab,setTab]=useState('action')
  const color=CAT_COLORS[result.category]||'#00A86B'
  const icon=CAT_ICONS[result.category]||'🩺'
  const conf=result.confidence||0
  const hasMeds=(result.suggested_medications||[]).length>0
  const hasRemedies=(result.suggested_remedies||[]).length>0||(result.home_remedies||[]).length>0

  const TABS=[
    {id:'action', label:tr('cond.action')},
    {id:'meds',   label:'💊 Meds'},
    {id:'body',   label:tr('cond.why')},
    {id:'remedies',label:tr('cond.remedies')},
  ]

  return(
    <div className="w-full animate-slide-up space-y-3">
      {/* Condition card */}
      <div className="bg-charcoal rounded-3xl overflow-hidden border border-white/5">
        {/* Header */}
        <div className="p-4" style={{background:`${color}18`}}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{background:`${color}30`}}>
                <span className="text-xl">{icon}</span>
              </div>
              <div>
                <p className="text-mist text-xs font-medium uppercase tracking-wider">{tr('ui.most.likely')}</p>
                <h3 className="text-cream font-display font-bold text-lg leading-tight">{result.name}</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-2xl" style={{color}}>{conf}%</p>
              <p className="text-mist text-xs">{tr('ui.confidence')}</p>
            </div>
          </div>
          <ConfBar value={conf} color={color}/>
        </div>

        {/* Description */}
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-mist text-sm leading-relaxed">{result.description}</p>
        </div>

        {/* Other candidates */}
        {result.all_candidates?.length>1&&(
          <div className="px-4 py-3 border-b border-white/5">
            <p className="label-text mb-2">{tr('ui.also.considered')}</p>
            <div className="space-y-2">
              {result.all_candidates.slice(1,3).map(c=>(
                <div key={c.key} className="flex items-center justify-between">
                  <p className="text-mist text-xs">{c.name}</p>
                  <div className="flex items-center gap-2 w-24">
                    <ConfBar value={c.confidence}/>
                    <p className="text-mist text-xs w-8 text-right">{c.confidence}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex-shrink-0 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                tab===t.id?'text-emerald-500 border-b-2 border-emerald-500':'text-mist'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4">
          {tab==='action'&&result.action_plan&&(
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-400"/>
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wide">{tr('ui.do.right.now')}</p>
                </div>
                <ul className="space-y-2">
                  {result.action_plan.immediate?.slice(0,3).map((item,i)=>(
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-emerald-500 flex-shrink-0 mt-0.5"/>
                      <p className="text-cream text-xs leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"/>
                  <p className="text-xs font-bold text-yellow-400 uppercase tracking-wide">{tr('ui.short.term')}</p>
                </div>
                <ul className="space-y-2">
                  {result.action_plan.short_term?.slice(0,3).map((item,i)=>(
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-yellow-500 flex-shrink-0 mt-0.5"/>
                      <p className="text-cream text-xs leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {tab==='meds'&&(
            <MedsTab meds={result.suggested_medications||[]}/>
          )}

          {tab==='body'&&(
            <div>
              <p className="text-cream text-sm leading-relaxed">{result.body_mechanism}</p>
              {result.local_context&&(
                <div className="mt-3 bg-emerald-950/40 border border-emerald-800/20 rounded-2xl p-3">
                  <p className="text-emerald-400 text-xs font-semibold mb-1">🇺🇬 Uganda Context</p>
                  <p className="text-mist text-xs leading-relaxed">{result.local_context}</p>
                </div>
              )}
            </div>
          )}

          {tab==='remedies'&&(
            <RemediesTab
              remedies={result.suggested_remedies||[]}
              homeRemedies={result.home_remedies||[]}
            />
          )}
        </div>

        {/* See doctor warning */}
        {result.see_doctor_if?.length>0&&(
          <div className="mx-4 mb-4 bg-orange-950/30 border border-orange-800/20 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircle size={13} className="text-orange-400"/>
              <p className="text-orange-400 text-xs font-bold uppercase tracking-wide">{tr('cond.see.doctor.if')}</p>
            </div>
            <ul className="space-y-1">
              {result.see_doctor_if.slice(0,3).map((item,i)=>(
                <li key={i} className="text-orange-200/70 text-xs leading-relaxed">• {item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Learn more */}
        <div className="px-4 pb-4">
          <button onClick={()=>nav(`/condition/${result.condition}`)}
            className="w-full bg-emerald-600/15 border border-emerald-600/20 rounded-2xl py-3 flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold active:scale-95 transition-all">
            {tr('cond.learn.more')} {result.name} <ChevronRight size={16}/>
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-mist/50 text-[10px] text-center leading-relaxed px-2">
        SayMyDoc provides health guidance, not medical diagnosis. Always consult a qualified healthcare professional for medical advice.
      </p>
    </div>
  )
}
