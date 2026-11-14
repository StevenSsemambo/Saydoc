import React, { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useLang } from '../../context/LangContext.jsx'
import { isAIEnabled, setAIEnabled } from '../../utils/aiClient.js'

const ACK_KEY = 'saymydoc_ai_notice_ack'
const seen = () => { try { return localStorage.getItem(ACK_KEY) === '1' } catch { return false } }

/** One-time, dismissible privacy notice about the online AI. */
export default function AINotice() {
  const { tr } = useLang()
  const [hidden, setHidden] = useState(() => seen() || !isAIEnabled())
  if (hidden) return null

  const ack = (turnOff) => {
    try { localStorage.setItem(ACK_KEY, '1') } catch { /* shows again next visit */ }
    if (turnOff) setAIEnabled(false)
    setHidden(true)
  }

  return (
    <div className="mx-1 mb-3 rounded-2xl border border-emerald-700/30 bg-emerald-950/30 p-3">
      <div className="flex gap-2">
        <ShieldCheck size={16} className="text-emerald-400 mt-0.5 shrink-0" />
        <p className="text-emerald-100/80 text-xs leading-relaxed">{tr('ai.notice.text')}</p>
      </div>
      <div className="flex gap-2 mt-2.5 justify-end">
        <button onClick={() => ack(true)} className="text-xs text-mist px-3 py-1.5 rounded-xl border border-white/10">{tr('ai.notice.off')}</button>
        <button onClick={() => ack(false)} className="text-xs font-semibold text-white bg-emerald-600 px-3 py-1.5 rounded-xl">{tr('ai.notice.ok')}</button>
      </div>
    </div>
  )
}
