import React,{useState}from'react'

// SayMyDoc inline SVG logo
function SayMyDocLogo({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="smdobg2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#08162D"/>
          <stop offset="100%" stopColor="#052637"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="url(#smdobg2)"/>
      <rect x="12" y="15" width="70" height="48" rx="12" fill="white"/>
      <polygon points="24,63 15,82 42,63" fill="white"/>
      <polyline points="18,39 32,39 37,29 40,39 44,21 49,53 54,33 58,39 82,39"
        stroke="#00C97A" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <rect x="72" y="19" width="4" height="13" rx="2" fill="#00C97A"/>
      <rect x="67" y="24" width="13" height="4" rx="2" fill="#00C97A"/>
    </svg>
  )
}

import{useApp}from'../context/AppContext.jsx'
import{useLang}from'../context/LangContext.jsx'
import{t}from'../engine/LanguageEngine.js'
import{useNavigate}from'react-router-dom'
import{ChevronRight,Heart,Shield,Wifi}from'lucide-react'

// Steps now built with tr() — see getSteps(tr) call in component

export default function Onboarding(){
  const[step,setStep]=useState(0)
  const[profile,setProfile]=useState({name:'',age:'',sex:'',location:'Uganda'})
  const[setupMode,setSetupMode]=useState(false)
  const{completeOnboarding}=useApp()
  const{lang,tr}=useLang()
  const getSteps=()=>[
    {icon:'🩺',title:tr('onboard.step1.title'),sub:tr('onboard.step1.sub'),cta:tr('onboard.cta.start')},
    {icon:'🧠',title:tr('onboard.step2.title'),sub:tr('onboard.step2.sub'),cta:tr('onboard.cta.continue')},
    {icon:'🔒',title:tr('onboard.step3.title'),sub:tr('onboard.step3.sub'),cta:tr('onboard.cta.continue')},
    {icon:'📡',title:tr('onboard.step4.title'),sub:tr('onboard.step4.sub'),cta:tr('onboard.cta.setup')},
  ]
  const nav=useNavigate()

  const handleNext=()=>{
    if(step<getSteps().length-1){setStep(s=>s+1)}
    else{setSetupMode(true)}
  }

  const handleFinish=async()=>{
    if(!profile.name.trim())return
    await completeOnboarding({...profile,age:parseInt(profile.age)||0,created_at:Date.now()})
    nav('/')
  }

  if(setupMode){
    return(
      <div className="fixed inset-0 bg-midnight flex flex-col safe-top safe-bottom">
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <span className="text-3xl">👤</span>
            </div>
            <h1 className="font-display font-bold text-2xl text-cream mb-2">{tr('onboard.profile.title')}</h1>
            <p className="text-mist text-sm">{tr('onboard.profile.sub')}</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label-text block mb-2">{tr('onboard.name')}</label>
              <input className="input-field" placeholder="e.g. Steven" value={profile.name}
                onChange={e=>setProfile(p=>({...p,name:e.target.value}))}/>
            </div>
            <div>
              <label className="label-text block mb-2">{tr('onboard.age')}</label>
              <input className="input-field" placeholder="e.g. 25" type="number"
                value={profile.age} onChange={e=>setProfile(p=>({...p,age:e.target.value}))}/>
            </div>
            <div>
              <label className="label-text block mb-2">{tr('onboard.sex')}</label>
              <div className="flex gap-3">
                {['male','female','prefer not to say'].map(s=>(
                  <button key={s} onClick={()=>setProfile(p=>({...p,sex:s}))}
                    className={`flex-1 py-3 rounded-2xl text-sm font-medium capitalize transition-all ${profile.sex===s?'bg-emerald-600 text-white':'bg-charcoal text-mist'}`}>
                    {s==='male'?tr('onboard.male'):s==='female'?tr('onboard.female'):tr('onboard.other')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-text block mb-2">{tr('onboard.location')}</label>
              <input className="input-field" placeholder="e.g. Kampala, Uganda"
                value={profile.location} onChange={e=>setProfile(p=>({...p,location:e.target.value}))}/>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6">
          <button onClick={handleFinish} disabled={!profile.name.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2">
            Start Using SayMyDoc <ChevronRight size={18}/>
          </button>
        </div>
      </div>
    )
  }

  const s=getSteps()[step]
  return(
    <div className="fixed inset-0 bg-midnight flex flex-col items-center justify-between safe-top safe-bottom px-8 py-12">
      <div className="flex gap-2 w-full justify-center">
        {getSteps().map((_,i)=>(
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i<=step?'bg-emerald-600':'bg-charcoal'}`}/>
        ))}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <div className="animate-fade-in">
          {step === 0 ? (
            <div style={{ filter: 'drop-shadow(0 0 24px rgba(0,201,122,0.4))' }}>
              <SayMyDocLogo size={112} />
            </div>
          ) : (
            <div className="w-28 h-28 bg-gradient-to-br from-emerald-700 to-emerald-950 rounded-[32px] flex items-center justify-center shadow-glow">
              <span className="text-6xl">{s.icon}</span>
            </div>
          )}
        </div>
        <div className="animate-slide-up">
          <h1 className="font-display font-bold text-2xl text-cream mb-3 leading-tight">{s.title}</h1>
          <p className="text-mist text-base leading-relaxed max-w-xs">{s.sub}</p>
        </div>
      </div>
      <div className="w-full space-y-3">
        <button onClick={handleNext} className="btn-primary w-full flex items-center justify-center gap-2">
          {s.cta}<ChevronRight size={18}/>
        </button>
        {step>0&&<button onClick={()=>setStep(s=>s-1)} className="w-full text-mist text-sm py-2">Back</button>}
        {step===0&&(
          <p style={{textAlign:'center',fontSize:'11px',color:'rgba(140,190,165,0.45)',marginTop:'8px',letterSpacing:'0.04em'}}>
            By <span style={{color:'rgba(0,201,122,0.65)',fontWeight:700}}>Steven · SayMyTech Developers</span> · Kampala 🇺🇬
          </p>
        )}
      </div>
    </div>
  )
}
