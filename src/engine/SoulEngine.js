// ── Soul Engine v1 ─────────────────────────────────────────────
// Learns the user over time. Builds personal trigger profiles,
// detects patterns in journal data, generates personalised insights.

import { getJournalEntries, getSessions,  } from '../db/database.js'

// ── Pattern Analysis ──────────────────────────────────────────
export async function analysePatterns(userId) {
  const [journal, sessions] = await Promise.all([
    getJournalEntries(userId, 60),
    getSessions(userId, 50),
  ])
  if (journal.length < 5) return null

  const results = {
    sleep_trigger: detectSleepTrigger(journal, sessions),
    stress_trigger: detectStressTrigger(journal, sessions),
    water_trigger: detectWaterTrigger(journal, sessions),
    mood_trend: detectMoodTrend(journal),
    symptom_frequency: getSymptomFrequency(journal, sessions),
    best_days: getBestDays(journal),
    insights: [],
  }

  // Generate plain-language insights
  if (results.sleep_trigger?.confidence > 60) {
    results.insights.push({
      type: 'trigger',
      icon: '😴',
      title: 'Sleep is your key trigger',
      body: `Your data shows that ${results.sleep_trigger.percent}% of your symptom episodes followed nights with less than ${results.sleep_trigger.threshold} hours of sleep. Consistent sleep is your #1 protective factor.`,
      confidence: results.sleep_trigger.confidence,
      actionable: `Aim for at least ${results.sleep_trigger.threshold + 1} hours every night.`,
    })
  }
  if (results.stress_trigger?.confidence > 55) {
    results.insights.push({
      type: 'trigger',
      icon: '😰',
      title: 'Stress amplifies your symptoms',
      body: `On days you rated your stress 4 or 5, you were ${results.stress_trigger.multiplier}x more likely to report symptoms. Stress management is essential for your health.`,
      confidence: results.stress_trigger.confidence,
      actionable: 'Try 5 minutes of deep breathing daily — consistency matters more than duration.',
    })
  }
  if (results.water_trigger?.confidence > 55) {
    results.insights.push({
      type: 'trigger',
      icon: '💧',
      title: 'Dehydration is a silent trigger',
      body: `On days you logged fewer than ${results.water_trigger.threshold} glasses of water, your symptom risk was significantly higher.`,
      confidence: results.water_trigger.confidence,
      actionable: `Drink at least ${results.water_trigger.threshold + 2} glasses of water every day. Start each morning with a large glass before anything else.`,
    })
  }
  if (results.mood_trend) {
    results.insights.push({
      type: 'trend',
      icon: results.mood_trend.direction === 'up' ? '📈' : '📉',
      title: results.mood_trend.direction === 'up' ? 'Your mood is improving' : 'Your mood trend needs attention',
      body: results.mood_trend.body,
      confidence: results.mood_trend.confidence,
      actionable: results.mood_trend.direction === 'down' ? 'Consider talking to someone you trust about what is causing the low mood.' : 'Keep doing what you are doing!',
    })
  }
  return results
}

function detectSleepTrigger(journal, sessions) {
  if (journal.length < 7) return null
  const symptomDates = new Set()
  journal.filter(e => e.symptoms?.length > 0).forEach(e => symptomDates.add(e.date))
  sessions.forEach(s => {
    const d = new Date(s.timestamp).toISOString().split('T')[0]
    symptomDates.add(d)
  })

  let poorSleepSymptom = 0, poorSleepTotal = 0
  let goodSleepSymptom = 0, goodSleepTotal = 0
  const threshold = 6

  journal.forEach(e => {
    const sleep = e.sleep || 7
    const hasSymptom = symptomDates.has(e.date)
    if (sleep < threshold) {
      poorSleepTotal++
      if (hasSymptom) poorSleepSymptom++
    } else {
      goodSleepTotal++
      if (hasSymptom) goodSleepSymptom++
    }
  })

  if (poorSleepTotal < 3) return null
  const poorRate = poorSleepTotal > 0 ? poorSleepSymptom / poorSleepTotal : 0
  const goodRate = goodSleepTotal > 0 ? goodSleepSymptom / goodSleepTotal : 0
  if (poorRate <= goodRate) return null

  const confidence = Math.min(90, Math.round((poorRate - goodRate) * 200 + 40))
  return {
    threshold,
    percent: Math.round(poorRate * 100),
    confidence,
  }
}

