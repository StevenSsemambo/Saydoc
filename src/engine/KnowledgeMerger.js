// ─────────────────────────────────────────────────────────────
// SayMyDoc KnowledgeMerger v2 — Single Source of Truth
//
// Merges ALL 6 knowledge files and builds lookup indexes.
// Used by both InferenceEngine and CompanionBrain.
// ─────────────────────────────────────────────────────────────

import kb1          from '../knowledge/conditions.json'
import kb2          from '../knowledge/conditions_extended.json'
import medsData     from '../knowledge/medications.json'
import remediesData from '../knowledge/remedies.json'
import firstAidData from '../knowledge/firstaid.json'
import nutritionData from '../knowledge/nutrition.json'

// ── Merged conditions ─────────────────────────────────────────
// Six conditions exist in both files. The extended entry wins, but it must not
// silently DROP something the base entry had (e.g. malaria_severe's follow-up
// questions), so empty/missing fields fall back to the base value.
export function mergeConditions(base, extended) {
  const merged = { ...base, ...extended }
  for (const key of Object.keys(extended)) {
    if (!base[key]) continue
    const entry = { ...base[key], ...extended[key] }
    for (const field of Object.keys(base[key])) {
      const v = extended[key][field]
      if (v == null || (Array.isArray(v) && v.length === 0)) entry[field] = base[key][field]
    }
    merged[key] = entry
  }
  return merged
}

export const MERGED_KB = {
  conditions:          mergeConditions(kb1.conditions, kb2.conditions),
  follow_up_questions: { ...kb1.follow_up_questions, ...kb2.follow_up_questions },
  emergency_flags:     [...kb1.emergency_flags, ...kb2.emergency_flags],
}

// ── Raw data ─────────────────────────────────────────────────
export const ALL_MEDICATIONS = medsData.medications    || []
export const ALL_REMEDIES    = remediesData.remedies   || []
export const ALL_FIRSTAID    = firstAidData.situations || []
export const ALL_NUTRITION   = nutritionData.plans     || []

