import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Send, RefreshCw, AlertTriangle, ChevronRight, CheckCircle } from 'lucide-react'
import { MessageAudioBtn } from '../components/ui/AudioReader.jsx'
import { VoiceInputInline } from '../components/ui/VoiceInput.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import { InferenceSession, getGreeting } from '../engine/InferenceEngine.js'
import { saveSession } from '../db/database.js'
import ConditionResult from '../components/chat/ConditionResult.jsx'

function TypingDots() {
  return <div className="flex gap-1.5 items-center p-1"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div>
}

function EmergencyBubble({ message, label }) {
  return (
    <div className="bg-red-900/60 border border-red-500/40 rounded-3xl p-4 mx-1 animate-slide-up">
      <div className="flex items-start gap-2 mb-2">
        <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-red-200 font-semibold text-sm">{label || 'Emergency Alert'}</p>
      </div>
      <p className="text-red-100 text-sm leading-relaxed">{message}</p>
    </div>
  )
}

// ── Bilingual answer labels ──────────────────────────────────
const ANSWER_LABELS_EN = {
  yes:'Yes',no:'No',one_side:'One side',both_sides:'Both sides',whole_head:'Whole head',
  throbbing:'Throbbing / pulsing',pressure:'Constant pressure',both:'Both',
  nausea_only:'Nausea only',vomited:'I vomited',sudden:'Sudden',gradual:'Gradual',
  upper_middle:'Upper/middle',lower:'Lower belly',all_over:'All over',
  better_after_eating:'Better after eating',worse_after_eating:'Worse after eating',
  no_relation:'No difference',yes_personal:'Yes, I have it',family_only:'Family history only',
  not_sure:'Not sure',mild:'Mild',at_rest:'At rest',exercise:'During exercise',
  caffeine:'After caffeine',anxiety:'During anxiety',seconds:'Seconds',minutes:'Minutes',
  hours:'Hours or more',thick_coloured:'Thick/coloured',watery_clear:'Watery/clear',
  none:'No discharge',one_eye:'One eye',both_eyes:'Both eyes',front:'Front of head',
  both_temples:'Both temples',back_of_head:'Back of head',less_than_2_weeks:'Less than 2 weeks',
  '2_to_4_weeks':'2–4 weeks',more_than_a_month:'Over a month',sleeping_too_much:'Too much',
  sleeping_too_little:'Too little',waking_early:'Waking early',normal:'Normal sleep',
  within_hours:'Within hours of eating',well_river:'Well or river',tap:'Tap water',
  borehole:'Borehole',bottled:'Bottled water',positive:'Positive',negative:'Negative',
  not_tested:'Not tested',adult:'Adult',spreading:'Spreading',same:'Same area',
  improving:'Getting better',face:'Face',trunk:'Chest/back',limbs:'Arms/legs',
  unknown:'Not sure',yes_cyclical:'Yes, cyclical',no_idea:'Not sure',
}
const ANSWER_LABELS_LG = {
  yes:'Weewaawo',no:'Nedda',one_side:'Eruba limmu',both_sides:'Emiruba emibiri',whole_head:'Omutwe gwona',
  throbbing:"Okubiinya / okunuma okudda n'okuleka",pressure:'Okunuma okwemera',both:'Byombi',
  nausea_only:'Okwefuula bokka',vomited:'Nafuuye',sudden:'Mangu bwangu',gradual:'Mpola mpola',
  upper_middle:'Waggulu / wakati',lower:"Wansi w'olubuto",all_over:'Wonna',
  better_after_eating:'Bunafu nga balya',worse_after_eating:'Bunaffu nga balya',
  no_relation:'Tekikyusaku kintu',yes_personal:'Weewaawo, mfunamu',family_only:'Mu famire yokka',
  not_sure:'Simanyi',mild:'Peefu',at_rest:'Nga nviika',exercise:'Nga nkola emirimu',
  caffeine:'Oluvannyuma lwa kaawa',anxiety:'Nga ntidde',seconds:'Ebbanga entono',minutes:'Eddakiika',
  hours:'Essawa oba wusira',thick_coloured:'Enjugumba / erina langi',watery_clear:'Amazzi / ekendevu',
  none:'Tewaliwo',one_eye:'Jjiso limmu',both_eyes:'Amaaso omubiri',front:"Mu maaso g'omutwe",
  both_temples:'Emirembe emibiri',back_of_head:"Emabega g'omutwe",less_than_2_weeks:"Wiiki 2 ez'okwedda",
  '2_to_4_weeks':'Wiiki 2–4',more_than_a_month:'Okusukka omwezi',sleeping_too_much:'Otulo nyo',
  sleeping_too_little:'Otulo tono',waking_early:'Okuzuukuka mangu',normal:'Otulo obulungi',
  within_hours:"Essawa mu myezi gy'okulya",well_river:'Musayi / lumonde',tap:'Amazzi ga tapu',
  borehole:'Ekiwundo',bottled:"Amazzi g'esupa",positive:'Weewaawo / positive',negative:'Nedda / negative',
  not_tested:'Sikeberebwa',adult:'Omuntu omukulu',spreading:'Ekiiga obulayi',same:'Ekifo kimu',
  improving:'Bunafu bumalirira',face:'Amaaso',trunk:'Kifuba / emabega',limbs:'Emikono / amagulu',
  unknown:'Simanyi',yes_cyclical:'Weewaawo, bujja ne kudda',no_idea:'Simanyi',
}
function getAnswerLabelMap(lang) {
  return lang === 'lg' ? ANSWER_LABELS_LG : ANSWER_LABELS_EN
}

