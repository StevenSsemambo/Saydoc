// ─────────────────────────────────────────────────────────────
// SayMyDoc InferenceEngine v4 — Sophisticated Rule-Based AI
//
// Architecture:
//  1. Body-system router  — narrows 89 conditions to relevant cluster
//  2. Bayesian-style scorer — progressive confidence without harsh penalties
//  3. Information-gain follow-up selector — asks maximally discriminating questions
//  4. Multi-stage resolver — graceful progression from vague to precise
//  5. Full conditions.json integration — every field used in responses
// ─────────────────────────────────────────────────────────────

import { MERGED_KB, getMedsForCondition, getRemediesForCondition, findMedication, findRemedy } from './KnowledgeMerger.js'
import { processText } from './NLPProcessor.js'
import {
  detectEmotion, getEmpathyPrefix, detectSelfHarmRisk,
  getSelfHarmResponse, getConditionEmpathy, getSupportiveClosing,
} from './EmotionalEngine.js'
import { localiseAIGreeting, localiseAIClarify } from './LanguageEngine.js'
import {
  createWorkingMemory, addSymptoms, addFollowUpAnswer,
  hasSymptom, getSymptomKeys, updateCandidates,
  getTopCandidate, getConfidenceLevel, getLeadMargin,
} from './WorkingMemory.js'

const CONDITIONS  = MERGED_KB.conditions
const FOLLOW_UPS  = MERGED_KB.follow_up_questions
const EMERG_FLAGS = MERGED_KB.emergency_flags

// ── Confidence thresholds ─────────────────────────────────────
const THRESHOLD_RESOLVE   = 68   // show result
const THRESHOLD_NEAR      = 45   // near resolution, focus questions
const THRESHOLD_LEAD_MIN  = 15   // minimum margin to trust top candidate

// ── ICD-10 codes ──────────────────────────────────────────────
const ICD10 = {
  migraine:'G43', tension_headache:'G44.2', cluster_headache:'G44.0',
  malaria:'B54', malaria_mild:'B54', malaria_severe:'B54.0',
  typhoid:'A01.0', typhoid_complications:'A01.0',
  hypertension:'I10', hypertensive_headache:'I10', hypertensive_crisis:'I16',
  flu:'J11', gastritis:'K29.7', uti:'N39.0', anxiety:'F41.1',
  asthma:'J45', sinusitis:'J32.9', back_pain:'M54.5',
  depression:'F32.9', depression_major:'F32.9',
  food_poisoning:'A05.9', hypertensive_headache2:'I10',
  conjunctivitis:'H10.9', palpitations:'R00.2', anaemia:'D64.9',
  diabetes_symptoms:'E11', diabetes_type2:'E11', diabetes_emergency:'E11.0',
  skin_rash:'L30.9', malnutrition:'E46', malnutrition_sam:'E43',
  dengue:'A90', tb:'A15', tuberculosis:'A15',
  pneumonia:'J18.9', cholera:'A00', hiv_symptoms:'B24',
  kidney_stones:'N20.0', appendicitis:'K37',
  stroke_symptoms:'I64', stroke:'I64',
  scabies:'B86', peptic_ulcer:'K27', meningitis:'G03.9',
  heart_failure:'I50.9', eye_strain:'H52.2', worms:'B82.0',
  period_pain:'N94.4', heat_exhaustion:'T67.5', acute_bronchitis:'J20.9',
  diarrhoea_acute:'A09', sickle_cell:'D57', sickle_cell_disease:'D57',
  preeclampsia:'O14.1', pre_eclampsia:'O14.1',
  schistosomiasis:'B65', giardiasis:'A07.1', brucellosis:'A23',
  febrile_convulsions:'R56.0', hepatitis_b:'B18.1',
  tonsillitis:'J35.0', ear_infection:'H66', common_cold:'J00',
  measles:'B05', gout:'M10', chickenpox:'B01', epilepsy:'G40',
  osteoarthritis:'M19', rheumatoid_arthritis:'M05',
  syphilis:'A51', gonorrhoea:'A54', chlamydia:'A56', herpes_genital:'A60',
  hypothyroidism:'E03', hyperthyroidism:'E05',
  cervical_cancer:'C53', breast_cancer:'C50', prostate_cancer:'C61',
  pcos:'E28.2', endometriosis:'N80', uterine_fibroids:'D25',
  ectopic_pregnancy:'O00', copd:'J44', chronic_bronchitis:'J42',
  ptsd:'F43.1', bipolar_disorder:'F31', chronic_kidney_disease:'N18',
  glaucoma:'H40', cataracts:'H26', sepsis:'A41', dvt:'I80',
  atrial_fibrillation:'I48', neonatal_jaundice:'P59', croup:'J05.0',
  otitis_media:'H65', psoriasis:'L40', ringworm_tinea:'B35',
  postpartum_depression:'F53', heart_failure2:'I50.9',
  angina:'I20', acute_coronary_syndrome:'I21.9', gerd:'K21.0',
  costochondritis:'M94.0', pleuritis:'R09.1',
}

