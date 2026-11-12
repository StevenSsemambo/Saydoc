import React,{useState,useEffect}from'react'
import{useNavigate}from'react-router-dom'
import{useApp}from'../context/AppContext.jsx'
import{getSessions}from'../db/database.js'
import{MERGED_KB}from'../engine/KnowledgeMerger.js'
const CONDITIONS=MERGED_KB.conditions
import{ChevronRight,Clock}from'lucide-react'
import{useLang}from'../context/LangContext.jsx'

const CAT_COLORS={neurological:'#7C3AED',infectious:'#DC2626',cardiovascular:'#EA580C',gastrointestinal:'#CA8A04',respiratory:'#0284C7',mental_health:'#0891B2',urinary:'#16A34A'}
const CAT_ICONS={neurological:'🧠',infectious:'🦠',cardiovascular:'❤️',gastrointestinal:'🫁',respiratory:'💨',mental_health:'💭',urinary:'💧'}

export default function History(){
  const{user}=useApp()
  const{tr}=useLang()
  const[sessions,setSessions]=useState([])
  const[selected,setSelected]=useState(null)
  const nav=useNavigate()

  useEffect(()=>{if(user?.id)getSessions(user.id,50).then(setSessions)},[user])

  if(selected){
    const r=selected.result
    const cond=CONDITIONS[selected.primary_condition]
    return(
      <div className="h-full flex flex-col bg-midnight safe-top">
        <div className="bg-charcoal border-b border-white/5 px-5 pt-8 pb-4 flex-shrink-0">
          <button onClick={()=>setSelected(null)} className="text-emerald-500 text-sm font-medium mb-3">← Back to History</button>
          <h1 className="font-display font-bold text-xl text-cream">{cond?.name||selected.primary_condition}</h1>
          <p className="text-mist text-xs">{new Date(selected.timestamp).toLocaleString('en-GB')}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-4">
          <div className="bg-charcoal rounded-3xl p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-cream font-semibold">{tr('ui.confidence')}</p>
              <p className="text-emerald-500 font-bold text-lg">{selected.confidence}%</p>
            </div>
            <div className="confidence-bar"><div className="confidence-fill" style={{width:`${selected.confidence}%`}}/></div>
          </div>
          {r?.action_plan&&(
            <div className="bg-charcoal rounded-3xl p-4">
              <p className="text-cream font-semibold mb-3">Action Plan</p>
              {r.action_plan.immediate?.slice(0,4).map((item,i)=>(
                <div key={i} className="flex items-start gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-400 text-xs">{i+1}</span>
                  </div>
                  <p className="text-cream text-xs leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          )}
          <button onClick={()=>nav(`/condition/${selected.primary_condition}`)}
            className="btn-primary w-full flex items-center justify-center gap-2">
            Learn More About {cond?.name} <ChevronRight size={16}/>
          </button>
        </div>
      </div>
    )
  }

  return(
    <div className="h-full flex flex-col bg-midnight safe-top">
      <div className="bg-charcoal border-b border-white/5 px-5 pt-8 pb-5 flex-shrink-0">
        <h1 className="font-display font-bold text-2xl text-cream mb-1">{tr('history.title')}</h1>
        <p className="text-mist text-sm">{sessions.length} symptom {sessions.length===1?'check':'checks'} recorded</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-2">
        {sessions.length===0?(
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Clock size={40} className="text-mist/30 mb-3"/>
            <p className="text-mist font-medium">{tr('history.no.history')}</p>
            <p className="text-mist/60 text-sm">{tr('history.no.history')}</p>
          </div>
        ):sessions.map((s,i)=>{
          const cond=CONDITIONS[s.primary_condition]
          const cat=cond?.category||'general'
          const color=CAT_COLORS[cat]||'#00A86B'
          const icon=CAT_ICONS[cat]||'🩺'
          const d=new Date(s.timestamp)
          return(
            <button key={i} onClick={()=>setSelected(s)}
              className="w-full bg-charcoal rounded-2xl p-4 flex items-center gap-3 active:scale-98 transition-all">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:color+'22'}}>
                <span className="text-xl">{icon}</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-cream font-semibold text-sm">{cond?.name||s.primary_condition||tr('ui.health.check')}</p>
                <p className="text-mist text-xs">{d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})} • {s.confidence||0}% confidence</p>
              </div>
              <ChevronRight size={16} className="text-mist"/>
            </button>
          )
        })}
      </div>
    </div>
  )
}
