import React,{useState,useEffect}from'react'
import{useApp}from'../context/AppContext.jsx'
import{useLang}from'../context/LangContext.jsx'
import{useNavigate}from'react-router-dom'
import{saveJournalEntry,getJournalEntries,getTodayJournal}from'../db/database.js'
import{CheckCircle,Droplets,Moon,Zap,Heart,Wind,ChevronLeft}from'lucide-react'

const today=()=>new Date().toISOString().split('T')[0]

const MOODS=[{v:1,e:'😞'},{v:2,e:'😕'},{v:3,e:'😐'},{v:4,e:'🙂'},{v:5,e:'😊'}]
function getEnergyLabels(lang) {
  if (lang==='lg') return [{v:1,l:'Obunafu Ennyo'},{v:2,l:'Obunafu'},{v:3,l:'Butuufu'},{v:4,l:'Maanyi'},{v:5,l:'Maanyi Ennyo'}]
  if (lang==='sw') return [{v:1,l:'Chini Sana'},{v:2,l:'Chini'},{v:3,l:'Sawa'},{v:4,l:'Nzuri'},{v:5,l:'Nzuri Sana'}]
  return [{v:1,l:'Very Low'},{v:2,l:'Low'},{v:3,l:'Okay'},{v:4,l:'Good'},{v:5,l:'Great'}]
}
function getCommonSymptoms(lang) {
  const lg = ['Omutwe','Omusujja','Okwefuula','Obunafu','Okutetemera','Ekibaala','Enkuba','Emabega','Okutya']
  const sw = ['Maumivu ya kichwa','Homa','Kichefuchefu','Uchovu','Kizunguzungu','Maumivu ya tumbo','Kikohozi','Maumivu ya mgongo','Wasiwasi']
  const en = ['Headache','Fever','Nausea','Fatigue','Dizziness','Stomach pain','Cough','Back pain','Anxiety']
  return lang==='lg' ? lg : lang==='sw' ? sw : en
}