// ─────────────────────────────────────────────────────────────
// BODY-SYSTEM ROUTER
// Maps detected symptom keys to relevant condition clusters.
// This ensures chest pain never triggers headache conditions.
// ─────────────────────────────────────────────────────────────

const BODY_SYSTEMS = {
  respiratory: ['asthma','copd','chronic_bronchitis','pneumonia','tb','tuberculosis',
    'acute_bronchitis','croup','flu','common_cold','sinusitis','tonsillitis','heart_failure'],
  cardiac: ['palpitations','atrial_fibrillation','heart_failure','dvt','hypertension',
    'hypertensive_crisis','hypertensive_headache','anxiety','sepsis',
    'angina','acute_coronary_syndrome'],
  chest: ['asthma','copd','pneumonia','heart_failure','dvt','atrial_fibrillation',
    'palpitations','anxiety','hypertensive_crisis','tb','tuberculosis','sickle_cell',
    'acute_bronchitis','angina','acute_coronary_syndrome','gerd','costochondritis','pleuritis'],
  neurological: ['migraine','tension_headache','cluster_headache','meningitis',
    'stroke','stroke_symptoms','epilepsy','hypertension','hypertensive_headache',
    'hypertensive_crisis','preeclampsia','pre_eclampsia','heat_exhaustion',
    'malaria_severe','febrile_convulsions'],
  fever: ['malaria','malaria_mild','malaria_severe','typhoid','typhoid_complications',
    'flu','dengue','meningitis','pneumonia','sepsis','brucellosis','febrile_convulsions',
    'measles','cholera','food_poisoning','hiv_symptoms'],
  gastrointestinal: ['gastritis','peptic_ulcer','food_poisoning','cholera',
    'appendicitis','kidney_stones','worms','diarrhoea_acute','giardiasis',
    'typhoid','typhoid_complications','period_pain','hepatitis_b','schistosomiasis',
    'malnutrition','malnutrition_sam','gerd'],
  urinary: ['uti','kidney_stones','diabetes_symptoms','diabetes_type2',
    'diabetes_emergency','prostate_cancer','chronic_kidney_disease','schistosomiasis'],
  musculoskeletal: ['back_pain','gout','osteoarthritis','rheumatoid_arthritis',
    'sickle_cell','sickle_cell_disease','malaria','dengue','flu'],
  skin: ['scabies','skin_rash','measles','chickenpox','dengue','psoriasis',
    'ringworm_tinea','syphilis','herpes_genital','hepatitis_b'],
  eye: ['conjunctivitis','eye_strain','glaucoma','cataracts','dengue','meningitis'],
  ear: ['ear_infection','otitis_media','common_cold','tonsillitis'],
  mental: ['depression','depression_major','anxiety','ptsd','bipolar_disorder',
    'postpartum_depression'],
  fatigue: ['anaemia','malnutrition','malnutrition_sam','tb','tuberculosis',
    'hiv_symptoms','hypothyroidism','diabetes_symptoms','diabetes_type2',
    'chronic_kidney_disease','malaria','depression','depression_major','heart_failure',
    'copd'],
  reproductive: ['uti','period_pain','endometriosis','pcos','uterine_fibroids',
    'ectopic_pregnancy','gonorrhoea','chlamydia','syphilis','herpes_genital',
    'cervical_cancer','breast_cancer','prostate_cancer','pre_eclampsia',
    'postpartum_depression'],
  paediatric: ['malaria','malnutrition_sam','febrile_convulsions','croup',
    'otitis_media','measles','cholera','pneumonia','diarrhoea_acute'],
}

