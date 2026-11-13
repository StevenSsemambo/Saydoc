// ─────────────────────────────────────────────────────────────
// SayMyDoc — Unified Service Worker  (FIXED)
// ─────────────────────────────────────────────────────────────
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST || [])

registerRoute(
  ({ request }) => request.destination === 'script' || /\.json$/i.test(request.url),
  new NetworkFirst({
    cacheName: 'knowledge-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 })],
  })
)

// ─────────────────────────────────────────────────────────────
// MEDICATION ALARM ENGINE
// ─────────────────────────────────────────────────────────────

const DB_NAME    = 'YoSymptomDB'
const REM_STORE  = 'ys_reminders'
const PREF_STORE = 'ys_preferences'
const ALARM_TAG  = 'saymydoc-med-alarm'

function openDB() {
  return new Promise((resolve, reject) => {
    // No version → open whatever version the app (Dexie) has created, so a future
    // schema bump can never make this fail with a VersionError.
    const req = indexedDB.open(DB_NAME)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    // The DB does not exist yet (app never opened): do NOT create an empty one
    // here — that would interfere with Dexie's own first-run setup.
    req.onupgradeneeded = (e) => { try { e.target.transaction.abort() } catch { /* already aborted */ } }
  })
}

function readAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) { resolve([]); return }
    const tx  = db.transaction(storeName, 'readonly')
    const req = tx.objectStore(storeName).getAll()
    req.onerror   = () => reject(req.error)
    req.onsuccess = () => resolve(req.result || [])
  })
}

async function getActiveReminders() {
  try {
    const db   = await openDB()
    const rems = await readAllFromStore(db, REM_STORE)
    db.close()
    return rems.filter(r => r.active !== false)
  } catch (e) { console.warn('[YoSW] getActiveReminders:', e); return [] }
}

async function getAlarmSoundDataUrl() {
  try {
    const db    = await openDB()
    const prefs = await readAllFromStore(db, PREF_STORE)
    db.close()
    for (const p of prefs) {
      if (p.alarm_sound_data) return p.alarm_sound_data
    }
  } catch { /* best-effort: failure is fine */ }
  return null
}

// ── FIX Bug 3: Persistent dedup via IDB (replaces in-memory Set) ──────────
// The old firedToday Set was wiped every time the SW restarted (which is frequent).
// Now fired keys survive SW restarts via a dedicated IDB store.
function openFiredDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('YoSymptomAlarmFired', 1)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('ys_alarm_fired')) {
        const store = db.createObjectStore('ys_alarm_fired', { keyPath: 'key' })
        store.createIndex('fired_at', 'fired_at')
      }
    }
    req.onerror   = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
  })
}

async function hasFired(key) {
  try {
    const db = await openFiredDB()
    return await new Promise((resolve) => {
      const req = db.transaction('ys_alarm_fired', 'readonly')
                    .objectStore('ys_alarm_fired').get(key)
      req.onsuccess = () => resolve(!!req.result)
      req.onerror   = () => resolve(false)
    })
  } catch { return false }
}

async function markFired(key) {
  try {
    const db = await openFiredDB()
    await new Promise((resolve, reject) => {
      const req = db.transaction('ys_alarm_fired', 'readwrite')
                    .objectStore('ys_alarm_fired').put({ key, fired_at: Date.now() })
      req.onsuccess = () => resolve()
      req.onerror   = () => reject(req.error)
    })
    // Prune entries older than 2 days
    const cutoff = Date.now() - 2 * 86_400_000
    const cleanTx = db.transaction('ys_alarm_fired', 'readwrite')
    cleanTx.objectStore('ys_alarm_fired').index('fired_at')
      .openCursor(IDBKeyRange.upperBound(cutoff)).onsuccess = function(e) {
        const c = e.target.result
        if (c) { c.delete(); c.continue() }
      }
  } catch { /* best-effort: failure is fine */ }
}

function firedKey(remId, dateStr, timeStr) { return `${remId}|${dateStr}|${timeStr}` }

// ── Fire notification ────────────────────────────────────────
async function fireReminder(rem, timeStr) {
  const now     = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const key     = firedKey(rem.id, dateStr, timeStr)
  if (await hasFired(key)) return
  await markFired(key)

  const title = `💊 ${rem.med_name}`
  const body  = rem.note
    ? `${timeStr} dose — ${rem.note}`
    : `Time for your ${rem.med_name} (${timeStr}). Tap to log it.`

  try {
    await self.registration.showNotification(title, {
      body,
      icon:               '/pwa-192x192.png',
      badge:              '/pwa-192x192.png',
      tag:                `${ALARM_TAG}-${rem.id}-${timeStr}`,
      requireInteraction: true,
      vibrate:            [400, 150, 400, 150, 600],
      data:               { reminderId: rem.id, timeStr, dateStr, url: '/medication' },
      actions: [
        { action: 'log',    title: '✅ Taken' },
        { action: 'snooze', title: '⏰ Snooze 10 min' },
      ],
    })
  } catch (err) { console.warn('[YoSW] showNotification failed:', err) }

  try {
    const soundData = await getAlarmSoundDataUrl()
    const bc = new BroadcastChannel('saymydoc-alarms')
    bc.postMessage({ type: 'PLAY_ALARM', reminderId: rem.id, timeStr, soundData })
    bc.close()
  } catch { /* best-effort: failure is fine */ }
}

