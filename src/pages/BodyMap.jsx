import React,{useState}from'react'
import{useNavigate}from'react-router-dom'
import{MessageCircle,ChevronLeft}from'lucide-react'
import{useLang}from'../context/LangContext.jsx'

const REGIONS=[
  {id:'head',label:'Head',top:'4%',left:'42%',w:16,h:14,symptoms:['headache','dizziness','migraine'],desc:'Head, scalp, or general head pain'},
  {id:'forehead',label:'Forehead',top:'7%',left:'42%',w:16,h:7,symptoms:['headache','sinus_pain'],desc:'Forehead or sinus area pain'},
  {id:'eyes',label:'Eyes',top:'12%',left:'38%',w:24,h:5,symptoms:['eye_pain','eye_redness','blurred_vision'],desc:'Eye pain, redness, or vision changes'},
  {id:'face',label:'Face/Jaw',top:'16%',left:'38%',w:24,h:7,symptoms:['facial_pain','sore_throat'],desc:'Face, jaw, cheek or sinus pain'},
  {id:'throat',label:'Throat',top:'22%',left:'40%',w:20,h:6,symptoms:['sore_throat','dysphagia'],desc:'Throat pain or difficulty swallowing'},
  {id:'neck',label:'Neck',top:'25%',left:'41%',w:18,h:6,symptoms:['neck_stiffness','neck_pain'],desc:'Neck pain or stiffness'},
  {id:'chest',label:'Chest',top:'32%',left:'36%',w:28,h:13,symptoms:['chest_pain','dyspnoea','palpitations'],desc:'Chest pain, tightness, or breathing difficulty'},
  {id:'upper_abdomen',label:'Upper Belly',top:'44%',left:'36%',w:28,h:10,symptoms:['epigastric_pain','heartburn','nausea'],desc:'Upper stomach, heartburn, nausea'},
  {id:'abdomen',label:'Abdomen',top:'53%',left:'36%',w:28,h:10,symptoms:['abdominal_pain','bloating'],desc:'Abdominal pain or bloating'},
  {id:'lower_abdomen',label:'Lower Belly',top:'62%',left:'36%',w:28,h:8,symptoms:['abdominal_pain','dysuria','urinary_frequency'],desc:'Lower abdominal or pelvic pain'},
  {id:'back_upper',label:'Upper Back',top:'32%',left:'8%',w:22,h:12,symptoms:['back_pain','body_aches'],desc:'Upper back pain'},
  {id:'back_lower',label:'Lower Back',top:'50%',left:'8%',w:22,h:12,symptoms:['back_pain'],desc:'Lower back pain'},
  {id:'arms',label:'Arms',top:'33%',left:'68%',w:18,h:28,symptoms:['arm_pain','numbness','joint_pain'],desc:'Arm, shoulder, or joint pain'},
  {id:'legs',label:'Legs',top:'72%',left:'36%',w:28,h:24,symptoms:['weakness','joint_pain','numbness'],desc:'Leg pain, weakness, or swelling'},
]

const SYMPTOM_TO_DESC={
  headache:'Describe your headache to the AI for a detailed assessment',
  chest_pain:'Chest pain needs careful assessment — describe it fully to the AI',
  abdominal_pain:'Stomach pain has many causes — the AI will help identify yours',
  back_pain:'Back pain is very common and treatable — tell the AI more',
  eye_pain:'Eye symptoms need careful assessment',
  sore_throat:'Throat and neck symptoms — describe to the AI',
  dysuria:'Urinary symptoms — the AI can help identify the cause',
}