// Symptom-key → body system mapping (what cluster to activate)
const SYMPTOM_TO_SYSTEMS = {
  // Chest / Cardiac
  chest_pain:       ['chest','cardiac'],
  chest_tightness:  ['chest','respiratory','cardiac'],
  chest_pressure:   ['chest','cardiac'],
  chest_discomfort: ['chest','respiratory'],
  palpitations:     ['cardiac','chest'],
  irregular_heartbeat: ['cardiac'],
  fast_heart_rate:  ['cardiac','fever'],
  dyspnoea:         ['respiratory','cardiac','chest'],
  wheeze:           ['respiratory'],
  cough:            ['respiratory','fever'],
  cough_productive: ['respiratory','fever'],
  cough_dry:        ['respiratory'],
  chronic_cough:    ['respiratory'],
  haemoptysis:      ['respiratory','fever'],
  // Head / Neuro
  headache:         ['neurological','fever'],
  neck_stiffness:   ['neurological'],
  dizziness:        ['neurological','cardiac'],
  confusion:        ['neurological','fever'],
  seizure:          ['neurological','fever'],
  weakness:         ['neurological','fatigue'],
  numbness:         ['neurological','musculoskeletal'],
  // Fever / Systemic
  fever:            ['fever'],
  chills:           ['fever'],
  night_sweats:     ['fever','fatigue'],
  body_aches:       ['fever','musculoskeletal'],
  fatigue:          ['fatigue'],
  // GI
  abdominal_pain:   ['gastrointestinal'],
  nausea:           ['gastrointestinal','fever','neurological'],
  vomiting:         ['gastrointestinal','fever'],
  diarrhoea:        ['gastrointestinal'],
  chronic_diarrhoea:['gastrointestinal'],
  epigastric_pain:  ['gastrointestinal'],
  heartburn:        ['gastrointestinal'],
  // Urinary
  dysuria:          ['urinary'],
  urinary_frequency:['urinary'],
  haematuria:       ['urinary'],
  // Eye / Ear / Skin
  eye_redness:      ['eye'],
  eye_pain:         ['eye','neurological'],
  blurred_vision:   ['eye','neurological'],
  ear_pain:         ['ear'],
  rash:             ['skin','fever'],
  itching:          ['skin'],
  jaundice:         ['gastrointestinal'],
  // MSK
  joint_pain:       ['musculoskeletal'],
  back_pain:        ['musculoskeletal','urinary','gastrointestinal'],
  leg_swelling:     ['cardiac'],
  // Mental
  low_mood:         ['mental'],
  anxiety:          ['mental','cardiac'],
  flashbacks:       ['mental'],
  elevated_mood:    ['mental'],
  // Reproductive
  genital_discharge:['reproductive'],
  genital_sore:     ['reproductive'],
  pelvic_pain:      ['reproductive','gastrointestinal'],
  heavy_periods:    ['reproductive'],
  // Special
  sore_throat:      ['respiratory','ear'],
  pallor:           ['fatigue'],
  oedema:           ['cardiac','reproductive'],
  // Default fallback — activate ALL if symptom unknown
  // Cardiac-specific symptoms (new conditions)
  left_arm_pain:    ['cardiac','chest'],
  jaw_pain:         ['cardiac','chest'],
  chest_pain_at_rest:['cardiac','chest'],
  exertional_chest_pain:['cardiac','chest'],
  chest_pain_prolonged:['cardiac','chest'],
  chest_pain_sharp: ['chest','musculoskeletal'],
  chest_wall_tenderness:['chest','musculoskeletal'],
  musculoskeletal_chest:['chest','musculoskeletal'],
  pleuritic_pain:   ['chest','respiratory'],
  acs_quality:      ['cardiac','chest'],
  cardiac_risk_factors:['cardiac'],
  sudden_onset_chest:['cardiac','chest'],
  // GERD symptoms
  regurgitation:    ['gastrointestinal'],
  postprandial_symptoms:['gastrointestinal'],
  food_triggered_symptoms:['gastrointestinal'],
  chronic_acid_reflux:['gastrointestinal'],
  // General
  high_blood_pressure:['cardiac'],
  back_radiation:   ['cardiac','musculoskeletal'],
  sweating:         ['fever','cardiac'],
}

function getActiveSystems(symptomKeys) {
  const active = new Set()
  for (const k of symptomKeys) {
    const systems = SYMPTOM_TO_SYSTEMS[k]
    if (systems) { for (const s of systems) active.add(s) }
    else active.add('_all') // unknown symptom → don't restrict
  }
  if (active.has('_all')) return null // null = no restriction
  return active
}

function isConditionRelevant(condKey, activeSystems) {
  if (!activeSystems) return true // no restriction
  for (const [sysName, condList] of Object.entries(BODY_SYSTEMS)) {
    if (activeSystems.has(sysName) && condList.includes(condKey)) return true
  }
  return false
}

// ─────────────────────────────────────────────────────────────
// BAYESIAN-STYLE SCORER
//
// Key improvements over old scorer:
// 1. No harsh penalty for missing required symptoms early in conversation
//    — penalty scales with conversation cycle (mild early, harsh late)
// 2. Confirmed follow-up answers worth much more than guessed symptoms
// 3. Negated symptoms actively penalise matching conditions
// 4. Symptom severity incorporated into score
// 5. Context modifiers (age, sex, pregnancy, Uganda epidemiology)
// ─────────────────────────────────────────────────────────────

