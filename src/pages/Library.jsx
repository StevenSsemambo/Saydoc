import React,{useState,useMemo}from'react'
import{useNavigate}from'react-router-dom'
import{CONDITIONS}from'../engine/InferenceEngine.js'
import{useLang}from'../context/LangContext.jsx'
import{Search,ChevronRight,BookOpen}from'lucide-react'

const CAT_COLORS={neurological:'#7C3AED',infectious:'#DC2626',cardiovascular:'#EA580C',gastrointestinal:'#CA8A04',respiratory:'#0284C7',mental_health:'#0891B2',urinary:'#16A34A',eye:'#0284C7',haematological:'#DC2626',metabolic:'#CA8A04',nutritional:'#16A34A',dermatological:'#7C3AED',musculoskeletal:'#EA580C',ent:'#0891B2',womens_health:'#EC4899',environmental:'#16A34A',sexual_health:'#EC4899'}
const CAT_ICONS={neurological:'🧠',infectious:'🦠',cardiovascular:'❤️',gastrointestinal:'🫁',respiratory:'💨',mental_health:'💭',urinary:'💧',eye:'👁️',haematological:'🩸',metabolic:'⚗️',nutritional:'🥗',dermatological:'🩹',musculoskeletal:'🦴',ent:'👂',womens_health:'🌸',environmental:'🌡️',sexual_health:'🩺'}
const CAT_LABELS_EN={neurological:'Neurological',infectious:'Infectious',cardiovascular:'Heart & Circulation',gastrointestinal:'Digestive',respiratory:'Respiratory',mental_health:'Mental Health',urinary:'Urinary',eye:'Eyes',haematological:'Blood',metabolic:'Metabolic',nutritional:'Nutrition',dermatological:'Skin',musculoskeletal:'Muscles & Joints',ent:'Ear, Nose & Throat',womens_health:"Women's Health",environmental:'Environmental',sexual_health:'Sexual Health'}
const CAT_LABELS_LG={neurological:"Obulamu bw'Obwongo",infectious:"Obulwadde bw'Enkubiriza",cardiovascular:"Omutima n'Omusaayi",gastrointestinal:"Olubuto n'Emmere",respiratory:'Okufuuba',mental_health:"Obulamu bw'Ettima",urinary:'Okusaasira',eye:'Amaaso',haematological:'Omusaayi',metabolic:'Omubiri Ogukyusamu',nutritional:'Ebyokulya',dermatological:'Olusu',musculoskeletal:"Amakuubiro n'Amagumba",ent:"Okutu, Ennyindo n'Olumiro",womens_health:"Obulamu bw'Omukazi",environmental:"Ebirowoozo by'Embeera",sexual_health:"Obulamu bw'Okuwasa"}
const CAT_LABELS_SW={neurological:'Neva',infectious:'Maambukizo',cardiovascular:'Moyo & Mzunguko',gastrointestinal:'Tumbo',respiratory:'Kupumua',mental_health:'Afya ya Akili',urinary:'Mkojo',eye:'Macho',haematological:'Damu',metabolic:'Metabolic',nutritional:'Lishe',dermatological:'Ngozi',musculoskeletal:'Misuli & Mifupa',ent:'Masikio, Pua & Koo',womens_health:'Afya ya Wanawake',environmental:'Mazingira',sexual_health:'Afya ya Ngono'}
function getCatLabels(lang) { return lang==='lg'?CAT_LABELS_LG:lang==='sw'?CAT_LABELS_SW:CAT_LABELS_EN }

const ALL_CATS=['all',...new Set(Object.values(CONDITIONS).map(c=>c.category).filter(Boolean))]

export default function Library(){
  const nav=useNavigate()
  const{lang,tr}=useLang()
  const[search,setSearch]=useState('')
  const[cat,setCat]=useState('all')

  const filtered=useMemo(()=>{
    return Object.entries(CONDITIONS).filter(([k,c])=>{
      const matchCat=cat==='all'||c.category===cat
      const matchSearch=!search||c.name.toLowerCase().includes(search.toLowerCase())||c.description?.toLowerCase().includes(search.toLowerCase())
      return matchCat&&matchSearch
    })
  },[search,cat])

  return(
    <div className="h-full flex flex-col bg-midnight safe-top">
      <div className="bg-charcoal border-b border-white/5 px-5 pt-8 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-emerald-600/20 rounded-2xl flex items-center justify-center">
            <BookOpen size={20} className="text-emerald-500"/>
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-cream">{tr('library.title')}</h1>
            <p className="text-mist text-xs">{Object.keys(CONDITIONS).length}+ conditions covered</p>
          </div>
        </div>
        <div className="relative mt-3 mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist/50"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder={tr('library.search')}
            className="w-full bg-midnight border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-cream text-sm placeholder-mist/40 focus:outline-none focus:border-emerald-600 transition-colors"/>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}}>
          {ALL_CATS.map(c=>{
            const active=cat===c
            const color=CAT_COLORS[c]
            return(
              <button key={c} onClick={()=>setCat(c)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${active?'text-white':'text-mist bg-midnight'}`}
                style={active?{background:color||'#00A86B'}:{}}>
                {c==='all'?`All (${Object.keys(CONDITIONS).length})`:getCatLabels(lang)[c]||c}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24">
        <p className="label-text mb-3">{filtered.length} CONDITION{filtered.length!==1?'S':''}</p>
        <div className="space-y-2">
          {filtered.map(([key,cond])=>{
            const color=CAT_COLORS[cond.category]||'#00A86B'
            const icon=CAT_ICONS[cond.category]||'🩺'
            return(
              <button key={key} onClick={()=>nav(`/condition/${key}`)}
                className="w-full bg-charcoal rounded-2xl p-4 flex items-center gap-3 active:scale-98 transition-all">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{background:color+'22'}}>
                  <span className="text-xl">{icon}</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-cream font-semibold text-sm">{cond.name}</p>
                  <p className="text-mist text-xs capitalize mt-0.5">{getCatLabels(lang)[cond.category]||cond.category}</p>
                  <p className="text-mist/60 text-xs mt-1 truncate">{cond.description?.substring(0,70)}...</p>
                </div>
                <ChevronRight size={16} className="text-mist flex-shrink-0"/>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
