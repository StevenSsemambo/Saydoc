import React,{useState,useEffect}from'react'
import{useApp}from'../context/AppContext.jsx'
import{useLang}from'../context/LangContext.jsx'
import{useNavigate}from'react-router-dom'
import{analysePatterns,generateWeeklySummary,getPredictiveAlert}from'../engine/SoulEngine.js'
import{getSessions,getJournalEntries,getTodayJournal}from'../db/database.js'
import{TrendingUp,Zap,AlertTriangle,Heart,Moon,Droplets,Wind,Brain,ChevronRight,ChevronLeft}from'lucide-react'

function InsightCard({insight}){
  const level={trigger:'border-yellow-700/40 bg-yellow-950/30',trend:'border-blue-700/40 bg-blue-950/30',tip:'border-emerald-700/40 bg-emerald-950/30'}
  const textColor={trigger:'text-yellow-400',trend:'text-blue-400',tip:'text-emerald-400'}
  return(
    <div className={`rounded-3xl p-4 border ${level[insight.type]||'border-white/10 bg-charcoal'}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{insight.icon}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className={`font-semibold text-sm ${textColor[insight.type]||'text-cream'}`}>{insight.title}</p>
            <span className="text-mist text-xs">{insight.confidence}% confident</span>
          </div>
          <p className="text-cream/80 text-xs leading-relaxed mb-2">{insight.body}</p>
          {insight.actionable&&(
            <div className="bg-midnight/60 rounded-xl px-3 py-2">
              <p className="text-emerald-400 text-xs font-medium">→ {insight.actionable}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function WeeklyScore({summary,tr}){
  const score=summary.score||0
  const color=score>=70?'#00A86B':score>=50?'#C9A84C':'#C0392B'
  const label=score>=70?'Excellent':score>=50?'Good':'Needs Attention'
  return(
    <div className="bg-charcoal rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="label-text mb-1">{tr('insights.weekly.score')}</p>
          <p className="text-cream font-display font-bold text-3xl">{score}<span className="text-mist text-lg font-normal">/100</span></p>
          <p className="text-sm font-medium mt-0.5" style={{color}}>{label}</p>
        </div>
        <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center" style={{borderColor:color}}>
          <span className="text-2xl">{score>=70?'😊':score>=50?'😐':'😟'}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          {icon:'😴',label:'Sleep',val:`${summary.avg_sleep}h`,good:summary.avg_sleep>=7},
          {icon:'💧',label:'Water',val:`${summary.avg_water} glasses`,good:summary.avg_water>=8},
          {icon:'😊',label:'Mood',val:`${summary.avg_mood}/5`,good:summary.avg_mood>=3.5},
          {icon:'💨',label:'Stress',val:`${summary.avg_stress}/5`,good:summary.avg_stress<=3},
        ].map(m=>(
          <div key={m.label} className="bg-midnight rounded-2xl p-3 flex items-center gap-2">
            <span className="text-lg">{m.icon}</span>
            <div>
              <p className="text-mist text-xs">{m.label}</p>
              <p className={`font-semibold text-sm ${m.good?'text-emerald-400':'text-yellow-400'}`}>{m.val}</p>
            </div>
          </div>
        ))}
      </div>
      {summary.symptom_days>0&&(
        <div className="mt-3 bg-orange-950/30 border border-orange-800/20 rounded-2xl px-3 py-2">
          <p className="text-orange-300 text-xs">⚠️ {summary.symptom_days} day{summary.symptom_days>1?'s':''} with symptoms this week</p>
        </div>
      )}
    </div>
  )
}

export default function Insights(){
  const{user}=useApp()
  const{tr}=useLang()
  const nav=useNavigate()
  const[patterns,setPatterns]=useState(null)
  const[summary,setSummary]=useState(null)
  const[alert,setAlert]=useState(null)
  const[loading,setLoading]=useState(true)
  const[noData,setNoData]=useState(false)

  useEffect(()=>{
    if(!user?.id)return
    async function load(){
      setLoading(true)
      const[p,journal,sessions,today]=await Promise.all([
        analysePatterns(user.id),
        getJournalEntries(user.id,7),
        getSessions(user.id,20),
        getTodayJournal(user.id),
      ])
      if(!p){setNoData(true);setLoading(false);return}
      setPatterns(p)
      const s=generateWeeklySummary(journal,sessions)
      setSummary(s)
      if(today&&p)setAlert(getPredictiveAlert(today,p))
      setLoading(false)
    }
    load()
  },[user])

  if(loading){
    return(
      <div className="h-full flex flex-col items-center justify-center bg-midnight gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 flex items-center justify-center">
          <Brain size={24} className="text-emerald-500 animate-pulse"/>
        </div>
        <p className="text-mist text-sm">{tr('insights.loading')}</p>
      </div>
    )
  }

  return(
    <div className="h-full flex flex-col bg-midnight safe-top">
      <div className="bg-charcoal border-b border-white/5 px-5 pt-8 pb-5 flex-shrink-0">
        <button onClick={()=>nav(-1)} className="flex items-center gap-1 text-emerald-500 text-sm font-medium mb-3 active:opacity-70">
          <ChevronLeft size={16}/>Back
        </button>
        <div className="flex items-center gap-3 mb-1">
          <Brain size={20} className="text-emerald-500"/>
          <h1 className="font-display font-bold text-2xl text-cream">{tr('insights.title')}</h1>
        </div>
        <p className="text-mist text-sm">{tr('insights.subtitle')}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-4">
        {noData?(
          <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
            <div className="w-16 h-16 bg-charcoal rounded-3xl flex items-center justify-center">
              <TrendingUp size={28} className="text-mist/40"/>
            </div>
            <div>
              <p className="text-cream font-semibold mb-2">{tr('insights.no.data')}</p>
              <p className="text-mist text-sm leading-relaxed max-w-xs">{tr('insights.no.data.sub')}</p>
            </div>
          </div>
        ):(
          <>
            {/* Predictive Alert */}
            {alert&&(
              <div className={`rounded-3xl p-4 border flex items-start gap-3 ${alert.level==='warning'?'border-yellow-700/40 bg-yellow-950/30':'border-blue-700/40 bg-blue-950/30'}`}>
                <span className="text-2xl">{alert.icon}</span>
                <div>
                  <p className={`font-semibold text-sm mb-1 ${alert.level==='warning'?'text-yellow-400':'text-blue-400'}`}>
                    Today's Alert: {alert.title}
                  </p>
                  <p className="text-cream/80 text-xs leading-relaxed">{alert.message}</p>
                </div>
              </div>
            )}

            {/* Weekly Score */}
            {summary&&<WeeklyScore summary={summary} tr={tr}/>}

            {/* Insights */}
            {patterns?.insights?.length>0&&(
              <div>
                <p className="label-text mb-3">{tr('insights.patterns')}</p>
                <div className="space-y-3">
                  {patterns.insights.map((ins,i)=><InsightCard key={i} insight={ins}/>)}
                </div>
              </div>
            )}

            {/* Top Symptoms */}
            {patterns?.symptom_frequency?.length>0&&(
              <div className="bg-charcoal rounded-3xl p-4">
                <p className="label-text mb-3">{tr('insights.freq.symptoms')}</p>
                <div className="space-y-2">
                  {patterns.symptom_frequency.map((s,i)=>(
                    <div key={i} className="flex items-center justify-between">
                      <p className="text-cream text-sm capitalize">{s.symptom.replace(/_/g,' ')}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-midnight rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full"
                            style={{width:`${Math.min(100,(s.count/patterns.symptom_frequency[0].count)*100)}%`}}/>
                        </div>
                        <p className="text-mist text-xs w-6 text-right">{s.count}x</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best days */}
            {patterns?.best_days?.length>0&&(
              <div className="bg-emerald-950/40 border border-emerald-800/20 rounded-3xl p-4">
                <p className="label-text mb-2">{tr('insights.best.days')}</p>
                <p className="text-cream text-sm">
                  Your data shows <span className="text-emerald-400 font-semibold">{patterns.best_days.join(' and ')}</span> are typically your best days — highest mood, lowest stress.
                </p>
              </div>
            )}

            <p className="text-mist/40 text-xs text-center leading-relaxed">
              Insights are based on your journal entries. The more you log, the more accurate your patterns become.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