// Uganda epidemiology priors — conditions more likely here
const UGANDA_PRIORS = {
  malaria: 18, malaria_mild: 15, malaria_severe: 8,
  typhoid: 12, tb: 10, tuberculosis: 10,
  hiv_symptoms: 8, anaemia: 8, malnutrition: 7,
  cholera: 5, schistosomiasis: 5, worms: 7,
  food_poisoning: 8, diarrhoea_acute: 9,
  brucellosis: 4, dengue: 3,
  gerd: 6, angina: 3, costochondritis: 5, pleuritis: 3,
  acute_coronary_syndrome: 2,
}

function scoreCondition(condKey, cond, memory, cycle) {
  let score = 0
  const sympKeys = getSymptomKeys(memory)

  // Uganda prior (base epidemiological likelihood)
  score += UGANDA_PRIORS[condKey] || 0

  // ── Required symptoms ─────────────────────────────────────
  const reqMet = []
  const reqMissed = []
  for (const req of (cond.required_symptoms || [])) {
    if (hasSymptom(memory, req)) {
      const sev = memory.symptoms[req]?.severity || 5
      const confirmed = memory.symptoms[req]?.confirmed ? 1.4 : 1.0
      // Exact required symptom match — strong signal
      score += (30 + sev * 1.5) * confirmed
      reqMet.push(req)
    } else if (memory.negated.has(req)) {
      // User explicitly denied a required symptom — strong penalty
      score -= 40
      reqMissed.push(req)
    } else {
      // Not yet asked about — mild progressive penalty
      // Early cycles: almost no penalty (still gathering info)
      // Late cycles: increasing penalty (should have been confirmed)
      const cyclePenalty = Math.min(cycle * 4, 20)
      score -= cyclePenalty
      reqMissed.push(req)
    }
  }

  // If ALL required symptoms are explicitly negated → eliminate
  if (reqMissed.length === (cond.required_symptoms || []).length &&
      reqMissed.every(r => memory.negated.has(r))) {
    return 0
  }

  // ── Supporting symptoms ───────────────────────────────────
  const sup = cond.supporting_symptoms || []
  let supMatched = 0
  for (const s of sup) {
    if (hasSymptom(memory, s)) {
      const sev = memory.symptoms[s]?.severity || 5
      const confirmed = memory.symptoms[s]?.confirmed ? 1.3 : 1.0
      score += (7 + sev * 0.7) * confirmed
      supMatched++
    } else if (memory.negated.has(s)) {
      // Negated supporting symptom = mild contra-indication
      score -= 8
    }
  }
  // Bonus for matching a high proportion of supporting symptoms
  if (sup.length > 0) {
    score += (supMatched / sup.length) * 20
  }

  // ── Against symptoms ──────────────────────────────────────
  for (const against of (cond.against_symptoms || [])) {
    if (hasSymptom(memory, against)) score -= 25
  }

  // ── Unrelated symptom penalty ─────────────────────────────
  // Symptoms that match neither required nor supporting = mild negative
  const knownSyms = new Set([
    ...(cond.required_symptoms || []),
    ...(cond.supporting_symptoms || []),
  ])
  const unrelated = sympKeys.filter(k => !knownSyms.has(k))
  score -= unrelated.length * 1.5

  // ── Context modifiers ─────────────────────────────────────
  const ctx = memory.context
  // Sex-specific conditions
  const maleOnly = ['prostate_cancer','gonorrhoea_male']
  const femaleOnly = ['cervical_cancer','breast_cancer','pcos','endometriosis',
    'uterine_fibroids','ectopic_pregnancy','pre_eclampsia','preeclampsia',
    'postpartum_depression','period_pain']
  if (ctx.sex === 'male' && femaleOnly.includes(condKey)) return 0
  if (ctx.sex === 'female' && maleOnly.includes(condKey)) return 0

  // Pregnancy boosts
  if (ctx.pregnant || memory.tags.has('pregnant')) {
    if (['pre_eclampsia','preeclampsia','ectopic_pregnancy',
         'postpartum_depression'].includes(condKey)) score += 25
  }
  // Paediatric boosts
  if (ctx.is_child || memory.tags.has('child')) {
    if (['malnutrition_sam','febrile_convulsions','croup','otitis_media',
         'measles'].includes(condKey)) score += 20
  }
  // Elderly boosts
  if (ctx.is_elderly || memory.tags.has('elderly')) {
    if (['heart_failure','atrial_fibrillation','copd','stroke','glaucoma',
         'cataracts','osteoarthritis'].includes(condKey)) score += 15
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

function runInference(memory, activeSystems) {
  const candidates = {}
  for (const [key, cond] of Object.entries(CONDITIONS)) {
    if (!isConditionRelevant(key, activeSystems)) {
      candidates[key] = 0
      continue
    }
    candidates[key] = scoreCondition(key, cond, memory, memory.cycle)
  }
  updateCandidates(memory, candidates)
  return candidates
}

// ─────────────────────────────────────────────────────────────
// INFORMATION-GAIN FOLLOW-UP SELECTOR
//
// Instead of asking the top candidate's first unused question,
// pick the question that BEST DISCRIMINATES between the top
// competing candidates. This is how a skilled clinician thinks.
// ─────────────────────────────────────────────────────────────

function computeInformationGain(questionKey, topCandidates, memory) {
  const q = FOLLOW_UPS[questionKey]
  if (!q) return 0

  // Simulate each answer and measure how much the ranking would shift
  let totalGain = 0
  for (const [ansKey, ans] of Object.entries(q.answers || {})) {
    // Temporary memory snapshot
    const testMem = {
      ...memory,
      symptoms: { ...memory.symptoms },
      negated: new Set(memory.negated),
    }
    // Apply the answer
    for (const s of (ans.add || [])) {
      testMem.symptoms[s.key] = { key: s.key, severity: s.severity, confirmed: true, source: 'simulated' }
    }
    for (const neg of (ans.remove || [])) {
      testMem.negated.add(neg)
      delete testMem.symptoms[neg]
    }
    // Re-score top candidates with this answer applied
    let scoreShift = 0
    for (const [condKey] of topCandidates) {
      const cond = CONDITIONS[condKey]
      if (!cond) continue
      const before = memory.candidates[condKey] || 0
      const after  = scoreCondition(condKey, cond, testMem, memory.cycle)
      scoreShift += Math.abs(after - before)
    }
    totalGain += scoreShift
  }
  return totalGain / Math.max(1, Object.keys(q.answers || {}).length)
}

function pickBestFollowUp(memory, candidates) {
  const sorted = Object.entries(candidates)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
  const topN = sorted.slice(0, 4) // consider top 4 candidates

  if (!topN.length) return null

  // Gather all follow-up question candidates from top conditions
  const candidateQuestions = new Map() // questionKey → infoGain
  for (const [condKey] of topN) {
    const cond = CONDITIONS[condKey]
    if (!cond) continue
    for (const qKey of (cond.follow_up_keys || [])) {
      if (memory.asked_questions.has(qKey)) continue
      if (!FOLLOW_UPS[qKey]) continue // skip missing questions
      if (!candidateQuestions.has(qKey)) {
        const gain = computeInformationGain(qKey, topN, memory)
        candidateQuestions.set(qKey, gain)
      }
    }
  }

  if (!candidateQuestions.size) return null

  // Pick the question with highest information gain
  let bestKey = null, bestGain = -1
  for (const [qKey, gain] of candidateQuestions) {
    if (gain > bestGain) { bestGain = gain; bestKey = qKey }
  }

  if (!bestKey) return null
  return { key: bestKey, ...FOLLOW_UPS[bestKey] }
}

// ─────────────────────────────────────────────────────────────
// EMERGENCY CHECKER
// ─────────────────────────────────────────────────────────────

function checkEmergency(memory, rawText) {
  const lower = (rawText || '').toLowerCase()
  for (const flag of EMERG_FLAGS) {
    const symMatch = (flag.trigger_symptoms || []).every(s => hasSymptom(memory, s))
    const kwMatch  = (flag.trigger_keywords || []).some(kw => lower.includes(kw))
    if (symMatch || kwMatch) return flag
  }
  return null
}

// ─────────────────────────────────────────────────────────────
// RESULT BUILDER — uses ALL fields from conditions.json
// ─────────────────────────────────────────────────────────────

// ── Confidence calibration ────────────────────────────────────
// The internal rule score is an additive sum clamped at 100 — it ranks
// conditions but is NOT a probability, and a few matching symptoms can
// saturate it. What we show the user is capped by how much evidence the
// engine actually has, and never claims near-certainty.
export const MAX_DISPLAY_CONFIDENCE = 90
const MAX_USER_SELECTED_CONFIDENCE  = 75

export function calibrateConfidence(raw, { answers = 0, symptoms = 0, margin = 100, userSelected = false } = {}) {
  let cap = 50 + 10 * Math.min(answers, 3) + 3 * Math.min(symptoms, 3)   // 50 … 89
  if (margin < THRESHOLD_LEAD_MIN) cap = Math.min(cap, 60)               // close call → stay modest
  if (userSelected) cap = Math.min(cap, MAX_USER_SELECTED_CONFIDENCE)
  cap = Math.min(cap, MAX_DISPLAY_CONFIDENCE)
  return Math.max(0, Math.min(Math.round(raw), cap))
}

function buildResult(memory, overrideKey = null) {
  let condKey, rawScore
  if (overrideKey) {
    condKey = overrideKey
    rawScore = memory.candidates[overrideKey] || 50
  } else {
    const top = getTopCandidate(memory)
    if (!top) return null
    ;[condKey, rawScore] = top
  }
  const cond = CONDITIONS[condKey]
  if (!cond) return null

  const confidence = calibrateConfidence(rawScore, {
    answers: memory.asked_questions.size,
    symptoms: getSymptomKeys(memory).length,
    margin: getLeadMargin(memory),
    userSelected: !!overrideKey,
  })
  // Scale the alternatives by the same ratio so ordering is preserved and
  // no alternative can look more certain than the main result.
  const scale = rawScore > 0 ? confidence / rawScore : 1

  const allCandidates = Object.entries(memory.candidates)
    .filter(([, s]) => s > 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k, c]) => ({
      key: k,
      name: CONDITIONS[k]?.name || k,
      confidence: Math.min(Math.round(c * scale), MAX_DISPLAY_CONFIDENCE),
    }))

  return {
    condition:       condKey,
    name:            cond.name,
    confidence,
    raw_score:       rawScore,
    category:        cond.category,
    description:     cond.description,
    body_mechanism:  cond.body_mechanism,
    why_symptoms:    cond.why_symptoms || {},
    action_plan:     cond.action_plan,
    see_doctor_if:   cond.see_doctor_if,
    home_remedies:   cond.home_remedies || [],
    local_context:   cond.local_context,
    all_candidates:  allCandidates,
    symptoms_detected: getSymptomKeys(memory),
    duration:        memory.duration,
    emergency:       cond.emergency || false,
    icd10:           ICD10[condKey] || null,
    uganda_context:  cond.uganda_context || cond.local_context || null,
    suggested_medications: getMedsForCondition(condKey),
    suggested_remedies:   getRemediesForCondition(condKey),
  }
}