// ── Alarm check tick ──────────────────────────────────────────
async function checkAlarms() {
  const reminders = await getActiveReminders()
  if (!reminders.length) return
  const now      = new Date()
  const todayDay = now.getDay()
  const nowH     = now.getHours()
  const nowM     = now.getMinutes()
  for (const rem of reminders) {
    if (!rem.active) continue
    if (!Array.isArray(rem.days) || !rem.days.includes(todayDay)) continue
    if (rem.course_days && rem.start_date) {
      const end = new Date(rem.start_date)
      end.setDate(end.getDate() + Number(rem.course_days))
      if (now > end) continue
    }
    for (const timeStr of (rem.times || [])) {
      const [h, m] = timeStr.split(':').map(Number)
      if (h === nowH && m === nowM) await fireReminder(rem, timeStr)
    }
  }
}

// ── FIX Bug 1: Reliable alarm loop ───────────────────────────
// OLD: setTimeout chain — browser kills it when SW idles. Alarms never fire.
// NEW: setInterval (more resilient) + precise per-reminder setTimeout so
//      the alarm fires exactly at the right second, not depending only on the interval.
let _alarmInterval = null

function startAlarmLoop() {
  if (_alarmInterval) clearInterval(_alarmInterval)
  // Check every 55s to never miss a minute boundary
  _alarmInterval = setInterval(async () => {
    try { await checkAlarms() } catch (e) { console.warn('[YoSW] tick error:', e) }
  }, 55_000)
}

// Schedule a precise setTimeout for each upcoming alarm today
async function schedulePreciseAlarms() {
  const reminders = await getActiveReminders()
  if (!reminders.length) return
  const now      = new Date()
  const todayDay = now.getDay()
  for (const rem of reminders) {
    if (!rem.active) continue
    if (!Array.isArray(rem.days) || !rem.days.includes(todayDay)) continue
    if (rem.course_days && rem.start_date) {
      const end = new Date(rem.start_date)
      end.setDate(end.getDate() + Number(rem.course_days))
      if (now > end) continue
    }
    for (const timeStr of (rem.times || [])) {
      const [h, m] = timeStr.split(':').map(Number)
      const fireAt = new Date(); fireAt.setHours(h, m, 0, 0)
      const delay  = fireAt - now
      if (delay > 0 && delay < 86_400_000) {
        setTimeout(async () => {
          try { await fireReminder(rem, timeStr) } catch { /* best-effort: failure is fine */ }
        }, delay)
      }
    }
  }
}

// ── SW lifecycle ──────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    self.clients.claim().then(async () => {
      await checkAlarms()
      startAlarmLoop()
      await schedulePreciseAlarms()
    })
  )
})

self.addEventListener('message', (e) => {
  const type = e.data?.type
  if (type === 'KEEP_ALIVE') return
  if (type === 'START_ALARMS' || type === 'RELOAD_REMINDERS') {
    checkAlarms().catch(() => {})
    startAlarmLoop()
    schedulePreciseAlarms().catch(() => {})
  }
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const { action } = e
  const { url, reminderId, timeStr } = e.notification.data || {}

  if (action === 'snooze') {
    e.waitUntil(new Promise(resolve => {
      setTimeout(async () => {
        try {
          const rems = await getActiveReminders()
          const rem  = rems.find(r => r.id === reminderId)
          if (rem) {
            // Build a fresh snooze key so IDB dedup doesn't block it
            const now      = new Date()
            const dateStr  = now.toISOString().split('T')[0]
            const snoozeTs = `snooze-${Date.now()}`
            const snoozeKey = `${reminderId}|${dateStr}|${timeStr}|${snoozeTs}`
            await markFired(snoozeKey)
            await self.registration.showNotification(`💊 ${rem.med_name}`, {
              body:               `Snoozed — ${timeStr} dose.`,
              icon:               '/pwa-192x192.png',
              badge:              '/pwa-192x192.png',
              tag:                `${ALARM_TAG}-snooze-${reminderId}`,
              requireInteraction: true,
              vibrate:            [400, 150, 400, 150, 600],
              data:               { reminderId, timeStr, url: '/medication' },
            })
          }
        } catch { /* best-effort: failure is fine */ }
        resolve()
      }, 10 * 60 * 1000)
    }))
    return
  }

  const targetUrl = url || '/medication'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus()
          client.postMessage({ type: 'OPEN_LOG', reminderId, timeStr })
          return
        }
      }
      return self.clients.openWindow(targetUrl)
    })
  )
})
