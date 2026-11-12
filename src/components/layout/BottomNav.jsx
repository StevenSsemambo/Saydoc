import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, MessageCircle, Sparkles, Stethoscope, User } from 'lucide-react'
import { useLang } from '../../context/LangContext.jsx'

const TABS = [
  { to: '/',          icon: Home,          label_en: 'Home',    label_lg: 'Awaka',        color: 'emerald' },
  { to: '/chat',      icon: MessageCircle, label_en: 'Check',   label_lg: 'Kebera',       color: 'emerald' },
  { to: '/companion', icon: Sparkles,      label_en: 'Yolanda', label_lg: 'Yolanda',      color: 'purple'  },
  { to: '/tools',     icon: Stethoscope,   label_en: 'Tools',   label_lg: 'Ebikozesebwa', color: 'amber'   },
  { to: '/profile',   icon: User,          label_en: 'Profile', label_lg: 'Ebikungu',     color: 'emerald' },
]

const ACCENT = {
  emerald: { text: '#00A86B', bg: 'bg-emerald-600/15' },
  purple:  { text: '#a78bfa', bg: 'bg-purple-500/15'  },
  amber:   { text: '#f59e0b', bg: 'bg-amber-500/15'   },
  red:     { text: '#f87171', bg: 'bg-red-500/15'     },
}

export default function BottomNav() {
  const loc = useLocation()
  const { lang } = useLang()

  return (
    <nav className="bg-charcoal border-t border-white/5 safe-bottom flex-shrink-0">
      <div className="flex items-center justify-around px-1 py-1.5">
        {TABS.map(({ to, icon: Icon, label_en, label_lg, color }) => {
          const active = loc.pathname === to || (to !== '/' && loc.pathname.startsWith(to))
          const accent = ACCENT[color] || ACCENT.emerald
          const label = lang === 'lg' ? label_lg : label_en
          return (
            <NavLink key={to} to={to}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-2xl transition-all duration-200 min-w-0"
              style={active ? { color: accent.text } : { color: '#8BA99A' }}>
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${active ? accent.bg : ''}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className={`text-[9px] font-medium leading-none truncate max-w-[52px] text-center ${active ? 'font-semibold' : ''}`}>
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