// ─────────────────────────────────────────────────────────────
// CONDITION → MEDICATION MAP
// ─────────────────────────────────────────────────────────────
const CONDITION_MED_MAP = {
  malaria:               ['artemether_lumefantrine','paracetamol','quinine'],
  malaria_mild:          ['artemether_lumefantrine','paracetamol'],
  malaria_severe:        ['quinine','paracetamol'],
  typhoid:               ['ciprofloxacin','azithromycin','paracetamol'],
  typhoid_complications: ['ceftriaxone','ciprofloxacin'],
  tb:                    ['rifampicin_isoniazid','pyrazinamide','ethambutol'],
  tuberculosis:          ['rifampicin_isoniazid','pyrazinamide','ethambutol'],
  hiv_symptoms:          ['cotrimoxazole'],
  dengue:                ['paracetamol'],
  brucellosis:           ['doxycycline'],
  measles:               ['paracetamol','vitamin_a_supplement'],
  cholera:               ['ors','zinc','doxycycline'],
  pneumonia:             ['amoxicillin','cotrimoxazole','paracetamol'],
  asthma:                ['salbutamol','beclomethasone'],
  copd:                  ['salbutamol','beclomethasone'],
  chronic_bronchitis:    ['salbutamol','amoxicillin'],
  acute_bronchitis:      ['paracetamol','salbutamol'],
  sinusitis:             ['amoxicillin','paracetamol','ibuprofen'],
  tonsillitis:           ['amoxicillin','paracetamol','ibuprofen'],
  common_cold:           ['paracetamol'],
  flu:                   ['paracetamol','ibuprofen'],
  croup:                 ['paracetamol'],
  hypertension:          ['amlodipine','enalapril','hydrochlorothiazide'],
  hypertensive_crisis:   ['amlodipine','enalapril'],
  hypertensive_headache: ['amlodipine','paracetamol'],
  angina:                ['aspirin','amlodipine','atenolol'],
  acute_coronary_syndrome:['aspirin','atenolol','enalapril'],
  heart_failure:         ['enalapril','furosemide','spironolactone'],
  atrial_fibrillation:   ['atenolol'],
  palpitations:          ['atenolol'],
  dvt:                   ['aspirin'],
  migraine:              ['ibuprofen','paracetamol'],
  tension_headache:      ['paracetamol','ibuprofen'],
  cluster_headache:      ['ibuprofen','paracetamol'],
  meningitis:            ['paracetamol','ceftriaxone'],
  stroke:                ['aspirin'],
  stroke_symptoms:       ['aspirin'],
  epilepsy:              ['paracetamol'],
  febrile_convulsions:   ['paracetamol','diazepam'],
  gastritis:             ['omeprazole','antacids'],
  peptic_ulcer:          ['omeprazole','amoxicillin','metronidazole'],
  gerd:                  ['omeprazole','antacids'],
  food_poisoning:        ['ors','metronidazole','paracetamol'],
  diarrhoea_acute:       ['ors','zinc','metronidazole'],
  giardiasis:            ['metronidazole','tinidazole'],
  worms:                 ['mebendazole','albendazole'],
  schistosomiasis:       ['praziquantel'],
  hepatitis_b:           ['paracetamol','tenofovir'],
  appendicitis:          ['paracetamol','amoxicillin'],
  uti:                   ['cotrimoxazole','nitrofurantoin','ciprofloxacin','paracetamol'],
  kidney_stones:         ['ibuprofen','paracetamol'],
  chronic_kidney_disease:['enalapril','furosemide'],
  depression:            ['fluoxetine','amitriptyline'],
  depression_major:      ['fluoxetine','amitriptyline'],
  anxiety:               ['paracetamol'],
  ptsd:                  ['fluoxetine'],
  back_pain:             ['ibuprofen','paracetamol','diclofenac'],
  gout:                  ['ibuprofen','colchicine'],
  osteoarthritis:        ['ibuprofen','paracetamol','diclofenac'],
  rheumatoid_arthritis:  ['ibuprofen'],
  diabetes_symptoms:     ['metformin','glibenclamide'],
  diabetes_type2:        ['metformin','glibenclamide'],
  diabetes_emergency:    ['dextrose_solution'],
  period_pain:           ['ibuprofen','paracetamol'],
  pcos:                  ['metformin'],
  postpartum_depression: ['fluoxetine'],
  pre_eclampsia:         ['methyldopa','magnesium_sulfate'],
  preeclampsia:          ['methyldopa','magnesium_sulfate'],
  gonorrhoea:            ['ceftriaxone','azithromycin'],
  chlamydia:             ['azithromycin','doxycycline'],
  syphilis:              ['benzathine_penicillin'],
  herpes_genital:        ['acyclovir'],
  scabies:               ['permethrin','benzyl_benzoate'],
  skin_rash:             ['chlorpheniramine','calamine'],
  psoriasis:             ['hydrocortisone','calamine'],
  ringworm_tinea:        ['clotrimazole','griseofulvin'],
  chickenpox:            ['paracetamol','acyclovir','calamine'],
  conjunctivitis:        ['chloramphenicol_eye_drops'],
  ear_infection:         ['amoxicillin','paracetamol'],
  otitis_media:          ['amoxicillin','paracetamol'],
  hypothyroidism:        ['levothyroxine'],
  anaemia:               ['ferrous_sulfate','folic_acid','vitamin_b12'],
  malnutrition:          ['therapeutic_foods','vitamin_a_supplement','zinc'],
  malnutrition_sam:      ['therapeutic_foods','amoxicillin','vitamin_a_supplement'],
  sickle_cell:           ['paracetamol','folic_acid'],
  sickle_cell_disease:   ['paracetamol','folic_acid'],
  heat_exhaustion:       ['ors','paracetamol'],
  sepsis:                ['ceftriaxone','paracetamol'],
}

