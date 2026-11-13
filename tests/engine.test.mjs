// Run with:  npm run test:engine
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MERGED_KB } from '../src/engine/KnowledgeMerger.js'
import { InferenceSession, calibrateConfidence, MAX_DISPLAY_CONFIDENCE } from '../src/engine/InferenceEngine.js'

const newSession = () => new InferenceSession({ name: 'T', age: 30, sex: 'female' })

// Drive a session to a result, preferring benign answers (the first answer is
// often an alarming one, which correctly triggers an emergency instead).
const BENIGN = ['normal', 'no', 'none', 'mild', 'not_sure', 'no_idea', 'not_tested', 'negative']
const benignPick = (answers) => {
  const keys = Object.keys(answers)
  return keys.find(k => BENIGN.includes(k)) || keys[keys.length - 1]
}
function runToResult(text, pick = benignPick) {
  const s = newSession()
  let r = s.process(text)
  for (let i = 0; i < 12 && r?.type === 'follow_up'; i++) r = s.processFollowUpAnswer(r.question_key, pick(r.answers))
  return { s, r }
}

test('calibrateConfidence never exceeds the display maximum', () => {
  for (const answers of [0, 1, 3, 10]) for (const symptoms of [0, 3, 20])
    assert.ok(calibrateConfidence(100, { answers, symptoms }) <= MAX_DISPLAY_CONFIDENCE)
})

test('calibrateConfidence stays modest with little evidence', () => {
  assert.ok(calibrateConfidence(100, { answers: 0, symptoms: 3 }) <= 59)
})

test('calibrateConfidence is capped for close calls and user-selected conditions', () => {
  assert.ok(calibrateConfidence(100, { answers: 3, symptoms: 5, margin: 5 }) <= 60)
  assert.ok(calibrateConfidence(100, { answers: 3, symptoms: 5, userSelected: true }) <= 75)
})

test('calibrateConfidence never inflates a low raw score', () => {
  assert.equal(calibrateConfidence(30, { answers: 3, symptoms: 5 }), 30)
})

test('REGRESSION: fever + chills + headache no longer returns an instant 100% result', () => {
  const r = newSession().process('I have a fever, chills and headache for 3 days')
  assert.notEqual(r.type, 'result', 'must verify with a follow-up question before concluding')
  assert.equal(r.type, 'follow_up')
})

test('the same case still reaches a result after follow-ups, with calibrated confidence', () => {
  const { r } = runToResult('I have a fever, chills and headache for 3 days')
  assert.ok(['result', 'condition_select'].includes(r.type), `got ${r.type}`)
  if (r.type === 'result') {
    assert.ok(r.result.confidence <= MAX_DISPLAY_CONFIDENCE)
    assert.ok(r.result.confidence < 100)
    for (const c of r.result.all_candidates) assert.ok(c.confidence <= r.result.confidence)
  }
})

test('alarming answers still escalate to an emergency (meningitis signs)', () => {
  const s = newSession()
  let r = s.process('I have a fever, chills and headache for 3 days')
  r = s.processFollowUpAnswer(r.question_key, 'cannot_bend')
  assert.equal(r.type, 'emergency')
})

test('manually selecting a condition caps confidence at 75', () => {
  const s = newSession()
  s.process('I have a fever, chills and headache')
  const r = s.selectCondition('malaria')
  assert.equal(r.type, 'result')
  assert.ok(r.result.confidence <= 75)
})

test('self-harm language returns the crisis response', () => {
  assert.equal(newSession().process('I want to kill myself').type, 'crisis')
})

test('chest pain with breathlessness is never answered with a benign instant result', () => {
  const r = newSession().process('chest pain and shortness of breath')
  assert.ok(['follow_up', 'emergency'].includes(r.type), `got ${r.type}`)
})

test('gibberish asks for clarification instead of guessing', () => {
  assert.equal(newSession().process('blah blah').type, 'clarify')
})

test('REGRESSION: merging duplicate conditions does not drop base follow-ups', () => {
  const ms = MERGED_KB.conditions.malaria_severe
  assert.ok(ms.follow_up_keys.length > 0, 'malaria_severe must keep its follow-up questions')
  assert.equal(ms.severity_class, 'critical', 'extended values still win where defined')
  for (const q of ms.follow_up_keys) assert.ok(MERGED_KB.follow_up_questions[q], `missing question ${q}`)
})
