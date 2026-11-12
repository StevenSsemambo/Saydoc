import React, { createContext, useContext, useState, useEffect } from 'react'
import { t, LANGUAGES } from '../engine/LanguageEngine.js'
import { getPreferences, savePreferences } from '../db/database.js'
import { useApp } from './AppContext.jsx'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const { user } = useApp()
  const [lang, setLangState] = useState('en')
  const [hwMode, setHwModeState] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    getPreferences(user.id).then(prefs => {
      if (prefs?.lang) setLangState(prefs.lang)
      if (prefs?.hwMode) setHwModeState(prefs.hwMode)
    })
  }, [user?.id])

  const setLang = async (newLang) => {
    setLangState(newLang)
    if (user?.id) await savePreferences(user.id, { lang: newLang, hwMode })
  }

  const setHwMode = async (val) => {
    setHwModeState(val)
    if (user?.id) await savePreferences(user.id, { lang, hwMode: val })
  }

  // Translation shortcut
  const tr = (key, vars) => t(key, lang, vars)

  return (
    <LangContext.Provider value={{ lang, setLang, hwMode, setHwMode, tr, LANGUAGES }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