// ── Medication index: id → object ────────────────────────────
const MED_INDEX = {}
for (const med of ALL_MEDICATIONS) { MED_INDEX[med.id] = med }

// ─────────────────────────────────────────────────────────────
// CONDITION → REMEDY MAP
// Built from each remedy's helps_with[] field
// ─────────────────────────────────────────────────────────────
const REMEDY_BY_CONDITION = {}

// Helper: condition name/key → condition key lookup
const COND_NAME_INDEX = {}
for (const [key, cond] of Object.entries(MERGED_KB.conditions)) {
  COND_NAME_INDEX[cond.name.toLowerCase()] = key
  COND_NAME_INDEX[key.replace(/_/g,' ')] = key
}

// Category-term fallback mapping
const TERM_TO_COND = [
  [['nausea','vomit','morning sickness'],         'gastritis'],
  [['headache','migraine'],                        'migraine'],
  [['fever'],                                      'malaria'],
  [['anaemia','anemia','iron deficien'],            'anaemia'],
  [['cold','cough','sore throat'],                 'common_cold'],
  [['joint','arthritis','inflammation'],           'osteoarthritis'],
  [['diarrhoea','diarrhea','digestive'],           'diarrhoea_acute'],
  [['period','menstrual','dysmenorrhoea'],         'period_pain'],
  [['blood sugar','glucose','diabetes'],           'diabetes_type2'],
  [['blood pressure','hypertension'],             'hypertension'],
  [['wound','antiseptic','skin'],                  'skin_rash'],
  [['malnutrition','breastfeed','milk'],           'malnutrition'],
  [['immune','immunity'],                          'hiv_symptoms'],
  [['anxiety','stress'],                           'anxiety'],
  [['sleep','insomnia'],                           'depression'],
  [['burn'],                                       'skin_rash'],
]

function termToCondition(hwLower) {
  for (const [terms, key] of TERM_TO_COND) {
    if (terms.some(t => hwLower.includes(t))) return key
  }
  return null
}

for (const remedy of ALL_REMEDIES) {
  for (const hw of (remedy.helps_with || [])) {
    const hwLower = hw.toLowerCase()
    // Direct name/key match first
    let matchKey = COND_NAME_INDEX[hwLower] || null
    // Partial match
    if (!matchKey) {
      for (const [cname, ckey] of Object.entries(COND_NAME_INDEX)) {
        if (hwLower.includes(cname) || cname.includes(hwLower)) { matchKey = ckey; break }
      }
    }
    // Category term fallback
    if (!matchKey) matchKey = termToCondition(hwLower)

    if (matchKey) {
      if (!REMEDY_BY_CONDITION[matchKey]) REMEDY_BY_CONDITION[matchKey] = []
      if (!REMEDY_BY_CONDITION[matchKey].find(r => r.id === remedy.id)) {
        REMEDY_BY_CONDITION[matchKey].push(remedy)
      }
    }
  }
}

// ── First aid index ───────────────────────────────────────────
const FIRSTAID_INDEX = {}
for (const s of ALL_FIRSTAID) { FIRSTAID_INDEX[s.id] = s }

const FIRSTAID_KEYWORD_MAP = {
  burn:             ['burn','scalded','fire','hot water','boiling'],
  bleeding:         ['bleed','blood','cut','wound','laceration'],
  choking:          ['choke','choking','blocked throat','swallowed wrong'],
  snake_bite:       ['snake','bitten by snake','venom','snakebite'],
  fainting:         ['fainted','collapsed','unconscious','passed out'],
  seizure:          ['seizure','fit','convulsion','fitting'],
  fracture:         ['fracture','broken bone','broken arm','broken leg'],
  drowning:         ['drowned','drowning','near drowning'],
  head_injury:      ['head injury','hit head','concussion'],
  eye_injury:       ['eye injury','something in eye','chemical eye'],
  allergic_reaction:['allergic reaction','anaphylaxis','bee sting'],
  poisoning:        ['poisoning','swallowed poison','ingested'],
  heart_attack:     ['heart attack','chest pain arm','arm pain chest','jaw pain chest',
                     'crushing chest','squeezing chest'],
  stroke:           ['stroke','face drooping','arm weak sudden','speech slurred'],
}