// getAnswerLabels replaced by getAnswerLabelMap(lang) above


function FollowUpCards({ question, answers, onAnswer, lang }) {
  return (
    <div className="animate-slide-up w-full">
      <div className="bubble-ai mb-3">{question}</div>
      <div className="flex flex-wrap gap-2 mt-1">
        {Object.keys(answers).map(k => (
          <button key={k} onClick={() => onAnswer(k)}
            className="bg-emerald-600/20 border border-emerald-600/30 text-emerald-300 text-sm px-4 py-2 rounded-2xl active:scale-95 transition-all font-medium">
            {getAnswerLabelMap(lang)[k] || k.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
    </div>
  )
}

function ConditionSelectCards({ message, candidates, onSelect }) {
  return (
    <div className="animate-slide-up w-full">
      <div className="bubble-ai mb-3">{message}</div>
      <div className="space-y-2">
        {candidates.map(c => (
          <button key={c.key} onClick={() => onSelect(c.key)}
            className="w-full bg-charcoal border border-emerald-600/25 rounded-2xl p-3 text-left active:scale-98 transition-all hover:border-emerald-500/50 group">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-active:bg-emerald-600/40 transition-colors">
                <CheckCircle size={16} className="text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-cream font-semibold text-sm">{c.name}</p>
                {c.description && <p className="text-mist text-xs mt-0.5 leading-relaxed line-clamp-2">{c.description}</p>}
              </div>
            </div>
          </button>
        ))}
        <button onClick={() => onSelect('__none__')}
          className="w-full bg-midnight border border-white/10 rounded-2xl p-3 text-left active:scale-98 transition-all">
          <p className="text-mist text-sm font-medium">None of these — keep asking questions</p>
        </button>
      </div>
    </div>
  )
}

export default function Chat() {
  const { user } = useApp()
  const { lang, tr } = useLang()
  const location = useLocation()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [session, setSession] = useState(null)
  const [done, setDone] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const sessionRef = useRef(null)

  const addMsg = useCallback((role, content, type = 'text') => {
    setMessages(m => [...m, { role, content, type, id: Date.now() + Math.random() }])
  }, [])

  const handleResponse = useCallback(async (response) => {
    setTyping(false)
    if (!response) return
    if (response.type === 'emergency') {
      addMsg('ai', response.message, 'emergency')
      setDone(true)
      return
    }
    if (response.type === 'follow_up') {
      if (response.empathy) addMsg('ai', response.empathy, 'text')
      addMsg('ai', { question: response.question, answers: response.answers, question_key: response.question_key }, 'follow_up')
      return
    }
    if (response.type === 'condition_select') {
      if (response.empathy) addMsg('ai', response.empathy, 'text')
      addMsg('ai', { message: response.message, candidates: response.candidates }, 'condition_select')
      return
    }
    if (response.type === 'result') {
      if (response.empathy) addMsg('ai', response.empathy, 'text')
      await saveSession({ user_id: user?.id, primary_condition: response.result.condition, confidence: response.result.confidence, symptoms: response.result.symptoms_detected, result: response.result, timestamp: Date.now() })
      addMsg('ai', response.result, 'result')
      setDone(true)
      return
    }
    if (response.type === 'clarify') {
      addMsg('ai', response.message, 'text')
    }
  }, [addMsg, user])

  const startSession = useCallback(() => {
    const s = new InferenceSession({ name: user?.name, age: user?.age, sex: user?.sex, location: user?.location })
    sessionRef.current = s
    setSession(s)
    setMessages([])
    setDone(false)
    setInput('')
    setTimeout(() => addMsg('ai', getGreeting(user?.name), 'text'), 300)
  }, [user, addMsg])

  useEffect(() => {
    startSession()
  }, [])

  // Handle initial message from Body Map navigation
  useEffect(() => {
    const initialMsg = location.state?.initialMessage
    if (initialMsg && sessionRef.current) {
      setTimeout(() => {
        sendMessage(initialMsg)
      }, 800)
    }
  }, [location.state])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const sendMessage = useCallback(async (text) => {
    const t = (text || input).trim()
    if (!t || !sessionRef.current || typing) return
    setInput('')
    addMsg('user', t, 'text')
    setMessages(m => m.filter(msg => msg.type !== 'follow_up'))
    setTyping(true)
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600))
    const response = sessionRef.current.process(t)
    handleResponse(response)
  }, [input, typing, addMsg, handleResponse])

  const answerFollowUp = useCallback(async (questionKey, answerKey) => {
    if (!sessionRef.current || typing) return
    const label = getAnswerLabelMap(lang)[answerKey] || answerKey.replace(/_/g, ' ')
    addMsg('user', label, 'text')
    setMessages(m => m.filter(msg => msg.type !== 'follow_up'))
    setTyping(true)
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400))
    const response = sessionRef.current.processFollowUpAnswer(questionKey, answerKey)
    handleResponse(response)
  }, [typing, addMsg, handleResponse])

  const selectCondition = useCallback(async (conditionKey) => {
    if (!sessionRef.current || typing) return
    setMessages(m => m.filter(msg => msg.type !== 'condition_select'))
    if (conditionKey === '__none__') {
      addMsg('user', 'None of these', 'text')
      setTyping(true)
      await new Promise(r => setTimeout(r, 500))
      addMsg('ai', 'No problem — please describe your symptoms in more detail and I\'ll re-assess. What else are you experiencing?', 'text')
      setTyping(false)
      // reset cycle so engine can ask more follow-ups
      if (sessionRef.current.memory) sessionRef.current.memory.cycle = 0
      return
    }
    const condName = conditionKey.replace(/_/g, ' ')
    addMsg('user', condName, 'text')
    setTyping(true)
    await new Promise(r => setTimeout(r, 700))
    const response = sessionRef.current.selectCondition(conditionKey)
    handleResponse(response)
  }, [typing, addMsg, handleResponse])

  return (
    <div className="h-full flex flex-col bg-midnight safe-top">
      {/* Header */}
      <div className="bg-charcoal border-b border-white/5 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
            <span className="text-lg">🩺</span>
          </div>
          <div>
            <p className="text-cream font-semibold text-sm">{tr('chat.ai.name')}</p>
            <p className="text-emerald-500 text-xs font-medium">{tr('chat.online')}</p>
          </div>
        </div>
        {done && (
          <button onClick={startSession}
            className="flex items-center gap-1.5 bg-midnight border border-white/10 rounded-xl px-3 py-1.5 text-mist text-xs font-medium active:scale-95 transition-all">
            <RefreshCw size={12} /> {tr('chat.new.check')}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            {msg.role === 'ai' && msg.type === 'text' && <div className="flex flex-col items-start gap-1"><div className="bubble-ai">{msg.content}</div><MessageAudioBtn text={msg.content} /></div>}
            {msg.role === 'ai' && msg.type === 'emergency' && <EmergencyBubble message={msg.content} label={tr('chat.emergency.title')} />}
            {msg.role === 'ai' && msg.type === 'follow_up' && (
              <FollowUpCards question={msg.content.question} answers={msg.content.answers} lang={lang}
                onAnswer={k => answerFollowUp(msg.content.question_key, k)} />
            )}
            {msg.role === 'ai' && msg.type === 'condition_select' && (
              <ConditionSelectCards message={msg.content.message} candidates={msg.content.candidates}
                onSelect={selectCondition} />
            )}
            {msg.role === 'ai' && msg.type === 'result' && <ConditionResult result={msg.content} />}
            {msg.role === 'user' && <div className="bubble-user">{msg.content}</div>}
          </div>
        ))}
        {typing && (
          <div className="flex justify-start animate-fade-in">
            <div className="bubble-ai"><TypingDots /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!done ? (
        <div className="bg-charcoal border-t border-white/5 px-4 py-3 flex-shrink-0 safe-bottom">
          <div className="flex items-end gap-2">
            <textarea ref={inputRef} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              {...{placeholder: tr('chat.placeholder')}} rows={1}
              className="flex-1 bg-midnight border border-white/10 rounded-2xl px-4 py-3 text-cream text-sm placeholder-mist/40 focus:outline-none focus:border-emerald-600 resize-none leading-relaxed transition-colors"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }} />
            <button onClick={() => sendMessage()} disabled={!input.trim() || typing}
              className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center shadow-btn active:scale-95 transition-all disabled:opacity-40 flex-shrink-0">
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-charcoal border-t border-white/5 px-4 py-3 flex-shrink-0 safe-bottom">
          <button onClick={startSession} className="btn-primary w-full flex items-center justify-center gap-2">
            <RefreshCw size={16} /> {tr('chat.start.new')}
          </button>
        </div>
      )}
    </div>
  )
}
