// ─────────────────────────────────────────────────────────────
// SayMyDoc WorkingMemory v2 — Stateful Clinical Session
// ─────────────────────────────────────────────────────────────

export function createWorkingMemory(userProfile = {}) {
  return {
    symptoms: {},           // key → { key, severity, confirmed, source, tag }
    negated: new Set(),     // symptom keys explicitly denied
    duration: null,
    tags: new Set(),        // context tags: 'pregnant', 'child', 'elderly' etc
    candidates: {},         // conditionKey → score
    asked_questions: new Set(),
    stage: 'initial',       // initial | asking | selecting | resolved
    cycle: 0,               // incremented per user message
    user: userProfile,
    emotion: 'neutral',
    started_at: Date.now(),
    messages: [],           // full conversation log
    context: {              // rich clinical context accumulated across turns
      age: userProfile.age || null,
      sex: userProfile.sex || null,
      pregnant: false,
      is_child: userProfile.age && userProfile.age < 15,
      is_elderly: userProfile.age && userProfile.age > 60,
      known_conditions: [],
      risk_flags: new Set(),
    },
    // Differential tracking — keeps a ranked history of candidate shifts
    candidate_history: [],
    // Information gain tracking — which symptoms most changed the ranking
    key_discriminators: [],
  }
}

export function addSymptoms(memory, nlpResult) {
  for (const s of nlpResult.symptoms) {
    if (memory.negated.has(s.key)) continue
    // Keep highest severity if same symptom seen again, accumulate tags
    const existing = memory.symptoms[s.key]
    if (!existing || existing.severity < s.severity) {
      memory.symptoms[s.key] = {
        key: s.key,
        severity: s.severity,
        confirmed: s.confirmed || false,
        source: s.source || 'user_text',
        tag: s.tag || null,
      }
    }
  }
  for (const neg of nlpResult.negated) {
    memory.negated.add(neg)
    delete memory.symptoms[neg]
  }
  for (const tag of nlpResult.tags) memory.tags.add(tag)
  if (nlpResult.duration && !memory.duration) memory.duration = nlpResult.duration

  // Context enrichment from tags
  if (memory.tags.has('pregnant')) memory.context.pregnant = true
  if (memory.tags.has('child')) memory.context.is_child = true
  if (memory.tags.has('elderly')) memory.context.is_elderly = true

  return memory
}

export function addFollowUpAnswer(memory, questionKey, answerSymptoms, answerNegated = []) {
  memory.asked_questions.add(questionKey)
  memory.cycle++
  for (const s of answerSymptoms) {
    memory.symptoms[s.key] = {
      key: s.key,
      severity: s.severity,
      confirmed: true,          // follow-up answers are high-confidence
      source: 'follow_up_answer',
      tag: null,
    }
    memory.negated.delete(s.key) // un-negate if previously denied
  }
  for (const neg of answerNegated) {
    memory.negated.add(neg)
    delete memory.symptoms[neg]
  }
  return memory
}

export function hasSymptom(memory, key) {
  return !!memory.symptoms[key] && !memory.negated.has(key)
}

export function symptomSeverity(memory, key) {
  return memory.symptoms[key]?.severity || 0
}

export function isNegated(memory, key) {
  return memory.negated.has(key)
}

export function getSymptomKeys(memory) {
  return Object.keys(memory.symptoms).filter(k => !memory.negated.has(k))
}

export function updateCandidates(memory, candidates) {
  memory.candidates = candidates
  // Keep a history of top-3 for drift detection
  const top3 = Object.entries(candidates)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, s]) => ({ key: k, score: s }))
  memory.candidate_history.push(top3)
  return memory
}

export function getTopCandidate(memory) {
  const entries = Object.entries(memory.candidates)
  if (!entries.length) return null
  return entries.sort((a, b) => b[1] - a[1])[0]
}

export function getConfidenceLevel(memory) {
  const top = getTopCandidate(memory)
  return top ? top[1] : 0
}

// Returns the gap between 1st and 2nd candidates (disambiguation clarity)
export function getLeadMargin(memory) {
  const sorted = Object.entries(memory.candidates).sort((a, b) => b[1] - a[1])
  if (sorted.length < 2) return 100
  return sorted[0][1] - sorted[1][1]
}
