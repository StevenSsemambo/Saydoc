import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import { CompanionSession, PERSONALITY } from '../engine/CompanionBrain.js'
import { getQuickTopics } from '../engine/LanguageEngine.js'
import { useNavigate } from 'react-router-dom'
import { Send, RefreshCw, Sparkles, MessageCircle, BookOpen, Pill, Leaf, Heart, ChevronRight } from 'lucide-react'
import { VoiceInputInline } from '../components/ui/VoiceInput.jsx'
import { MessageAudioBtn } from '../components/ui/AudioReader.jsx'
import { askAI, aiAvailable, parseAIReply, useAIStatus } from '../utils/aiClient.js'

function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center py-1">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  )
}

function SuggestionChips({ suggestions, onSelect }) {
  if (!suggestions?.length) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {suggestions.slice(0, 4).map((s, i) => (
        <button key={i} onClick={() => onSelect(s)}
          className="bg-emerald-600/15 border border-emerald-600/25 text-emerald-300 text-xs px-3 py-1.5 rounded-2xl active:scale-95 transition-all font-medium">
          {s}
        </button>
      ))}
    </div>
  )
}

function MessageBubble({ msg, onSuggestion }) {
  const isAI = msg.role === 'ai'

  // Escape first: AI replies are untrusted text and this is rendered as HTML.
  const formatMessage = (text) => {
    if (!text) return text
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>')
      .replace(/•\s/g, '• ')
  }

  if (!isAI) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="bubble-user">{msg.text}</div>
      </div>
    )
  }

  if (msg.type === 'crisis') {
    return (
      <div className="bg-red-900/60 border border-red-500/40 rounded-3xl p-4 animate-slide-up">
        <p className="text-red-200 text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1 animate-slide-up">
      <div className="bubble-ai">
        <span dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
      </div>
      <div className="flex items-center gap-2 pl-1">
        <MessageAudioBtn text={msg.text} />
        {msg.suggestions && <SuggestionChips suggestions={msg.suggestions} onSelect={onSuggestion} />}
      </div>
    </div>
  )
}