// ─────────────────────────────────────────────────────────────
// PARTIAL PROGRESS MESSAGE
// Tells the user what the engine has gathered so far.
// Makes it feel like an intelligent doctor, not a guessing game.
// ─────────────────────────────────────────────────────────────

function buildPartialInsight(candidates, memory) {
  const top3 = Object.entries(candidates)
    .filter(([, s]) => s > 10)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  if (!top3.length) return null

  const sympCount = getSymptomKeys(memory).length
  const topName = CONDITIONS[top3[0][0]]?.name || top3[0][0]
  const topScore = top3[0][1]

  if (top3.length === 1 || topScore > 55) {
    return `Based on what you've told me so far, **${topName}** is looking most likely. I need a few more details to be sure.`
  }

  const names = top3.slice(0, 2).map(([k]) => CONDITIONS[k]?.name || k)
  return `I'm considering a few possibilities — mainly **${names.join('** and **')}**. One more question will help me be more precise.`
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API — InferenceSession
// ─────────────────────────────────────────────────────────────

export function getGreeting(userName, lang = 'en') {
  return localiseAIGreeting(userName, lang)
}

export class InferenceSession {
  constructor(userProfile = {}) {
    this.memory         = createWorkingMemory(userProfile)
    this.lang           = userProfile.lang || 'en'
    this.emotionHistory = []
    this.hwMode         = userProfile.hwMode || false
    this._activeSystems = null // set after first symptom detection
  }

  process(userText) {
    // Self-harm detection — highest priority
    if (detectSelfHarmRisk(userText)) return getSelfHarmResponse()

    this.memory.cycle++
    this.memory.messages.push({ role: 'user', text: userText })

    const emotion = detectEmotion(userText)
    this.memory.emotion = emotion
    this.emotionHistory.push(emotion)
    const empathy = getEmpathyPrefix(emotion)

    // NLP extraction
    const nlpResult = processText(userText)
    addSymptoms(this.memory, nlpResult)

    // Nothing detected yet
    const sympCount = getSymptomKeys(this.memory).length
    if (sympCount === 0) {
      return {
        type: 'clarify',
        message: localiseAIClarify(this.lang),
        empathy,
      }
    }

    // Update body-system router
    this._activeSystems = getActiveSystems(getSymptomKeys(this.memory))

    // Emergency check
    const emergency = checkEmergency(this.memory, userText)
    if (emergency) {
      return {
        type: 'emergency',
        message: emergency.message,
        urgency: emergency.urgency,
        flag: emergency,
        empathy,
      }
    }

    // Run inference
    const candidates = runInference(this.memory, this._activeSystems)
    const topScore   = getConfidenceLevel(this.memory)
    const leadMargin = getLeadMargin(this.memory)

    // ── HIGH CONFIDENCE → resolve, but never from the first message alone:
    // if a useful verification question exists, ask it first.
    if (topScore >= THRESHOLD_RESOLVE && leadMargin >= THRESHOLD_LEAD_MIN &&
        (this.memory.asked_questions.size > 0 || !pickBestFollowUp(this.memory, candidates))) {
      const result = buildResult(this.memory)
      if (result) {
        this.memory.stage = 'resolved'
        const condEmpathy = getConditionEmpathy(result.condition)
        const closing     = getSupportiveClosing(emotion, result.condition)
        return {
          type: 'result',
          result: { ...result, closing },
          empathy: empathy + condEmpathy,
        }
      }
    }

    // ── NEAR RESOLUTION → focused follow-up ──────────────────
    if (topScore >= THRESHOLD_NEAR) {
      const followUp = pickBestFollowUp(this.memory, candidates)
      if (followUp) {
        this.memory.asked_questions.add(followUp.key)
        this.memory.stage = 'asking'
        const insight = buildPartialInsight(candidates, this.memory)
        return {
          type: 'follow_up',
          question: followUp.question,
          question_key: followUp.key,
          answers: followUp.answers,
          empathy,
          insight,
          partial_candidates: this._topCandidateList(candidates, 3),
        }
      }
    }

    // ── EARLY STAGE → ask best available question ─────────────
    if (this.memory.cycle <= 8) {
      const followUp = pickBestFollowUp(this.memory, candidates)
      if (followUp) {
        this.memory.asked_questions.add(followUp.key)
        this.memory.stage = 'asking'
        return {
          type: 'follow_up',
          question: followUp.question,
          question_key: followUp.key,
          answers: followUp.answers,
          empathy,
          insight: null,
          partial_candidates: this._topCandidateList(candidates, 3),
        }
      }
    }

    // ── NO MORE QUESTIONS → show top candidates for user to select ──
    const meaningfulCandidates = this._topCandidateList(candidates, 3, 8)
    if (meaningfulCandidates.length > 0) {
      this.memory.stage = 'selecting'
      return {
        type: 'condition_select',
        empathy,
        message: "Based on everything you've told me, these are the most likely possibilities. Which one best matches what you're experiencing?",
        candidates: meaningfulCandidates,
      }
    }

    // Final fallback
    return { type: 'clarify', message: localiseAIClarify(this.lang), empathy }
  }

  processFollowUpAnswer(questionKey, answerKey) {
    const question = FOLLOW_UPS[questionKey]
    if (!question) return null
    const answer = question.answers[answerKey]
    if (!answer) return null

    addFollowUpAnswer(
      this.memory,
      questionKey,
      (answer.add || []).map(s => ({ ...s, confirmed: true })),
      answer.remove || [],
    )

    this.memory.cycle++

    // Update systems in case new symptoms opened new clusters
    this._activeSystems = getActiveSystems(getSymptomKeys(this.memory))

    const candidates = runInference(this.memory, this._activeSystems)
    const topScore   = getConfidenceLevel(this.memory)
    const leadMargin = getLeadMargin(this.memory)

    // Emergency re-check
    const emergency = checkEmergency(this.memory, '')
    if (emergency) {
      return {
        type: 'emergency',
        message: emergency.message,
        urgency: emergency.urgency,
        flag: emergency,
      }
    }

    // High confidence
    if (topScore >= THRESHOLD_RESOLVE && leadMargin >= THRESHOLD_LEAD_MIN) {
      const result = buildResult(this.memory)
      if (result) {
        this.memory.stage = 'resolved'
        const closing = getSupportiveClosing(this.memory.emotion, result.condition)
        return {
          type: 'result',
          result: { ...result, closing },
          empathy: getConditionEmpathy(result.condition),
        }
      }
    }

    // Another follow-up
    if (this.memory.cycle <= 9) {
      const nextQ = pickBestFollowUp(this.memory, candidates)
      if (nextQ) {
        this.memory.asked_questions.add(nextQ.key)
        const insight = buildPartialInsight(candidates, this.memory)
        return {
          type: 'follow_up',
          question: nextQ.question,
          question_key: nextQ.key,
          answers: nextQ.answers,
          empathy: '',
          insight,
          partial_candidates: this._topCandidateList(candidates, 3),
        }
      }
    }

    // Show options
    const meaningful = this._topCandidateList(candidates, 3, 8)
    if (meaningful.length > 0) {
      this.memory.stage = 'selecting'
      return {
        type: 'condition_select',
        empathy: '',
        message: "Based on your answers, here are the most likely possibilities. Which sounds closest to what you're experiencing?",
        candidates: meaningful,
      }
    }

    return { type: 'clarify', message: localiseAIClarify(this.lang) }
  }

  selectCondition(conditionKey) {
    const cond = CONDITIONS[conditionKey]
    if (!cond) return { type: 'clarify', message: localiseAIClarify(this.lang) }

    // Inject required symptoms as confirmed
    for (const sym of (cond.required_symptoms || [])) {
      this.memory.symptoms[sym] = {
        key: sym, severity: 6, confirmed: true, source: 'user_selected',
      }
    }

    // Ensure _activeSystems is set from the current symptom set before scoring.
    // It is null when the user reaches condition_select before process() could set it
    // (e.g. HW mode auto-feeding a complaint).  Recompute from current memory now.
    const activeSystems = this._activeSystems ?? getActiveSystems(getSymptomKeys(this.memory))

    runInference(this.memory, activeSystems)
    const result = buildResult(this.memory, conditionKey)
    if (result) {
      this.memory.stage = 'resolved'
      const empathy = getConditionEmpathy(conditionKey)
      const closing = getSupportiveClosing(this.memory.emotion, conditionKey)
      return {
        type: 'result',
        result: { ...result, closing },
        empathy,
      }
    }
    return { type: 'clarify', message: localiseAIClarify(this.lang) }
  }

  _topCandidateList(candidates, n = 3, minScore = 5) {
    return Object.entries(candidates)
      .filter(([, s]) => s >= minScore)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k, score]) => ({
        key:  k,
        name: CONDITIONS[k]?.name || k,
        score,
        description: (CONDITIONS[k]?.description || '').split('.')[0] + '.',
        required_symptoms: CONDITIONS[k]?.required_symptoms || [],
      }))
  }

  getMemory()        { return this.memory }
  getEmotionHistory(){ return this.emotionHistory }
  getCandidates() {
    return this._topCandidateList(this.memory.candidates, 5, 5)
  }
}