export default function BodyMap(){
  const nav=useNavigate()
  const{tr}=useLang()
  const[selected,setSelected]=useState(null)
  const[view,setView]=useState('front')

  const handleSelect=(region)=>{
    setSelected(region)
  }

  const goToChat=(region)=>{
    const symptomText=`I have pain or discomfort in my ${region.desc.toLowerCase()}`
    nav('/chat',{state:{initialMessage:symptomText}})
  }

  return(
    <div className="h-full flex flex-col bg-midnight safe-top">
      <div className="bg-charcoal border-b border-white/5 px-5 pt-8 pb-4 flex-shrink-0">
        <button onClick={()=>nav(-1)} className="flex items-center gap-1 text-emerald-500 text-sm font-medium mb-3 active:opacity-70">
          <ChevronLeft size={16}/>Back
        </button>
        <h1 className="font-display font-bold text-2xl text-cream mb-1">{tr('bodymap.title')}</h1>
        <p className="text-mist text-sm">{tr('bodymap.subtitle')} to start your assessment</p>
        <div className="flex gap-2 mt-3">
          {['front','back'].map(v=>(
            <button key={v} onClick={()=>{setView(v);setSelected(null)}}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold capitalize transition-all ${view===v?'bg-emerald-600 text-white':'text-mist'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="flex flex-col items-center px-4 py-4 gap-4">
          {/* Body SVG */}
          <div className="relative w-full max-w-xs" style={{height:'420px'}}>
            <svg viewBox="0 0 100 200" className="w-full h-full" style={{filter:'drop-shadow(0 4px 24px rgba(0,168,107,0.1))'}}>
              {/* Body outline */}
              <g fill="none" stroke="#3D5247" strokeWidth="0.8">
                {view==='front'?(
                  <>
                    {/* Head */}
                    <ellipse cx="50" cy="14" rx="10" ry="12" fill="#1C2B26"/>
                    {/* Neck */}
                    <rect x="46" y="25" width="8" height="6" rx="2" fill="#1C2B26"/>
                    {/* Torso */}
                    <rect x="34" y="30" width="32" height="38" rx="4" fill="#1C2B26"/>
                    {/* Arms */}
                    <rect x="22" y="30" width="12" height="36" rx="6" fill="#1C2B26"/>
                    <rect x="66" y="30" width="12" height="36" rx="6" fill="#1C2B26"/>
                    {/* Forearms */}
                    <rect x="20" y="64" width="10" height="28" rx="5" fill="#1C2B26"/>
                    <rect x="70" y="64" width="10" height="28" rx="5" fill="#1C2B26"/>
                    {/* Legs */}
                    <rect x="36" y="68" width="12" height="48" rx="6" fill="#1C2B26"/>
                    <rect x="52" y="68" width="12" height="48" rx="6" fill="#1C2B26"/>
                    {/* Feet */}
                    <ellipse cx="42" cy="118" rx="7" ry="4" fill="#1C2B26"/>
                    <ellipse cx="58" cy="118" rx="7" ry="4" fill="#1C2B26"/>
                  </>
                ):(
                  <>
                    <ellipse cx="50" cy="14" rx="10" ry="12" fill="#1C2B26"/>
                    <rect x="46" y="25" width="8" height="6" rx="2" fill="#1C2B26"/>
                    <rect x="34" y="30" width="32" height="38" rx="4" fill="#1C2B26"/>
                    <rect x="22" y="30" width="12" height="36" rx="6" fill="#1C2B26"/>
                    <rect x="66" y="30" width="12" height="36" rx="6" fill="#1C2B26"/>
                    <rect x="20" y="64" width="10" height="28" rx="5" fill="#1C2B26"/>
                    <rect x="70" y="64" width="10" height="28" rx="5" fill="#1C2B26"/>
                    <rect x="36" y="68" width="12" height="48" rx="6" fill="#1C2B26"/>
                    <rect x="52" y="68" width="12" height="48" rx="6" fill="#1C2B26"/>
                    <ellipse cx="42" cy="118" rx="7" ry="4" fill="#1C2B26"/>
                    <ellipse cx="58" cy="118" rx="7" ry="4" fill="#1C2B26"/>
                  </>
                )}
              </g>

              {/* Clickable hotspots */}
              {REGIONS.filter(r=>view==='front'?!r.id.startsWith('back'):r.id.startsWith('back')||r.id==='neck').map(r=>(
                <rect key={r.id}
                  x={parseFloat(r.left)/100*100}
                  y={parseFloat(r.top)/100*200}
                  width={r.w}
                  height={r.h}
                  rx="3"
                  fill={selected?.id===r.id?'rgba(0,168,107,0.5)':'rgba(0,168,107,0.08)'}
                  stroke={selected?.id===r.id?'#00A86B':'rgba(0,168,107,0.3)'}
                  strokeWidth="0.5"
                  className="cursor-pointer transition-all"
                  onClick={()=>handleSelect(r)}
                />
              ))}

              {/* Labels */}
              {REGIONS.filter(r=>view==='front'?!r.id.startsWith('back'):r.id.startsWith('back')||r.id==='neck').map(r=>(
                <text key={r.id+'l'}
                  x={parseFloat(r.left)/100*100+r.w/2}
                  y={parseFloat(r.top)/100*200+r.h/2+1.5}
                  fontSize="3.5"
                  textAnchor="middle"
                  fill={selected?.id===r.id?'#00A86B':'#8BA99A'}
                  className="pointer-events-none select-none"
                  style={{fontFamily:'Inter,sans-serif'}}>
                  {r.label}
                </text>
              ))}
            </svg>
          </div>

          {/* Selected region info */}
          {selected?(
            <div className="w-full max-w-xs bg-charcoal rounded-3xl p-4 animate-slide-up">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"/>
                <p className="text-emerald-400 font-semibold text-sm">{selected.label} Selected</p>
              </div>
              <p className="text-mist text-xs mb-4 leading-relaxed">{selected.desc}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {selected.symptoms.map(s=>(
                  <span key={s} className="bg-emerald-600/15 text-emerald-400 text-xs px-2.5 py-1 rounded-xl font-medium capitalize">
                    {s.replace(/_/g,' ')}
                  </span>
                ))}
              </div>
              <button onClick={()=>goToChat(selected)}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                <MessageCircle size={15}/>
                Assess {selected.label} Symptoms
              </button>
            </div>
          ):(
            <div className="w-full max-w-xs bg-charcoal/50 border border-white/5 rounded-3xl p-4 text-center">
              <p className="text-mist text-sm">Tap any body region above to select it, then start your symptom assessment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
