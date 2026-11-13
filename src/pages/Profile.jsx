import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import { getSessions, getJournalEntries } from '../db/database.js'
import { analysePatterns } from '../engine/SoulEngine.js'
import { generateHealthReport } from '../utils/pdfExport.js'
import { User, Edit3, CheckCircle, Info, Shield, Wifi, Heart, Pill, Leaf, FileText, ChevronRight, Download, Settings, Stethoscope } from 'lucide-react'

export default function Profile() {
  const { user, updateUser } = useApp()
  const { tr, hwMode } = useLang()
  const nav = useNavigate()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', age: user?.age || '', sex: user?.sex || '', location: user?.location || '' })
  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)

  const save = async () => {
    await updateUser(form)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const exportPDF = async () => {
    if (!user?.id) return
    setExporting(true)
    try {
      const [sessions, journal, patterns] = await Promise.all([
        getSessions(user.id, 30),
        getJournalEntries(user.id, 30),
        analysePatterns(user.id),
      ])
      await generateHealthReport(user, sessions, journal, patterns)
      setExportDone(true)
      setTimeout(() => setExportDone(false), 3000)
    } catch (e) { console.error(e) }
    setExporting(false)
  }

  return (
    <div className="h-full overflow-y-auto bg-midnight safe-top pb-24">
      <div className="bg-charcoal px-5 pt-10 pb-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-3xl flex items-center justify-center shadow-glow">
            <User size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-display font-bold text-2xl text-cream">{user?.name || 'User'}</h1>
            <p className="text-mist text-sm">{user?.location || 'Uganda'}</p>
            {hwMode && <span className="badge-mist text-xs mt-1 inline-block">🩺 Health Worker</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => nav('/settings')} className="p-2 rounded-xl bg-midnight">
              <Settings size={16} className="text-mist" />
            </button>
            <button onClick={() => setEditing(e => !e)} className="p-2 rounded-xl bg-midnight">
              <Edit3 size={16} className="text-mist" />
            </button>
          </div>
        </div>

        {editing ? (
          <div className="space-y-3">
            <input className="input-field" placeholder={tr('onboard.name')} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <input className="input-field" placeholder={tr('onboard.age')} type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
              <div className="flex gap-2">
                {['male', 'female'].map(s => (
                  <button key={s} onClick={() => setForm(f => ({ ...f, sex: s }))}
                    className={`flex-1 py-3 rounded-2xl text-sm font-medium capitalize transition-all ${form.sex === s ? 'bg-emerald-600 text-white' : 'bg-midnight text-mist border border-white/10'}`}>
                    {s === 'male' ? tr('onboard.male') : tr('onboard.female')}
                  </button>
                ))}
              </div>
            </div>
            <input className="input-field" placeholder={tr('onboard.location')} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            <button onClick={save} className="btn-primary w-full flex items-center justify-center gap-2">
              {saved ? <><CheckCircle size={16} />{tr('journal.saved')}</> : tr('ui.save')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {[['Age', user?.age || '—', 'yrs'], ['Sex', user?.sex || '—', ''], ['Location', (user?.location || '—').split(',')[0], '']].map(([l, v, u]) => (
              <div key={l} className="bg-midnight rounded-2xl p-3 text-center">
                <p className="text-mist text-xs">{l}</p>
                <p className="text-cream font-bold text-sm capitalize mt-1 truncate">{v}</p>
                {u && <p className="text-mist text-xs">{u}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Export */}
        <button onClick={exportPDF} disabled={exporting}
          className="w-full bg-charcoal rounded-2xl p-4 flex items-center gap-3 active:scale-98 transition-all disabled:opacity-60">
          <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center">
            {exporting ? <div className="typing-dot" /> : exportDone ? <CheckCircle size={18} className="text-emerald-400" /> : <Download size={18} className="text-purple-400" />}
          </div>
          <div className="text-left">
            <p className="text-cream font-semibold text-sm">{tr('profile.export')}</p>
            <p className="text-mist text-xs">{exporting ? tr('profile.generating') : exportDone ? tr('profile.downloaded') : tr('profile.export.sub')}</p>
          </div>
          <FileText size={16} className="text-mist ml-auto" />
        </button>

        {/* Quick links */}
        {[
          { icon: Pill, color: 'text-blue-400', bg: 'bg-blue-500/15', title: tr('meds.title'), sub: '12 common medicines', to: '/medications' },
          { icon: Leaf, color: 'text-emerald-400', bg: 'bg-emerald-500/15', title: tr('remedy.title'), sub: '12 African plants', to: '/remedies' },
          ...(hwMode ? [{ icon: Stethoscope, color: 'text-blue-300', bg: 'bg-blue-600/15', title: 'Health Worker Assessment', sub: 'Clinical mode with ICD-10', to: '/healthworker' }] : []),
          { icon: Settings, color: 'text-mist', bg: 'bg-white/5', title: 'Settings & Language', sub: 'English, Luganda, Swahili', to: '/settings' },
        ].map(({ icon: Icon, color, bg, title, sub, to }) => (
          <button key={to} onClick={() => nav(to)}
            className="w-full bg-charcoal rounded-2xl p-4 flex items-center gap-3 active:scale-98 transition-all">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
              <Icon size={18} className={color} />
            </div>
            <div className="text-left flex-1">
              <p className="text-cream font-semibold text-sm">{title}</p>
              <p className="text-mist text-xs">{sub}</p>
            </div>
            <ChevronRight size={16} className="text-mist" />
          </button>
        ))}

        {/* Info cards */}
        {[
          { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/15', title: tr('profile.privacy'), desc: tr('profile.privacy.desc') },
          { icon: Wifi, color: 'text-purple-400', bg: 'bg-purple-500/15', title: tr('profile.offline'), desc: 'SayMyDoc works completely without internet. All AI and features run on your device.' },
          { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/15', title: 'About SayMyDoc', desc: 'Built by SayMyTech Developers in Kampala, Uganda. African-first health AI — designed for Africa, ready for the world.' },
          { icon: Info, color: 'text-yellow-400', bg: 'bg-yellow-500/15', title: tr('profile.disclaimer'), desc: tr('ui.disclaimer') },
        ].map(({ icon: Icon, color, bg, title, desc }) => (
          <div key={title} className="bg-charcoal rounded-3xl p-4 flex items-start gap-3">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-cream font-semibold text-sm mb-1">{title}</p>
              <p className="text-mist text-xs leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}

        <div className="text-center pt-2">
          <p className="text-mist/40 text-xs">SayMyDoc v{__APP_VERSION__}</p>
          <p className="text-mist/40 text-xs">39 conditions • 114 questions • 3 languages • 10 emergency flags</p>
          <p className="text-mist/40 text-xs">© 2026 SayMyTech Developers</p>
          <p className="text-emerald-700 text-xs mt-1 font-medium italic">"Because understanding your health is a human right."</p>
        </div>
      </div>
    </div>
  )
}
