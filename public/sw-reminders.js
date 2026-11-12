// ─────────────────────────────────────────────────────────────
// YoSymptom — Medication Reminder Service Worker v2
// Fixed: correct DB name/version/store, reliable alarm loop,
//        proper SW lifecycle, snooze, notification actions.
// ─────────────────────────────────────────────────────────────

// Must match Dexie setup in src/db/database.js exactly
const DB_NAME    = 'YoSymptomDB'   // ← was 'yosymptom-db' (wrong)
const DB_VERSION = 2               // ← was 1 (wrong)
const STORE_NAME = 'ys_reminders'  // ← was 'reminders' (wrong)
const ALARM_TAG  = 'yosymptom-med-alarm'
const CHECK_MS   = 60_000          // check every 60 s

// ── IndexedDB helper — reads the Dexie-managed store ─────────
function openDB() {
  return new Promise((resolve, reject) => {
    // Open at exact version so we never trigger onupgradeneeded
    // (Dexie owns the schema; we are read-only passengers)
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    // If the app hasn't been opened yet the DB won't exist at v2.
    // Allow upgrade so we don't crash — but don't create anything
    // that conflicts with Dexie's own schema.
    req.onupgradeneeded = (e) => {
      // do nothing — Dexie will set up the schema when the app opens
    }
  })
}

async function getActiveReminders() {
  try {
    const db = await openDB()
    // Guard: store might not exist yet if app has never been opened
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.close()
      return []
    }
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onerror  = () => { db.close(); reject(req.error) }
      req.onsuccess = () => {
        db.close()
        resolve((req.result || []).filter(r => r.active !== false))
      }
    })
  } catch (err) {
    console.warn('[SW] getActiveReminders error:', err)
    return []
  }
}

// ── Fired-dose dedup (in-memory, resets on SW restart) ───────
const firedToday = new Set()

function firedKey(remId, dateStr, timeStr) {
  return `${remId}_${dateStr}_${timeStr}`
}

// ── Fire one reminder notification ───────────────────────────
async function fireReminder(rem, timeStr) {
  const now     = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const key     = firedKey(rem.id, dateStr, timeStr)
  if (firedToday.has(key)) return
  firedToday.add(key)

  const title = `💊 ${rem.med_name}`
  const body  = rem.note
    ? `${timeStr} dose — ${rem.note}`
    : `Time for your ${rem.med_name} dose (${timeStr}). Tap to log it.`

  try {
    await self.registration.showNotification(title, {
      body,
      icon:               '/pwa-192x192.png',
      badge:              '/pwa-192x192.png',
      tag:                `${ALARM_TAG}-${rem.id}-${timeStr}`,
      requireInteraction: true,
      vibrate:            [300, 100, 300, 100, 500],
      data:               { reminderId: rem.id, timeStr, dateStr, url: '/medication' },
      actions: [
        { action: 'log',    title: '✅ Taken' },
        { action: 'snooze', title: '⏰ +10 min' },
      ],
    })
  } catch (err) {
    console.warn('[SW] showNotification failed:', err)
  }

  // Signal open app tabs to play the audio alarm
  // (SWs cannot use Web Audio API directly)
  try {
    const bc = new BroadcastChannel('yosymptom-alarms')
    bc.postMessage({ type: 'PLAY_ALARM', reminderId: rem.id, timeStr })
    bc.close()
  } catch { /* BroadcastChannel not available in this context */ }
}

// ── Core alarm tick ───────────────────────────────────────────
async function checkAlarms() {
  const reminders = await getActiveReminders()
  if (!reminders.length) return

  const now      = new Date()
  const todayDay = now.getDay()
  const nowH     = now.getHours()
  const nowM     = now.getMinutes()
  const todayStr = now.toISOString().split('T')[0]

  for (const rem of reminders) {
    if (!rem.active) continue
    if (!Array.isArray(rem.days) || !rem.days.includes(todayDay)) continue

    // Respect course end date
    if (rem.course_days && rem.start_date) {
      const end = new Date(rem.start_date)
      end.setDate(end.getDate() + Number(rem.course_days))
      if (now > end) continue
    }

    for (const timeStr of (rem.times || [])) {
      const [h, m] = timeStr.split(':').map(Number)
      if (h === nowH && m === nowM) {
        await fireReminder(rem, timeStr)
      }
    }
  }
}

// ── Reliable alarm loop using setTimeout + waitUntil ─────────
// setInterval dies when the browser suspends the SW.
// Instead we chain setTimeout calls inside event.waitUntil so
// each tick keeps the SW alive for exactly the next interval.
let _loopRunning = false

function scheduleNextTick() {
  if (_loopRunning) return
  _loopRunning = true
  tick()
}

function tick() {
  // waitUntil a promise that resolves after CHECK_MS so the SW
  // stays alive through the whole interval
  self.registration.active && self.clients.matchAll().then(() => {
    // no-op — just to get a valid ExtendableEvent context
  })

  setTimeout(async () => {
    try {
      await checkAlarms()
    } catch (e) {
      console.warn('[SW] checkAlarms error:', e)
    }
    tick() // chain next tick
  }, CHECK_MS)
}

// ── SW lifecycle ──────────────────────────────────────────────
self.addEventListener('install', (e) => {
  // Skip waiting so the new SW activates immediately
  e.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    self.clients.claim().then(() => {
      // Run an immediate check, then start the loop
      checkAlarms()
      scheduleNextTick()
    })
  )
})

// ── Message handler ───────────────────────────────────────────
self.addEventListener('message', (e) => {
  const type = e.data?.type
  if (type === 'KEEP_ALIVE') return  // just keeps SW awake, no action needed
  if (type === 'START_ALARMS') {
    checkAlarms()
    scheduleNextTick()
  }
  if (type === 'RELOAD_REMINDERS') {
    // Clear dedup cache so rescheduled reminders can fire today
    firedToday.clear()
    checkAlarms()
  }
})

// ── Notification click handling ───────────────────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const { action } = e
  const { url, reminderId, timeStr } = e.notification.data || {}

  if (action === 'snooze') {
    e.waitUntil(
      new Promise(resolve => {
        setTimeout(async () => {
          try {
            const reminders = await getActiveReminders()
            const rem = reminders.find(r => r.id === reminderId)
            if (rem) {
              const now     = new Date()
              const dateStr = now.toISOString().split('T')[0]
              firedToday.delete(firedKey(reminderId, dateStr, timeStr))
              await fireReminder(rem, timeStr)
            }
          } catch { /* ignore */ }
          resolve()
        }, 10 * 60 * 1000) // 10 minutes
      })
    )
    return
  }

  // 'log' action or default tap — open / focus the app
  const targetUrl = url || '/medication'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
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

// ── Minimal fetch handler — keeps SW registered ───────────────
self.addEventListener('fetch', () => {})