// ─────────────────────────────────────────────────────────────
// HEALTH QUESTION ANSWERER
// Uses conditions.json data directly for factual Q&A
// ─────────────────────────────────────────────────────────────

export function answerHealthQuestion(question, lang = 'en') {
  const lower = question.toLowerCase()

  // Direct condition name match
  for (const [key, cond] of Object.entries(CONDITIONS)) {
    const nameMatch = lower.includes(cond.name.toLowerCase())
    const altNames  = (cond.alt_names || []).some(n => lower.includes(n.toLowerCase()))
    if (nameMatch || altNames) {
      return {
        type: 'health_info',
        condition: key,
        name: cond.name,
        description: cond.description,
        body_mechanism: cond.body_mechanism,
        action_plan: cond.action_plan,
        home_remedies: cond.home_remedies || [],
        see_doctor_if: cond.see_doctor_if,
        local_context: cond.local_context,
        suggested_medications: getMedsForCondition(key),
        suggested_remedies:   getRemediesForCondition(key),
      }
    }
  }

  // Medication direct question
  if (/medicine|medication|drug|tablet|capsule|dose|dosage|pill|syrup/.test(lower)) {
    const med = findMedication(question)
    if (med) {
      return {
        type: 'medication_info',
        medication: med,
      }
    }
  }

  // Remedy direct question
  if (/remedy|herb|natural|plant|traditional|ginger|moringa|turmeric|neem|aloe/.test(lower)) {
    const rem = findRemedy(question)
    if (rem) {
      return {
        type: 'remedy_info',
        remedy: rem,
      }
    }
  }

  // Keyword tips
  if (/water|hydrat|amazzi/.test(lower))
    return { type: 'tip', message: "Dehydration is one of the most overlooked causes of headaches, fatigue, and poor focus in Uganda's heat. Aim for 8–10 glasses daily. Pale yellow urine = well hydrated." }
  if (/sleep|otulo/.test(lower))
    return { type: 'tip', message: "Sleep is when your body repairs itself. 7–9 hours with consistent wake times matters more than total hours. Poor sleep triggers migraines, anxiety, and weakens immunity." }
  if (/malaria.*migraine|migraine.*malaria/.test(lower))
    return { type: 'tip', message: "Key difference: Malaria headaches come WITH fever and cyclical chills. Migraine comes with light sensitivity and nausea but NO fever. If you have fever — test for malaria first." }
  if (/prevent|avoid/.test(lower))
    return { type: 'tip', message: "Prevention in Uganda: Sleep under a treated net (malaria), boil or treat drinking water (typhoid, cholera), wash hands before eating (worms, food poisoning), and complete all antibiotic courses." }

  return {
    type: 'general',
    message: "I'm most accurate when you describe specific symptoms. Tell me what you feel — where the pain is, how severe (1–10), and how long — and I'll give you precise, clinically grounded guidance.",
  }
}

export { CONDITIONS, FOLLOW_UPS, ICD10 }