// ── Nutrition index ───────────────────────────────────────────
const NUTRITION_INDEX = {}
for (const plan of ALL_NUTRITION) {
  NUTRITION_INDEX[plan.id] = plan
}
// Condition-key aliases
const NUTRITION_ALIASES = {
  anemia: 'anaemia', iron_deficiency: 'anaemia',
  diabetes_type2: 'diabetes', diabetes_symptoms: 'diabetes', diabetes_emergency: 'diabetes',
  hypertensive_crisis: 'hypertension', hypertensive_headache: 'hypertension',
}
for (const [alias, target] of Object.entries(NUTRITION_ALIASES)) {
  if (NUTRITION_INDEX[target]) NUTRITION_INDEX[alias] = NUTRITION_INDEX[target]
}

// ─────────────────────────────────────────────────────────────
// PUBLIC HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

export function getMedsForCondition(conditionKey) {
  const medIds = CONDITION_MED_MAP[conditionKey] || []
  const results = []
  for (const id of medIds) {
    if (MED_INDEX[id]) results.push(MED_INDEX[id])
  }
  // Fallback: scan uses[] for condition name
  if (results.length === 0) {
    const cond = MERGED_KB.conditions[conditionKey]
    if (cond) {
      const nameLower = cond.name.toLowerCase()
      for (const med of ALL_MEDICATIONS) {
        if ((med.uses||[]).some(u => u.toLowerCase().includes(nameLower) || nameLower.includes(u.toLowerCase()))) {
          if (!results.find(r => r.id === med.id)) results.push(med)
        }
      }
    }
  }
  return results.slice(0, 4)
}

export function getRemediesForCondition(conditionKey) {
  const direct = REMEDY_BY_CONDITION[conditionKey] || []
  const baseKey = conditionKey.replace(/_(mild|severe|major|acute|chronic|complications)$/, '')
  const base = (baseKey !== conditionKey) ? (REMEDY_BY_CONDITION[baseKey] || []) : []
  const seen = new Set()
  const merged = []
  for (const r of [...direct, ...base]) {
    if (!seen.has(r.id)) { seen.add(r.id); merged.push(r) }
  }
  return merged.slice(0, 3)
}

export function getFirstAid(situationId) {
  return FIRSTAID_INDEX[situationId] || null
}

export function findFirstAidByKeyword(text) {
  const lower = text.toLowerCase()
  for (const [situation, keywords] of Object.entries(FIRSTAID_KEYWORD_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) return FIRSTAID_INDEX[situation] || null
  }
  return null
}

export function findMedication(nameOrId) {
  if (!nameOrId) return null
  const lower = nameOrId.toLowerCase()
  return ALL_MEDICATIONS.find(med =>
    med.id === lower ||
    med.name.toLowerCase().includes(lower) ||
    (med.brand_names||[]).some(b => b.toLowerCase().includes(lower))
  ) || null
}

export function findRemedy(nameOrId) {
  if (!nameOrId) return null
  const lower = nameOrId.toLowerCase()
  return ALL_REMEDIES.find(r =>
    r.id === lower ||
    r.name.toLowerCase().includes(lower) ||
    (r.local_names||[]).some(n => n.toLowerCase().includes(lower.split(' ')[0]))
  ) || null
}

export function getNutritionPlan(conditionOrTopic) {
  if (!conditionOrTopic) return null
  return NUTRITION_INDEX[conditionOrTopic] || null
}

export default MERGED_KB