export default function Journal(){
  const{user}=useApp()
  const{lang,tr}=useLang()
  const nav=useNavigate()
  const[entry,setEntry]=useState({date:today(),mood:3,energy:3,sleep:7,water:6,symptoms:[],notes:'',stress:3})
  const[saved,setSaved]=useState(false)
  const[recent,setRecent]=useState([])
  const[tab,setTab]=useState('today')

  useEffect(()=>{
    if(!user?.id)return
    getTodayJournal(user.id).then(e=>{if(e)setEntry(prev=>({...prev,...e}))})
    getJournalEntries(user.id,7).then(setRecent)
  },[user])

  const toggleSymptom=s=>{
    setEntry(e=>({...e,symptoms:e.symptoms.includes(s)?e.symptoms.filter(x=>x!==s):[...e.symptoms,s]}))
  }

  const save=async()=>{
    if(!user?.id)return
    await saveJournalEntry({...entry,user_id:user.id})
    setSaved(true)
    getJournalEntries(user.id,7).then(setRecent)
    setTimeout(()=>setSaved(false),2000)
  }

  return(
    <div className="h-full flex flex-col bg-midnight safe-top">
      <div className="bg-charcoal border-b border-white/5 px-5 pt-8 pb-4 flex-shrink-0">
        <button onClick={()=>nav(-1)} className="flex items-center gap-1 text-emerald-500 text-sm font-medium mb-3 active:opacity-70">
          <ChevronLeft size={16}/>Back
        </button>
        <h1 className="font-display font-bold text-2xl text-cream mb-1">{tr('journal.title')}</h1>
        <p className="text-mist text-sm">{tr('journal.subtitle')}</p>
        <div className="flex gap-2 mt-4">
          {['today','history'].map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab===t?'bg-emerald-600 text-white':'text-mist'}`}>
              {t==='today'?tr('journal.today'):tr('journal.history')}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-5">
        {tab==='today'?(
          <>
            {/* Mood */}
            <div className="bg-charcoal rounded-3xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Heart size={16} className="text-pink-400"/>
                <p className="text-cream font-semibold text-sm">{tr('journal.mood')}</p>
              </div>
              <div className="flex justify-between">
                {MOODS.map(m=>(
                  <button key={m.v} onClick={()=>setEntry(e=>({...e,mood:m.v}))}
                    className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${entry.mood===m.v?'bg-emerald-600/20 scale-110':''}`}>
                    <span className="text-2xl">{m.e}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep & Water */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-charcoal rounded-3xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Moon size={14} className="text-blue-400"/>
                  <p className="text-cream text-sm font-semibold">{tr('journal.sleep')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={()=>setEntry(e=>({...e,sleep:Math.max(0,e.sleep-1)}))}
                    className="w-8 h-8 bg-midnight rounded-xl text-cream font-bold text-lg flex items-center justify-center active:scale-90 transition-all">−</button>
                  <div className="flex-1 text-center">
                    <p className="font-display font-bold text-2xl text-cream">{entry.sleep}</p>
                    <p className="text-mist text-xs">{tr('journal.hours')}</p>
                  </div>
                  <button onClick={()=>setEntry(e=>({...e,sleep:Math.min(12,e.sleep+1)}))}
                    className="w-8 h-8 bg-midnight rounded-xl text-cream font-bold text-lg flex items-center justify-center active:scale-90 transition-all">+</button>
                </div>
              </div>
              <div className="bg-charcoal rounded-3xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Droplets size={14} className="text-cyan-400"/>
                  <p className="text-cream text-sm font-semibold">{tr('journal.water')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={()=>setEntry(e=>({...e,water:Math.max(0,e.water-1)}))}
                    className="w-8 h-8 bg-midnight rounded-xl text-cream font-bold text-lg flex items-center justify-center active:scale-90 transition-all">−</button>
                  <div className="flex-1 text-center">
                    <p className="font-display font-bold text-2xl text-cream">{entry.water}</p>
                    <p className="text-mist text-xs">{tr('journal.glasses')}</p>
                  </div>
                  <button onClick={()=>setEntry(e=>({...e,water:Math.min(15,e.water+1)}))}
                    className="w-8 h-8 bg-midnight rounded-xl text-cream font-bold text-lg flex items-center justify-center active:scale-90 transition-all">+</button>
                </div>
              </div>
            </div>

            {/* Stress */}
            <div className="bg-charcoal rounded-3xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wind size={14} className="text-purple-400"/>
                  <p className="text-cream text-sm font-semibold">{tr('journal.stress')}</p>
                </div>
                <span className="badge-mist">{(lang==='lg'?['','Peefu Ennyo','Peefu','Wakati','Munene','Munene Ennyo']:lang==='sw'?['','Chini Sana','Chini','Wastani','Juu','Juu Sana']:['','Very Low','Low','Moderate','High','Very High'])[entry.stress]}</span>
              </div>
              <input type="range" min={1} max={5} value={entry.stress}
                onChange={e=>setEntry(ev=>({...ev,stress:parseInt(e.target.value)}))}
                className="w-full accent-emerald-500"/>
            </div>

            {/* Symptoms */}
            <div className="bg-charcoal rounded-3xl p-4">
              <p className="text-cream font-semibold text-sm mb-3">{tr('journal.symptoms')}</p>
              <div className="flex flex-wrap gap-2">
                {getCommonSymptoms(lang).map(s=>(
                  <button key={s} onClick={()=>toggleSymptom(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${entry.symptoms.includes(s)?'bg-emerald-600 text-white':'bg-midnight text-mist border border-white/10'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-charcoal rounded-3xl p-4">
              <p className="text-cream font-semibold text-sm mb-3">Notes (optional)</p>
              <textarea value={entry.notes} onChange={e=>setEntry(ev=>({...ev,notes:e.target.value}))}
                placeholder="Anything else about how you feel today..."
                className="w-full bg-midnight rounded-2xl px-4 py-3 text-cream text-sm placeholder-mist/40 focus:outline-none focus:ring-1 focus:ring-emerald-600 resize-none border border-white/5"
                rows={3}/>
            </div>

            <button onClick={save} className="btn-primary w-full flex items-center justify-center gap-2">
              {saved?<><CheckCircle size={16}/>{tr('journal.saved')}</>:tr('journal.save')}
            </button>
          </>
        ):(
          <div className="space-y-3">
            {recent.length===0?<p className="text-mist text-center py-8">No journal entries yet. Start logging today!</p>:
            recent.map((e,i)=>(
              <div key={i} className="bg-charcoal rounded-3xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-cream font-semibold text-sm">{new Date(e.date+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{MOODS.find(m=>m.v===e.mood)?.e||'😐'}</span>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-mist">
                  <span>😴 {e.sleep}h sleep</span>
                  <span>💧 {e.water} glasses</span>
                  {e.symptoms?.length>0&&<span>🤒 {e.symptoms.length} symptom{e.symptoms.length>1?'s':''}</span>}
                </div>
                {e.symptoms?.length>0&&(
                  <div className="flex flex-wrap gap-1 mt-2">
                    {e.symptoms.slice(0,4).map(s=>(
                      <span key={s} className="bg-midnight text-mist text-xs px-2 py-0.5 rounded-lg">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