export default function Companion() {
  const { user } = useApp()
  const { lang, tr } = useLang()
  const nav = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [showQuick, setShowQuick] = useState(true)
  const sessionRef = useRef(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const convoRef = useRef([]) // {role:'user'|'assistant', content} sent to the online AI
  const aiStatus = useAIStatus()

  const addMsg = useCallback((role, data) => {
    const msg = typeof data === 'string'
      ? { role, text: data, type: 'text', id: Date.now() + Math.random() }
      : { role, ...data, id: Date.now() + Math.random() }
    setMessages(m => [...m, msg])
  }, [])

  const handleResponse = useCallback((response) => {
    setTyping(false)
    if (!response) return

    if (response.type === 'crisis') {
      addMsg('ai', { text: response.message, type: 'crisis' })
      return
    }

    if (response.type === 'redirect_to_checker') {
      addMsg('ai', {
        text: response.message,
        type: 'companion',
        suggestions: ['Open Symptom Checker'],
        action: 'redirect_checker',
      })
      return
    }

    addMsg('ai', {
      text: response.message,
      type: 'companion',
      suggestions: response.suggestions,
    })
  }, [addMsg])

  const startSession = useCallback(() => {
    sessionRef.current = new CompanionSession({
      name: user?.name, age: user?.age, sex: user?.sex,
      location: user?.location, lang
    })
    setMessages([])
    setShowQuick(true)
    setInput('')
    convoRef.current = []

    setTimeout(() => {
      const response = sessionRef.current.respond(`hello ${user?.name || ''}`)
      addMsg('ai', {
        text: response.message,
        type: 'companion',
        suggestions: response.suggestions,
      })
    }, 400)
  }, [user, lang, addMsg])

  useEffect(() => { startSession() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  const sendMessage = useCallback(async (text) => {
    const t = (text || input).trim()
    if (!t || !sessionRef.current || typing) return
    setInput('')
    setShowQuick(false)
    addMsg('user', { text: t, type: 'text' })
    setTyping(true)

    await new Promise(r => setTimeout(r, 600 + Math.random() * 800))

    // Special action handling
    if (t === 'Open Symptom Checker') {
      setTyping(false)
      nav('/chat')
      return
    }

    // 1. Offline engine runs first: instant, and it owns crisis detection.
    const response = sessionRef.current.respond(t)

    if (response?.type === 'crisis' || response?.type === 'redirect_to_checker') {
      handleResponse(response)
      return
    }

    // 2. Online AI (Gemini → Groq, handled server-side). The offline answer
    //    is passed along as verified grounding.
    convoRef.current.push({ role: 'user', content: t })
    if (aiAvailable()) {
      const ai = await askAI({
        mode: 'companion',
        lang,
        messages: convoRef.current,
        profile: user,
        grounding: response?.message,
      })
      if (ai) {
        const { text, suggestions, wantsChecker } = parseAIReply(ai.text)
        if (text) {
          convoRef.current.push({ role: 'assistant', content: text })
          const chips = [...suggestions]
          if (wantsChecker) chips.push('Open Symptom Checker')
          setTyping(false)
          addMsg('ai', { text, type: 'companion', suggestions: chips })
          return
        }
      }
    }

    // 3. Offline / AI failed → rule-based answer.
    if (response?.message) convoRef.current.push({ role: 'assistant', content: response.message })
    handleResponse(response)
  }, [input, typing, addMsg, handleResponse, nav, lang, user])

  const handleSuggestion = useCallback((suggestion) => {
    if (suggestion === 'Open Symptom Checker') { nav('/chat'); return }
    sendMessage(suggestion)
  }, [sendMessage, nav])

  return (
    <div className="h-full flex flex-col bg-midnight safe-top">
      {/* Header */}
      <div className="bg-charcoal border-b border-white/5 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-800 rounded-2xl flex items-center justify-center shadow-glow">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <p className="text-cream font-semibold text-sm">{tr('companion.header.name')}</p>
            <p className="text-emerald-500 text-xs font-medium">
              {aiStatus === 'online' ? tr('ai.status.online') : aiStatus === 'checking' ? tr('companion.header.status') : tr('ai.status.offline')}
            </p>
          </div>
        </div>
        <button onClick={startSession}
          className="flex items-center gap-1.5 bg-midnight border border-white/10 rounded-xl px-3 py-1.5 text-mist text-xs font-medium active:scale-95 transition-all">
          <RefreshCw size={12} /> New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} onSuggestion={handleSuggestion} />
        ))}

        {/* Quick topic chips (shown at start) */}
        {showQuick && messages.length <= 1 && (
          <div className="animate-fade-in">
            <p className="label-text mb-3">{tr('companion.what.know')}</p>
            <div className="grid grid-cols-3 gap-2">
              {getQuickTopics(lang).map(({ icon, labelKey, prompt }) => (
                <button key={labelKey} onClick={() => sendMessage(prompt)}
                  className="bg-charcoal rounded-2xl p-2.5 flex items-center gap-2 active:scale-95 transition-all text-left">
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <span className="text-cream text-xs font-medium leading-tight">{tr(labelKey)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {typing && (
          <div className="flex justify-start animate-fade-in">
            <div className="bubble-ai"><TypingDots /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-charcoal border-t border-white/5 px-4 py-3 flex-shrink-0 safe-bottom">
        <div className="flex items-end gap-2">
          <VoiceInputInline onResult={(t) => { setInput(i => i + (i ? ' ' : '') + t); inputRef.current?.focus() }} lang={lang} disabled={typing} />
          <textarea ref={inputRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder={tr('companion.input.hint')}
            rows={1}
            className="flex-1 bg-midnight border border-white/10 rounded-2xl px-4 py-3 text-cream text-sm placeholder-mist/40 focus:outline-none focus:border-emerald-600 resize-none leading-relaxed transition-colors"
            style={{ minHeight: '44px', maxHeight: '120px' }}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }} />
          <button onClick={() => sendMessage()} disabled={!input.trim() || typing}
            className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-btn active:scale-95 transition-all disabled:opacity-40 flex-shrink-0">
            <Send size={18} className="text-white" />
          </button>
        </div>
        <p className="text-mist/30 text-xs text-center mt-2">{tr('companion.disclaimer')}</p>
      </div>
    </div>
  )
}
