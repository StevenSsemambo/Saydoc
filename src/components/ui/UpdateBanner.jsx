import React, { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

// Shows "new version ready" when the service worker has been replaced while the app
// is open (or a lazy page chunk can no longer be found because the old version was
// cleaned up). Never reloads on its own — that could discard something being typed.
const STALE_CHUNK = /dynamically imported module|importing a module script failed|loading chunk|failed to fetch dynamically/i
const CHECK_EVERY_MS = 60 * 60 * 1000

export default function UpdateBanner() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : null
    const cleanups = []

    if (sw) {
      const hadController = !!sw.controller
      const onChange = () => { if (hadController) setReady(true) } // first install is not an "update"
      sw.addEventListener('controllerchange', onChange)
      cleanups.push(() => sw.removeEventListener('controllerchange', onChange))

      // Look for a new version when the app comes back to the foreground, and hourly.
      const check = () => sw.getRegistration().then(r => r?.update()).catch(() => {})
      const onVisible = () => { if (document.visibilityState === 'visible') check() }
      document.addEventListener('visibilitychange', onVisible)
      const timer = setInterval(check, CHECK_EVERY_MS)
      cleanups.push(() => { document.removeEventListener('visibilitychange', onVisible); clearInterval(timer) })
    }

    const onReject = (e) => { if (STALE_CHUNK.test(String(e?.reason?.message || e?.reason || ''))) setReady(true) }
    window.addEventListener('unhandledrejection', onReject)
    cleanups.push(() => window.removeEventListener('unhandledrejection', onReject))

    return () => cleanups.forEach(fn => fn())
  }, [])

  if (!ready) return null
  return (
    <div role="status" className="fixed left-3 right-3 bottom-24 z-50 mx-auto max-w-md rounded-2xl bg-emerald-700 text-white shadow-lg px-4 py-3 flex items-center gap-3">
      <RefreshCw size={18} className="shrink-0" />
      <p className="text-sm flex-1">A new version of SayMyDoc is ready.</p>
      <button onClick={() => window.location.reload()} className="text-sm font-semibold bg-white/20 rounded-xl px-3 py-1.5">Update</button>
    </div>
  )
}