function detectStressTrigger(journal, sessions) {
  if (journal.length < 7) return null
  const symptomDates = new Set()
  journal.filter(e => e.symptoms?.length > 0).forEach(e => symptomDates.add(e.date))
  sessions.forEach(s => { const d = new Date(s.timestamp).toISOString().split('T')[0]; symptomDates.add(d) })

  let highStressSymptom = 0, highStressTotal = 0
  let lowStressSymptom = 0, lowStressTotal = 0

  journal.forEach(e => {
    const stress = e.stress || 3
    const hasSymptom = symptomDates.has(e.date)
    if (stress >= 4) {
      highStressTotal++
      if (hasSymptom) highStressSymptom++
    } else {
      lowStressTotal++
      if (hasSymptom) lowStressSymptom++
    }
  })

  if (highStressTotal < 3) return null
  const highRate = highStressTotal > 0 ? highStressSymptom / highStressTotal : 0
  const lowRate = lowStressTotal > 0 ? lowStressSymptom / lowStressTotal : 0
  if (highRate <= lowRate || lowRate === 0) return null

  const multiplier = Math.round((highRate / Math.max(lowRate, 0.01)) * 10) / 10
  const confidence = Math.min(85, Math.round((highRate - lowRate) * 180 + 35))
  return { multiplier, confidence }
}

function detectWaterTrigger(journal, sessions) {
  if (journal.length < 7) return null
  const symptomDates = new Set()
  journal.filter(e => e.symptoms?.length > 0).forEach(e => symptomDates.add(e.date))
  sessions.forEach(s => { const d = new Date(s.timestamp).toISOString().split('T')[0]; symptomDates.add(d) })

  let lowWaterSymptom = 0, lowWaterTotal = 0
  let goodWaterSymptom = 0, goodWaterTotal = 0
  const threshold = 6

  journal.forEach(e => {
    const water = e.water || 6
    const hasSymptom = symptomDates.has(e.date)
    if (water < threshold) {
      lowWaterTotal++
      if (hasSymptom) lowWaterSymptom++
    } else {
      goodWaterTotal++
      if (hasSymptom) goodWaterSymptom++
    }
  })

  if (lowWaterTotal < 3) return null
  const lowRate = lowWaterTotal > 0 ? lowWaterSymptom / lowWaterTotal : 0
  const goodRate = goodWaterTotal > 0 ? goodWaterSymptom / goodWaterTotal : 0
  if (lowRate <= goodRate) return null

  const confidence = Math.min(85, Math.round((lowRate - goodRate) * 180 + 35))
  return { threshold, confidence }
}

function detectMoodTrend(journal) {
  if (journal.length < 10) return null
  const sorted = [...journal].sort((a, b) => a.date.localeCompare(b.date))
  const half = Math.floor(sorted.length / 2)
  const firstHalf = sorted.slice(0, half)
  const secondHalf = sorted.slice(half)

  const avg = arr => arr.reduce((s, e) => s + (e.mood || 3), 0) / arr.length
  const first = avg(firstHalf)
  const second = avg(secondHalf)
  const diff = second - first

  if (Math.abs(diff) < 0.5) return null
  const direction = diff > 0 ? 'up' : 'down'
  const confidence = Math.min(80, Math.round(Math.abs(diff) * 40 + 40))
  return {
    direction,
    confidence,
    body: direction === 'up'
      ? `Your average mood has improved from ${first.toFixed(1)} to ${second.toFixed(1)} out of 5 over the past weeks. That is meaningful progress.`
      : `Your average mood has declined from ${first.toFixed(1)} to ${second.toFixed(1)} out of 5 recently. This pattern deserves attention.`,
  }
}

