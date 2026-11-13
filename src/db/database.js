import Dexie from 'dexie'

// NOTE: the database keeps its original name (from the app's earlier "YoSymptom" days).
// Renaming it would orphan every existing user's saved data, so do not change it
// without writing a migration. The service worker (src/sw.js) opens the same name.
export const db = new Dexie('YoSymptomDB')

db.version(1).stores({
  ys_users:      '++id, created_at',
  ys_sessions:   '++id, user_id, timestamp, primary_condition',
  ys_journal:    '++id, user_id, date',
  ys_triggers:   '++id, user_id, trigger_name',
  ys_conditions: '++id, user_id, condition_key',
  ys_medications:'++id, user_id, name',
  ys_patterns:   '++id, user_id, pattern_type, detected_at',
  ys_chat:       '++id, user_id, timestamp',
  ys_preferences:'++id, user_id',
})

// v2 — adds medication reminders + adherence tracking
db.version(2).stores({
  ys_users:      '++id, created_at',
  ys_sessions:   '++id, user_id, timestamp, primary_condition',
  ys_journal:    '++id, user_id, date',
  ys_triggers:   '++id, user_id, trigger_name',
  ys_conditions: '++id, user_id, condition_key',
  ys_medications:'++id, user_id, name',
  ys_patterns:   '++id, user_id, pattern_type, detected_at',
  ys_chat:       '++id, user_id, timestamp',
  ys_preferences:'++id, user_id',
  ys_reminders:  '++id, user_id, med_id, active',
  ys_adherence:  '++id, user_id, reminder_id, date, taken_at',
})

// ── Users ──────────────────────────────────────────────────────

export async function getUser() {
  return db.ys_users.orderBy('id').first()
}

export async function saveUser(data) {
  const existing = await getUser()
  if (existing) {
    await db.ys_users.update(existing.id, { ...data, updated_at: Date.now() })
    return existing.id
  }
  return db.ys_users.add({ ...data, created_at: Date.now() })
}

// ── Sessions ───────────────────────────────────────────────────

export async function saveSession(session) {
  return db.ys_sessions.add({ ...session, timestamp: Date.now() })
}

export async function getSessions(userId, limit = 20) {
  return db.ys_sessions
    .where('user_id').equals(userId)
    .reverse()
    .limit(limit)
    .toArray()
}

// ── Journal ────────────────────────────────────────────────────

export async function saveJournalEntry(entry) {
  const existing = await db.ys_journal
    .where('user_id').equals(entry.user_id)
    .and(e => e.date === entry.date)
    .first()
  if (existing) {
    await db.ys_journal.update(existing.id, entry)
    return existing.id
  }
  return db.ys_journal.add(entry)
}

export async function getJournalEntries(userId, days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().split('T')[0]
  return db.ys_journal
    .where('user_id').equals(userId)
    .and(e => e.date >= sinceStr)
    .reverse()
    .toArray()
}

export async function getTodayJournal(userId) {
  const today = new Date().toISOString().split('T')[0]
  return db.ys_journal
    .where('user_id').equals(userId)
    .and(e => e.date === today)
    .first()
}

// ── Chat ───────────────────────────────────────────────────────

export async function saveChatMessage(msg) {
  return db.ys_chat.add({ ...msg, timestamp: Date.now() })
}

export async function getChatHistory(userId, limit = 100) {
  return db.ys_chat
    .where('user_id').equals(userId)
    .reverse()
    .limit(limit)
    .toArray()
    .then(r => r.reverse())
}

// ── Triggers ───────────────────────────────────────────────────

export async function saveTrigger(trigger) {
  return db.ys_triggers.add({ ...trigger, first_detected: Date.now() })
}

export async function getTriggers(userId) {
  return db.ys_triggers.where('user_id').equals(userId).toArray()
}

// ── Preferences ────────────────────────────────────────────────

export async function getPreferences(userId) {
  return db.ys_preferences.where('user_id').equals(userId).first()
}

export async function savePreferences(userId, prefs) {
  const existing = await getPreferences(userId)
  if (existing) {
    await db.ys_preferences.update(existing.id, prefs)
  } else {
    await db.ys_preferences.add({ user_id: userId, ...prefs })
  }
}

// ── Medication Reminders ───────────────────────────────────────
// Reminder shape:
// { id, user_id, med_id, med_name, times: ['08:00','20:00'],
//   days: [0,1,2,3,4,5,6], note, active, course_days, start_date }

export async function saveReminder(reminder) {
  if (reminder.id) {
    await db.ys_reminders.update(reminder.id, { ...reminder, updated_at: Date.now() })
    return reminder.id
  }
  return db.ys_reminders.add({ ...reminder, created_at: Date.now() })
}

export async function getReminders(userId) {
  return db.ys_reminders
    .where('user_id').equals(userId)
    .toArray()
}

export async function deleteReminder(id) {
  // Also delete adherence logs for this reminder
  const logs = await db.ys_adherence.where('reminder_id').equals(id).toArray()
  await Promise.all(logs.map(l => db.ys_adherence.delete(l.id)))
  return db.ys_reminders.delete(id)
}

// ── Adherence Logs ─────────────────────────────────────────────
// Log shape: { id, user_id, reminder_id, date (YYYY-MM-DD), time_slot, taken_at }

export async function logDose(userId, reminderId, date, timeSlot) {
  const existing = await db.ys_adherence
    .where('reminder_id').equals(reminderId)
    .and(r => r.date === date && r.time_slot === timeSlot)
    .first()
  if (existing) return existing.id
  return db.ys_adherence.add({
    user_id: userId,
    reminder_id: reminderId,
    date,
    time_slot: timeSlot,
    taken_at: Date.now(),
  })
}

export async function unlogDose(userId, reminderId, date, timeSlot) {
  const existing = await db.ys_adherence
    .where('reminder_id').equals(reminderId)
    .and(r => r.date === date && r.time_slot === timeSlot)
    .first()
  if (existing) await db.ys_adherence.delete(existing.id)
}

export async function getAdherenceLogs(userId, days = 60) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().split('T')[0]
  return db.ys_adherence
    .where('user_id').equals(userId)
    .and(r => r.date >= sinceStr)
    .toArray()
}

export async function getTodayAdherence(userId) {
  const today = new Date().toISOString().split('T')[0]
  return db.ys_adherence
    .where('user_id').equals(userId)
    .and(r => r.date === today)
    .toArray()
}
