import React,{useState}from'react'
import{useParams,useNavigate}from'react-router-dom'
import{MERGED_KB}from'../engine/KnowledgeMerger.js'
const CONDITIONS=MERGED_KB.conditions
import{ChevronLeft,AlertCircle,CheckCircle,Leaf,Info}from'lucide-react'
import{useLang}from'../context/LangContext.jsx'
import AudioReader from'../components/ui/AudioReader.jsx'

const CAT_COLORS={neurological:'#7C3AED',infectious:'#DC2626',cardiovascular:'#EA580C',gastrointestinal:'#CA8A04',respiratory:'#0284C7',mental_health:'#0891B2',urinary:'#16A34A'}

export default function ConditionDetail(){
  const{key}=useParams()
  const nav=useNavigate()
  const{tr}=useLang()
  const cond=CONDITIONS[key]
  const[tab,setTab]=useState('overview')
  if(!cond)return<div className="h-full flex items-center justify-center"><button onClick={()=>nav(-1)} className="text-emerald-500 text-sm mr-4">← Back</button><p className="text-mist">Condition not found</p></div>
  const color=CAT_COLORS[cond.category]||'#00A86B'
  const audioText=`${cond.name}. ${cond.description||''}. ${cond.body_mechanism||''}. Symptoms include: ${(cond.required_symptoms||[]).concat(cond.supporting_symptoms||[]).slice(0,6).join(', ')}. Action plan: ${(cond.action_plan?.immediate||[]).slice(0,3).join('. ')}. See a doctor if: ${(cond.see_doctor_if||[]).slice(0,3).join('. ')}.`

  return(
    <div className="h-full flex flex-col bg-midnight safe-top">
      <div className="px-5 pt-8 pb-4 flex-shrink-0" style={{background:`${color}18`}}>
        <button onClick={()=>nav(-1)} className="flex items-center gap-1.5 text-sm mb-4" style={{color}}>
          <ChevronLeft size={16}/>Back
        </button>
        <h1 className="font-display font-bold text-2xl text-cream mb-1">{cond.name}</h1>
        <span className="badge-mist capitalize">{cond.category?.replace('_',' ')}</span>
        <div className="mt-3">
          <AudioReader text={audioText} label={`Listen: ${cond.name}`} compact />
        </div>
      </div>

      <div className="flex border-b border-white/5 bg-charcoal flex-shrink-0 overflow-x-auto">
        {['overview','action','remedies','warning'].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap transition-colors ${tab===t?'text-emerald-500 border-b-2 border-emerald-500':'text-mist'}`}>
            {t==='action'?tr('cond.action'):t==='remedies'?tr('cond.remedies'):t==='warning'?'See Doctor':t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 pb-24 space-y-4">
        {tab==='overview'&&(
          <>
            <div className="bg-charcoal rounded-3xl p-4">
              <p className="label-text mb-2">{tr('cond.what')}</p>
              <p className="text-cream text-sm leading-relaxed">{cond.description}</p>
            </div>
            <div className="bg-charcoal rounded-3xl p-4">
              <p className="label-text mb-2">{tr('cond.why')}</p>
              <p className="text-cream text-sm leading-relaxed">{cond.body_mechanism}</p>
            </div>
            {cond.local_context&&(
              <div className="bg-emerald-950/40 border border-emerald-800/20 rounded-3xl p-4">
                <p className="text-emerald-400 text-xs font-semibold mb-2">🇺🇬 {tr('cond.context')}</p>
                <p className="text-cream text-sm leading-relaxed">{cond.local_context}</p>
              </div>
            )}
          </>
        )}
        {tab==='action'&&cond.action_plan&&(
          <>
            <div className="bg-charcoal rounded-3xl p-4">
              <div className="flex items-center gap-2 mb-3"><div className="w-2 h-2 rounded-full bg-red-400"/><p className="text-red-400 text-xs font-bold uppercase tracking-wide">{tr('cond.do.now')}</p></div>
              {cond.action_plan.immediate?.map((item,i)=>(
                <div key={i} className="flex items-start gap-2 mb-2.5">
                  <CheckCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5"/>
                  <p className="text-cream text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
            <div className="bg-charcoal rounded-3xl p-4">
              <div className="flex items-center gap-2 mb-3"><div className="w-2 h-2 rounded-full bg-yellow-400"/><p className="text-yellow-400 text-xs font-bold uppercase tracking-wide">{tr('cond.short.term')}</p></div>
              {cond.action_plan.short_term?.map((item,i)=>(
                <div key={i} className="flex items-start gap-2 mb-2.5">
                  <CheckCircle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5"/>
                  <p className="text-cream text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
            <div className="bg-charcoal rounded-3xl p-4">
              <div className="flex items-center gap-2 mb-3"><div className="w-2 h-2 rounded-full bg-emerald-400"/><p className="text-emerald-400 text-xs font-bold uppercase tracking-wide">{tr('cond.long.term')}</p></div>
              {cond.action_plan.long_term?.map((item,i)=>(
                <div key={i} className="flex items-start gap-2 mb-2.5">
                  <CheckCircle size={14} className="text-emerald-400 flex-shrink-0 mt-0.5"/>
                  <p className="text-cream text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </>
        )}
        {tab==='remedies'&&(
          <div className="bg-charcoal rounded-3xl p-4">
            <p className="label-text mb-3">Home & Natural {tr('cond.remedies')}</p>
            {cond.home_remedies?.length>0?cond.home_remedies.map((r,i)=>(
              <div key={i} className="flex items-start gap-2 mb-3">
                <Leaf size={14} className="text-emerald-500 flex-shrink-0 mt-0.5"/>
                <p className="text-cream text-sm leading-relaxed">{r}</p>
              </div>
            )):<p className="text-mist text-sm">No specific home remedies for this condition.</p>}
          </div>
        )}
        {tab==='warning'&&(
          <div className="bg-orange-950/30 border border-orange-800/20 rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-orange-400"/>
              <p className="text-orange-400 font-semibold text-sm">{tr('cond.see.doctor.if')}</p>
            </div>
            {cond.see_doctor_if?.map((item,i)=>(
              <div key={i} className="flex items-start gap-2 mb-3">
                <AlertCircle size={13} className="text-orange-300/60 flex-shrink-0 mt-0.5"/>
                <p className="text-orange-100/80 text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
