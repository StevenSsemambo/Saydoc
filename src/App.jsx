import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext.jsx'
import { LangProvider } from './context/LangContext.jsx'
import BottomNav from './components/layout/BottomNav.jsx'
import Onboarding from './pages/Onboarding.jsx'
const Home = lazy(() => import('./pages/Home.jsx'))
const Chat = lazy(() => import('./pages/Chat.jsx'))
const Companion = lazy(() => import('./pages/Companion.jsx'))
const Journal = lazy(() => import('./pages/Journal.jsx'))
const Insights = lazy(() => import('./pages/Insights.jsx'))
const Library = lazy(() => import('./pages/Library.jsx'))
const FirstAid = lazy(() => import('./pages/FirstAid.jsx'))
const History = lazy(() => import('./pages/History.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const BodyMap = lazy(() => import('./pages/BodyMap.jsx'))
const MedicationRef = lazy(() => import('./pages/MedicationRef.jsx'))
const MedicationTracker = lazy(() => import('./pages/MedicationTracker.jsx'))
const RemedyLibrary = lazy(() => import('./pages/RemedyLibrary.jsx'))
const HealthWorker = lazy(() => import('./pages/HealthWorker.jsx'))
const ConditionDetail = lazy(() => import('./pages/ConditionDetail.jsx'))
const HealthTools = lazy(() => import('./pages/HealthTools.jsx'))
const NearbyClinics = lazy(() => import('./pages/NearbyClinics.jsx'))
import LoadingScreen from './components/ui/LoadingScreen.jsx'
import UpdateBanner from './components/ui/UpdateBanner.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('SayMyDoc crash:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position:'fixed', inset:0, background:'#0D1F1A', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px', padding:'32px', textAlign:'center' }}>
          <div style={{ width:'64px', height:'64px', borderRadius:'24px', background:'rgba(220,38,38,0.2)', border:'1px solid rgba(220,38,38,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:'28px' }}>⚠️</span>
          </div>
          <h1 style={{ fontWeight:'700', fontSize:'20px', color:'#F7FBF9', margin:0 }}>Something went wrong</h1>
          <p style={{ color:'#8BA99A', fontSize:'14px', lineHeight:'1.6', margin:0 }}>SayMyDoc encountered an error. Tap below to reload.</p>
          {this.state.error && (
            <p style={{ color:'#C0392B', fontSize:'11px', fontFamily:'monospace', background:'rgba(192,57,43,0.1)', padding:'8px 12px', borderRadius:'8px', maxWidth:'300px', wordBreak:'break-all', margin:0 }}>
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
            style={{ marginTop:'8px', background:'#00A86B', color:'white', fontWeight:'600', padding:'12px 24px', borderRadius:'16px', border:'none', fontSize:'15px', cursor:'pointer' }}>
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function AppRoutes() {
  const { loading, onboarded } = useApp()
  if (loading) return <LoadingScreen />
  if (!onboarded) return <Onboarding />
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="typing-dot" /></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/companion" element={<Companion />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/library" element={<Library />} />
          <Route path="/firstaid" element={<FirstAid />} />
          <Route path="/bodymap" element={<BodyMap />} />
          <Route path="/medications" element={<MedicationRef />} />
          <Route path="/tracker" element={<MedicationTracker />} />
          <Route path="/remedies" element={<RemedyLibrary />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/healthworker" element={<HealthWorker />} />
          <Route path="/condition/:key" element={<ConditionDetail />} />
          <Route path="/tools" element={<HealthTools />} />
          <Route path="/clinics" element={<NearbyClinics />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </Suspense>
      </div>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <LangProvider>
          <AppRoutes />
          <UpdateBanner />
        </LangProvider>
      </AppProvider>
    </ErrorBoundary>
  )
}