function getSymptomFrequency(journal, sessions) {
  const freq = {}
  journal.forEach(e => {
    (e.symptoms || []).forEach(s => { freq[s] = (freq[s] || 0) + 1 })
  })
  sessions.forEach(s => {
    if (s.primary_condition) freq[s.primary_condition] = (freq[s.primary_condition] || 0) + 1
  })
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => ({ symptom: k, count: v }))
}

function getBestDays(journal) {
  const dayScores = {}
  journal.forEach(e => {
    const day = new Date(e.date + 'T12:00:00').getDay()
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]
    if (!dayScores[dayName]) dayScores[dayName] = { total: 0, count: 0 }
    dayScores[dayName].total += (e.mood || 3) + (e.energy || 3) - (e.stress || 3)
    dayScores[dayName].count++
  })
  return Object.entries(dayScores)
    .map(([day, s]) => ({ day, score: s.total / s.count }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(d => d.day)
}

// ── Predictive Alert ──────────────────────────────────────────
export function getPredictiveAlert(todayJournal, patterns) {
  if (!todayJournal || !patterns) return null
  const alerts = []

  if (patterns.sleep_trigger?.confidence > 60 && todayJournal.sleep < patterns.sleep_trigger.threshold) {
    alerts.push({
      level: 'warning',
      icon: '😴',
      title: 'Poor sleep detected',
      message: `You slept ${todayJournal.sleep} hours. Based on your pattern, poor sleep significantly increases your symptom risk today. Stay hydrated and avoid known triggers.`,
    })
  }
  if (patterns.stress_trigger?.confidence > 55 && todayJournal.stress >= 4) {
    alerts.push({
      level: 'warning',
      icon: '😰',
      title: 'High stress day',
      message: 'Your stress level is high today. Based on your pattern, this increases your risk of symptoms. Try to take short breaks and do some slow breathing.',
    })
  }
  if (patterns.water_trigger?.confidence > 55 && todayJournal.water < patterns.water_trigger.threshold) {
    alerts.push({
      level: 'info',
      icon: '💧',
      title: 'Drink more water',
      message: `You've only had ${todayJournal.water} glasses today. Your data shows dehydration is a trigger for you. Drink 2 large glasses now.`,
    })
  }

  return alerts.length > 0 ? alerts[0] : null
}

// ── Generate weekly summary ───────────────────────────────────
export function generateWeeklySummary(journal, sessions) {
  if (!journal.length) return null
  const week = journal.slice(0, 7)
  const avgMood = week.reduce((s, e) => s + (e.mood || 3), 0) / week.length
  const avgSleep = week.reduce((s, e) => s + (e.sleep || 7), 0) / week.length
  const avgWater = week.reduce((s, e) => s + (e.water || 6), 0) / week.length
  const avgStress = week.reduce((s, e) => s + (e.stress || 3), 0) / week.length
  const symptomDays = week.filter(e => (e.symptoms || []).length > 0).length
  const weekSessions = sessions.filter(s => {
    const d = new Date(s.timestamp)
    const now = new Date()
    return (now - d) < 7 * 24 * 60 * 60 * 1000
  })

  return {
    avg_mood: Math.round(avgMood * 10) / 10,
    avg_sleep: Math.round(avgSleep * 10) / 10,
    avg_water: Math.round(avgWater * 10) / 10,
    avg_stress: Math.round(avgStress * 10) / 10,
    symptom_days: symptomDays,
    checks: weekSessions.length,
    score: Math.round((avgMood / 5 * 40) + (Math.min(avgSleep, 9) / 9 * 30) + ((5 - avgStress) / 5 * 20) + (Math.min(avgWater, 10) / 10 * 10)),
  }
}
