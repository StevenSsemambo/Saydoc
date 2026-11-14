// ── SayMyDoc AI Companion Brain v2 — Yolanda ────────────────
// Warm, deeply knowledgeable, caring health companion.
// No external APIs. Pure in-app intelligence with massive health knowledge.

import { CONDITIONS } from './InferenceEngine.js'
import { detectRedFlag } from './RedFlags.js'
import { LUGANDA_SYMPTOMS } from './NLPProcessor.js'
import { detectSelfHarmRisk, getSelfHarmResponse, detectEmotion, getEmpathyPrefix } from './EmotionalEngine.js'
import {
  getMedsForCondition,
  getRemediesForCondition,
  getFirstAid,
  findMedication,
  findRemedy,
  ALL_MEDICATIONS,
  ALL_REMEDIES,
  ALL_FIRSTAID,
  ALL_NUTRITION,
  MERGED_KB,
} from './KnowledgeMerger.js'

// Backwards-compatible aliases so existing code works unchanged
const medsData     = { medications: ALL_MEDICATIONS }
const remediesData = { remedies: ALL_REMEDIES }
const firstAidData = { situations: ALL_FIRSTAID }
const nutritionData = { plans: ALL_NUTRITION }

const PERSONALITY = {
  name: 'Yolanda',
  tagline: 'Your personal health companion',
  traits: ['warm', 'knowledgeable', 'honest', 'calm', 'locally-aware', 'caring', 'empowering'],
}

// ── Topic patterns v3 — expanded for natural/vague/Ugandan queries ──
const TOPIC_PATTERNS = {
  greeting: [
    'hello','hi','hey','good morning','good afternoon','good evening',
    'oli otya','habari','how are you','whats up',"what's up",'sup','jambo',
    'good day','howdy','greetings','salaam','shalom','what is up','how do you do',
  ],
  medication: [
    'drug','medicine','tablet','paracetamol','ibuprofen','amoxicillin','coartem',
    'metformin','aspirin','omeprazole','salbutamol','dose','dosage','how much',
    'how many','take','prescription','side effect','antibiotic','pill','capsule',
    'syrup','injection','overdose','interaction','safe in pregnancy','can i take',
    'what to take','what can i take','what should i take','which medicine',
    'is it safe','is it okay to take','can i use','medication for','drug for',
    'treatment for','remedy for','cure for','what helps with','what helps for',
    'cotrimoxazole','doxycycline','metronidazole','ciprofloxacin','amoxil',
    'panadol','flagyl','septrin','depo','folic acid','iron tablets','vitamin',
  ],
  nutrition: [
    'food','diet','nutrition','meal','feed','baby food','what to eat',
    'weight','gain weight','lose weight','pregnancy food','child food',
    'infant','vegetable','fruit','protein','vitamin','mineral','iron','calcium',
    'folate','moringa','healthy eating','what should i eat','what to avoid eating',
    'foods to eat','foods to avoid','good foods','bad foods','nutrients',
    'porridge','matoke','posho','beans','groundnuts','simsim',
  ],
  first_aid: [
    'emergency','accident','burn','cut','wound','bleeding','choking','unconscious',
    'snake bite','drowning','fracture','broken bone','faint','collapsed','poisoning',
    'electric shock','head injury','eye injury','allergic reaction','anaphylaxis',
    'seizure','fits','convulsion','how to treat','treat a burn','treat a cut',
    'first aid','dressing a wound','scalded','near drowning','road accident',
    'someone collapsed','baby not breathing','child fell',
  ],
  condition_info: [
    'what is','tell me about','explain','describe','how does','why does',
    'what causes','symptoms of','signs of','how do you get','is it contagious',
    'how long','can it be cured','i think i have','i might have','could this be',
    'is this','could it be','i was diagnosed','diagnosed with','i have been told',
    'doctor said','clinic said','results show','test shows','i tested positive',
    'i suspect','could be','might be','is it possible i have',
    'hypertension','typhoid','malaria signs','what are the signs',
    'pressure','my pressure','high pressure','low pressure',
  ],
  prevention: [
    'prevent','avoid','protect','vaccine','vaccination','immunise','mosquito',
    'hygiene','how to avoid','risk factor','how to stop getting','prophylaxis',
    'how to prevent','protect myself','protect my family','stay safe',
    'avoid getting','not get sick',
  ],
  mental_health: [
    'stress','anxiety','anxious','depressed','depression','sad','worried',
    'mental','sleep',"can't sleep",'insomnia','tired all time','panic','fear',
    'trauma','grief','hopeless','overwhelmed','burnout','anger','mood',
    'emotional','psychologist','counselling','not myself','feeling down',
    'feeling low','no motivation','no interest','feel empty','feeling empty',
    'going through a lot','struggling emotionally','mental struggles',
    'dark thoughts','want to die','feel like dying','burden','lost hope',
    'crying all the time','cannot cope','feel worthless','feel useless',
    'not enjoying anything','no reason to live','suicidal','thinking of ending',
    'feel like giving up','nothing matters','i am a burden','feel like a burden',
    'everything is dark','no energy to live','have not been myself',
    'not been feeling myself','not feeling like myself',
  ],
  pregnancy: [
    'pregnant','pregnancy','antenatal','newborn','breastfeed','lactating',
    'postnatal','labour','delivery','birth','trimester','due date','miscarriage',
    'morning sickness',"i am pregnant","i'm pregnant",'pregnancy nutrition',
    'pregnant and','while pregnant','anc','maternal','when i was pregnant',
    'my pregnancy','for a pregnant woman','nausea pregnant','vomiting pregnant',
    'swollen feet pregnant',
  ],
  child_health: [
    'child','baby','infant','toddler','kid','my son','my daughter',
    'years old','year old','months old','month old','my child','growth',
    'development','milestones','vaccination child','paediatric','pediatric',
    'for a child','for children','child fever','baby fever','infant fever',
    'old has fever','old is sick','old with fever','old has cough',
    'old has diarrhea','2 year','3 year','4 year','5 year','6 year',
    '7 year','8 year','baby not eating','child not eating','my baby',
    'for my child','my son has','my daughter has','child has','baby has',
    'omwana','abaana',
  ],
  hiv_tb: [
    'hiv/','hiv ','hiv-','aids','tb ','tuberculosis','antiretroviral',
    'viral load','cd4 count','positive status','seropositive','hiv prevention',
    'hiv symptoms','hiv test','hiv treatment','art medication','about hiv',
    'about tb','about aids','cough blood','night sweats weight loss',
    'silimu','art drugs','arv',
  ],
  malaria: [
    'malaria','mosquito bite','fever chills','coartem','ACT','RDT',
    'rapid test malaria','i think malaria','could be malaria','test for malaria',
    'malaria treatment','malaria prevention','malarial fever',
    'omusujja','malaariya',
  ],
  water_hygiene: [
    'water','hygiene','handwashing','sanitation','clean water','boil water',
    'diarrhoea water','cholera water','safe water','water purification',
    'water guard','water treatment',
  ],
  sexual_health: [
    'sex','sexual','sti','std','condom','contraception','family planning',
    'gonorrhoea','syphilis','chlamydia','reproductive','menstrual','period',
    'discharge','family plan','birth control','contraceptive','pregnancy prevention',
    'depo shot','implant','iud','pill for family','sexual infection',
  ],
  chronic_disease: [
    'diabetes','hypertension','blood pressure','heart disease','kidney',
    'asthma','arthritis','cancer','chronic','lifelong medication','blood sugar',
    'insulin','sugar disease','sugar level','sugar is high','bp problem',
    'pressure problem','heart problem','asthma attack','inhalers','pressure is high','my pressure is',
  ],
  symptoms: [
    'i have','i feel','my head','my stomach','i am sick','pain','ache',
    'hurts','unwell','sick','fever','vomiting','diarrhoea','diarrhea',
    'fatigue','tired','dizzy','rash','itching','swollen','bleeding','cough',
    'feeling','suffering','bothering me','troubling me','disturbing me',
    'problems','issues','something wrong','not right','body is',
    'i keep','keeps','recurring','coming back','since','for days',
    'for weeks','since yesterday','stooling','paining','running stomach',
    'body is weak','body is paining','something is wrong','something is not right',
  ],
  general_wellness: [
    'healthy','health tips','wellness','lifestyle','exercise','fitness',
    'sleep better','energy','feel better','improve health','healthy living',
    'stay healthy','good health','tips for health',
  ],
  farewell: [
    'bye','goodbye','thank you','thanks','asante','webale','see you',
    'later','take care','appreciate','that helped','that helps','all good now',
    'i understand now','makes sense now',
  ],
}

// ── Smart fallback topic detector ─────────────────────────────
// Catches vague/indirect expressions the pattern list misses
function smartTopicFallback(lower) {
  // Medication intent
  if (/what (can|should|do) i take|what (helps|works) for|treatment|cure for|medicine for|drug for|what (food|foods) (to|should)|what to avoid/.test(lower)) return 'nutrition'
  // Condition inquiry
  if (/could (this|it) be|i (think|suspect|believe) i (have|might)|is (this|it) serious|what (is|are) the|diagnosed/.test(lower)) return 'condition_info'
  // Mental health - indirect
  if (/going through a lot|not been myself|feel like a burden|lost hope|dark thoughts|everything feels|no reason|cannot cope|feeling low|feeling down/.test(lower)) return 'mental_health'
  // Child context
  if (/my (son|daughter|baby|child|kid)|years? old (has|is|with)|months? old|for a child/.test(lower)) return 'child_health'
  // Pregnancy context
  if (/while pregnant|during pregnancy|for a pregnant|pregnancy related/.test(lower)) return 'pregnancy'
  // Vague unwell
  if (/something (is )?(wrong|not right)|not (feeling|been) (well|fine|good|myself)|feel (somehow|strange|weird|off)/.test(lower)) return 'symptoms'
  // High BP/pressure
  if (/pressure (is )?(high|low|problem)|my (bp|blood pressure)|high bp/.test(lower)) return 'chronic_disease'
  return null
}

function detectTopic(text) {
  const lower = text.toLowerCase()
  const scores = {}
  for (const [topic, patterns] of Object.entries(TOPIC_PATTERNS)) {
    const score = patterns.filter(p => lower.includes(p)).length
    if (score > 0) scores[topic] = score
  }
  if (!Object.keys(scores).length) {
    // Try smart fallback
    const fallback = smartTopicFallback(lower)
    return fallback || 'general'
  }
  const best = Object.entries(scores).sort((a,b) => b[1]-a[1])[0][0]
  // Override greeting false-positives: if 'hi' or 'hey' in a longer medical sentence, trust other topic
  if (best === 'greeting' && lower.length > 25 && scores['greeting'] <= 1) {
    const others = Object.entries(scores).filter(([t]) => t !== 'greeting').sort((a,b) => b[1]-a[1])
    if (others.length > 0) return others[0][0]
    const fallback = smartTopicFallback(lower)
    if (fallback) return fallback
  }
  // Pregnancy override — if pregnant mentioned + symptoms, route to pregnancy
  if (lower.includes('pregnant') && scores['pregnancy']) return 'pregnancy'
  // Child context override — age + sickness patterns win over generic symptoms
  if (scores['child_health'] && lower.match(/\d+\s*(year|month)s? old/) ) return 'child_health'
  return best
}

function findConditionInText(text) {
  const lower = text.toLowerCase()
  for (const [key, cond] of Object.entries(CONDITIONS)) {
    if (lower.includes(cond.name.toLowerCase()) || lower.includes(key.replace(/_/g,' '))) return { key, cond }
  }
  return null
}

function wordInText(text, word) {
  // Word-boundary aware match — prevents brand names like 'Trimox' matching
  // inside drug names like 'cotrimoxazole', while still catching 'ORS' in 'Tell me about ORS'.
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp('(?<![a-zA-Z])' + escaped + '(?![a-zA-Z])', 'i').test(text)
}

function findDrugInText(text) {
  const lower = text.toLowerCase()
  // Pass the full text to findMedication first (handles exact id/name matches)
  const direct = findMedication(text)
  if (direct) return direct
  // Scan every medication using word-boundary checks on:
  //   id  — clean base name, e.g. 'paracetamol' (no parentheticals)
  //   name — full display name, e.g. 'Paracetamol (Acetaminophen)'
  //   brand_names — trade names, e.g. 'Panadol', 'Coartem'
  return ALL_MEDICATIONS.find(med => {
    const id     = (med.id || '').replace(/_/g, ' ').toLowerCase()
    const name   = med.name.toLowerCase()
    const brands = (med.brand_names || []).map(b => b.toLowerCase())
    return wordInText(lower, id) ||
           wordInText(lower, name) ||
           brands.some(b => wordInText(lower, b))
  }) || null
}

function findRemedyInText(text) {
  // Use KnowledgeMerger helper which covers all remedies
  return findRemedy(text)
    || ALL_REMEDIES.find(r =>
        text.toLowerCase().includes(r.name.toLowerCase()) ||
        (r.local_names||[]).some(n => text.toLowerCase().includes(n.toLowerCase().split(' ')[0]))
      )
    || null
}

// ── Greetings ─────────────────────────────────────────────────
const GREETINGS = [
  (name) => `Oli otya, ${name||'friend'}! 😊 I'm Yolanda, your personal health companion. I'm here 24/7 — completely offline — to help you understand your health. Think of me as a knowledgeable health friend who genuinely cares. I can discuss symptoms, medications, nutrition, child health, mental health, first aid, and any health question you have. What's on your mind?`,
  (name) => `Hello ${name||'there'}! 💚 I'm Yolanda. Health can be confusing, expensive, and scary — that's exactly why I'm here. You deserve to understand your own health without travelling to a clinic or paying for every question. What would you like to know?`,
  (name) => `Karibu ${name?name+'!':''} 🌿 I'm Yolanda from SayMyDoc. I carry the knowledge of thousands of medical resources — all available to you, free, offline, anytime. Whether it's a quick medication question, understanding a diagnosis, or first aid guidance — I'm here. What can I help you with?`,
  (name) => `Good to see you, ${name||'friend'}! 💙 I'm Yolanda. I speak plainly, I'm honest, and I genuinely care about your wellbeing. I have deep knowledge on diseases, medications, nutrition, child health, mental health, HIV, TB, malaria, and much more. What's on your mind?`,
]

const FAREWELLS = [
  'Take care of yourself — your health is your greatest wealth. I\'m always here when you need me. 🌿',
  'Stay well and remember — understanding your health is the first step to taking care of it. 😊',
  'Webale! Thank you for using SayMyDoc. Your health matters, and so do you. 💚',
  'Asante sana! Keep asking questions — a person who asks lives long. Stay healthy! 🌟',
  'Take good care. Drink water, rest well, and never ignore what your body is telling you. 💙',
]

const WELLNESS_TIPS = [
  'Drink 8–10 glasses of water daily. In Uganda\'s heat, dehydration silently causes headaches, fatigue, kidney stones, and poor concentration.',
  'Sleep at consistent times every night. Your brain, immune system, and hormones do critical repair work only during deep sleep.',
  'Wash hands with soap before eating and after toilet use. This prevents more illness than almost any other single habit.',
  'Walk 30 minutes daily. This single habit reduces risk of diabetes, hypertension, depression, and heart disease significantly.',
  'Never take antibiotics for viral infections (cold, flu). Antibiotic resistance is making infections untreatable worldwide.',
  'Test for malaria immediately when you have fever. Never assume and self-treat without a rapid diagnostic test.',
  'Breastfeed exclusively for the first 6 months — no water, no porridge. Breast milk provides complete nutrition and powerful infection protection.',
  'Eat liver, beans, and dark leafy greens regularly. These are your best affordable sources of iron for preventing anaemia.',
  'Know your HIV status. Free, confidential testing is available at all Uganda health facilities — results same day.',
  'Check your blood pressure at least once a year if over 30. Hypertension has no symptoms until it causes a stroke.',
  'Deworm every 6 months. Intestinal worms steal nutrients, cause anaemia, and impair children\'s school performance.',
  'Moringa grows throughout Uganda — it\'s one of the world\'s most nutritious plants. Add it to food for iron, calcium, and vitamins.',
  'Smoking doubles risk of heart disease and causes at least 15 types of cancer. Benefits of quitting begin within 24 hours.',
  'Cervical cancer kills thousands of Ugandan women each year but is 100% preventable with HPV vaccination and screening.',
  'Physical exercise is as effective as antidepressants for mild-moderate depression — and it also treats anxiety, insomnia, and 40+ other conditions.',
]

// ── Prevention knowledge ──────────────────────────────────────
const PREVENTION = {
  malaria: { text: `**Malaria Prevention:**\n\n🛏️ **Sleep under an insecticide-treated net (ITN) every night** — most effective prevention. Mosquitoes bite dusk to dawn.\n🏠 **Eliminate standing water** near home — tyres, containers, gutters.\n🧴 **Apply mosquito repellent** (DEET) on exposed skin at dusk.\n🪟 **Screen windows** if possible.\n🤰 **Pregnant women:** Take IPTp at every antenatal visit (free).\n🧪 **Fever?** Test immediately with RDT — never assume or treat without testing.\n\n💊 **Treatment:** Coartem (artemether-lumefantrine) — first line, FREE at government facilities. Take with food. Complete 3-day course.`, suggestions: ['Malaria symptoms','Coartem dosage','Malaria in pregnancy','Fever in a child'] },
  hiv: { text: `**HIV Prevention:**\n\n🛡️ **Condoms** used consistently are highly effective against HIV and all STIs.\n🧪 **Test regularly** — free and confidential at all Uganda facilities.\n💊 **PrEP** (daily pill for HIV-negative people at risk) — available at many Uganda facilities.\n⚡ **PEP:** If exposed to HIV in last 72 hours — go to hospital NOW. Must start within 72 hours.\n💉 **Never share needles, razors, or any sharp objects.**\n🤱 **Mother-to-child:** Proper ART reduces transmission to below 1%.\n\n🚫 **NOT transmitted by:** Hugging, sharing food, mosquitoes, toilet seats, coughing.`, suggestions: ['HIV symptoms','ART treatment Uganda','HIV testing','PEP Uganda'] },
  typhoid: { text: `**Typhoid Prevention:**\n\n💧 Drink only boiled, treated, or bottled water.\n🙌 Wash hands with soap before eating and after toilet.\n🍲 Eat only freshly cooked food — avoid reheated food and street food from unhygienic sources.\n🚽 Proper sanitation — use latrines, keep them clean.\n💉 Typhoid vaccines available — ask your health facility.`, suggestions: ['Typhoid symptoms','Typhoid treatment','Safe water','Cholera prevention'] },
  cholera: { text: `**Cholera Prevention:**\n\n💧 Drink only boiled, chlorinated, or bottled water — cholera spreads almost entirely through contaminated water.\n🙌 Wash hands with soap before eating, after toilet.\n🍽️ Cook food thoroughly. Avoid raw seafood in outbreak areas.\n💊 **Keep ORS at home** — cholera kills through dehydration. ORS saves lives while going to hospital. Free at all health centres.`, suggestions: ['ORS preparation','Cholera symptoms','Diarrhoea treatment','Safe water purification'] },
  tb: { text: `**TB Prevention:**\n\n🏠 **Ventilation** — open windows daily. TB spreads through the air in poorly ventilated spaces.\n😷 **If you have TB:** Cover your mouth when coughing. Wear a mask in crowds.\n💉 **BCG vaccine** at birth — protects children from severe TB.\n🧪 **Screen contacts** — if a household member has TB, all should be tested.\n💊 **Complete treatment** — NEVER stop TB medication early. Stopping creates drug-resistant TB.`, suggestions: ['TB symptoms','TB treatment Uganda','Drug-resistant TB','HIV and TB'] },
  diabetes: { text: `**Diabetes Prevention:**\n\n⚖️ Maintain healthy weight — excess abdominal fat is the primary driver of Type 2 diabetes.\n🏃 Exercise 30 min daily — directly improves insulin sensitivity, reduces risk by up to 58%.\n🍽️ Reduce sugar, white rice, white bread, and sugary drinks.\n🥗 Eat more vegetables, beans, and whole grains.\n🧪 Test blood sugar annually if over 40, overweight, or with family history.`, suggestions: ['Diabetes symptoms','Blood sugar management','Diabetes diet Uganda','Metformin information'] },
  hypertension: { text: `**Hypertension Prevention:**\n\n🧂 Reduce salt — most Ugandans eat 2–3× the healthy amount.\n🏃 Exercise 30 min daily — lowers blood pressure 5–8 mmHg.\n⚖️ Maintain healthy weight — losing 5kg can significantly lower BP.\n🍺 Limit alcohol.\n💊 If prescribed medication — take it every day without fail, even when feeling fine.\n🩺 Check blood pressure regularly — free at all Uganda facilities.`, suggestions: ['Blood pressure medication','DASH diet Uganda','Stroke prevention','Blood pressure monitoring'] },
  cancer: { text: `**Cancer Prevention:**\n\n🚭 Stop smoking — causes 15+ types of cancer.\n🍺 Limit alcohol — causes liver, mouth, throat, and breast cancer.\n💉 Vaccinate against hepatitis B (liver cancer) and HPV (cervical cancer).\n🩺 Cervical cancer screening — VIA or Pap smear every 3 years for all adult women.\n⚖️ Maintain healthy weight — obesity linked to 13 types of cancer.\n🥗 Eat vegetables, fruits, and fibre. Limit processed and red meat.`, suggestions: ['Cervical cancer screening Uganda','HPV vaccine','Liver cancer prevention','Breast self-examination'] },
}

// ── Pregnancy knowledge ───────────────────────────────────────
const PREGNANCY = {
  nutrition: `**Nutrition During Pregnancy:**\n\n🥚 **Protein** (eggs, beans, meat, fish, groundnuts): Essential for baby's growth — at least one protein source every meal.\n🥬 **Iron** (liver, dark leafy greens, beans + vitamin C to help absorption): Prevents anaemia. Iron supplements free at antenatal clinics.\n🌿 **Folate** (dark leafy greens, beans, liver): Critical first 12 weeks for preventing neural tube defects. Take folic acid from before conception.\n🥛 **Calcium** (milk, simsim, small fish with bones, dark greens): Baby draws calcium from YOUR bones if diet is low.\n🥕 **Vitamin A** (orange sweet potato, carrot, pumpkin, liver): Eye and immune development.\n\n❌ **Avoid:** Alcohol (no safe amount), excessive caffeine (max 2 weak teas/day), raw meat/fish, papaya seeds.`,
  danger_signs: `**Pregnancy Danger Signs — Hospital Immediately:**\n\n🚨 Heavy vaginal bleeding\n🚨 Severe headache with vision changes (blurred vision, seeing spots)\n🚨 Swollen face/hands/feet with headache (pre-eclampsia)\n🚨 High fever above 38°C\n🚨 Severe abdominal pain\n🚨 Baby not moving for several hours (after 28 weeks)\n🚨 Water breaking before 37 weeks\n🚨 Fits or convulsions (eclampsia)\n🚨 Severe vomiting — can't drink or eat`,
  antenatal: `**Antenatal Care in Uganda — FREE at Government Facilities:**\n\nWHO recommends 8+ visits. Uganda government facilities provide all ANC free.\n\n📅 **First visit:** Before 12 weeks\nThen at: 20, 26, 30, 34, 36, 38, 40 weeks\n\n**Each visit includes:**\n✅ Blood pressure and urine check\n✅ HIV, syphilis, anaemia testing\n✅ Malaria prevention (IPTp — free from 13 weeks)\n✅ Iron and folic acid supplements (free)\n✅ Tetanus vaccination\n✅ Baby's growth monitoring\n\n📗 Always bring your Maternal Health Card to every visit.`,
  breastfeeding: `**Breastfeeding — The Most Important Investment:**\n\n✅ **Exclusive breastfeeding for 6 months** — no water, no porridge, no other food or liquid.\n\n**Why:**\n• Protects against diarrhoea, pneumonia, and dozens of infections\n• Contains immune factors no formula can replicate\n• Reduces risk of childhood obesity and diabetes\n• Reduces mother's risk of breast and ovarian cancer\n• Free — formula is expensive and risky with unsafe water\n\n⏱️ **Continue for 2 years** alongside solid foods from 6 months.\n\n💊 **HIV-positive mothers:** Breastfeed while on ART — reduces transmission to <1%.`,
}

// ── Child health ──────────────────────────────────────────────
const CHILD_HEALTH = {
  immunisation: `**Uganda EPI Vaccination Schedule:**\n\n🏥 **At Birth:** BCG, Oral Polio 0, Hepatitis B\n🏥 **6 Weeks:** Pentavalent 1 (DPT-HepB-Hib), Oral Polio 1, PCV 1, Rotavirus 1\n🏥 **10 Weeks:** Pentavalent 2, Oral Polio 2, PCV 2, Rotavirus 2\n🏥 **14 Weeks:** Pentavalent 3, Oral Polio 3, PCV 3, IPV\n🏥 **9 Months:** Measles-Rubella 1, Yellow Fever, Vitamin A\n🏥 **15 Months:** Measles-Rubella 2\n📅 **Every 6 months** (6 months to 5 years): Vitamin A\n\n⚡ Missed vaccines? Go to any facility — continue from where you left off. Not too late!`,
  danger_signs: `**Child Danger Signs — Go to Hospital NOW:**\n\n🚨 Cannot drink or breastfeed\n🚨 Vomits everything\n🚨 Convulsions/fits\n🚨 Unusually sleepy or difficult to wake\n🚨 Fast breathing (>60/min in babies, >50/min in 1–5 year olds)\n🚨 Chest drawing in with each breath\n🚨 Blue lips or fingernails\n🚨 Fever above 38°C in baby under 3 months\n🚨 Fever with stiff neck (meningitis)\n🚨 Blood in stool\n🚨 Sunken eyes + not crying tears + very dry mouth (severe dehydration)`,
  feeding: `**Starting Solid Foods (6 Months):**\n\n🍌 Continue breastfeeding + add:\n\n**Month 6–7:** Smooth single foods — mashed banana, sweet potato, pumpkin, thin bean purée\n**Month 7–8:** Thicker mixtures, soft lumps — mashed beans, avocado, egg yolk\n**Month 9–11:** Finely chopped soft family foods\n**12 months+:** Most family foods (avoid added salt, sugar, honey before 1 year)\n\n✅ **Every meal should include:**\n• A starchy food (matoke, sweet potato, rice)\n• A protein (beans, egg, fish, groundnuts)\n• A vitamin A food (orange sweet potato, pumpkin, dark greens)\n• A little fat (oil, avocado)\n\n**Feeding frequency:**\n• 6–8 months: 2–3 meals + breastfeeds\n• 9–11 months: 3–4 meals + breastfeeds\n• 12–24 months: 3 meals + 2 snacks + breastfeeds`,
}

// ── Chronic disease knowledge ─────────────────────────────────
const CHRONIC = {
  diabetes: `**Understanding Diabetes:**\n\n🩸 **What it is:** Body can't properly use glucose (blood sugar) — either no insulin (Type 1) or resistance to insulin (Type 2).\n\n**Symptoms of uncontrolled diabetes:**\n• Excessive thirst and frequent urination\n• Unexplained weight loss\n• Fatigue, blurred vision\n• Slow-healing wounds and frequent infections\n• Tingling/numbness in hands and feet\n\n**Complications if uncontrolled:**\n• Blindness, kidney failure, amputations, heart attack, stroke, impotence\n\n**Management:**\n✅ Healthy diet — reduce sugar, white rice, white bread; eat more beans, vegetables, whole grains\n✅ Exercise daily — 30 min walking improves insulin sensitivity directly\n✅ Medication if prescribed — never stop without advice\n✅ Monitor blood sugar\n✅ Check feet daily (neuropathy means you may not feel wounds)\n\n**Diabetes is manageable.** With proper care, people with diabetes live full, healthy lives.`,
  hypertension: `**Understanding High Blood Pressure:**\n\n📊 **Readings:**\n• Normal: below 120/80 mmHg\n• Stage 1 Hypertension: 130–139/80–89\n• Stage 2 Hypertension: 140+/90+\n• Crisis: above 180/120 — emergency\n\n**Why it's called the silent killer:**\nNo symptoms until it damages organs. Most people don't know they have it.\n\n**Damage:**\n• Brain — stroke (leading disability cause in Uganda)\n• Heart — heart attack, heart failure\n• Kidneys — kidney failure requiring dialysis\n• Eyes — blindness\n\n**Treatment:**\n1. Reduce salt, exercise daily, maintain healthy weight, limit alcohol\n2. Medication if needed — inexpensive and available in Uganda\n3. Take medication EVERY DAY — even when feeling completely fine\n4. Never stop medication without consulting a health worker\n\n🩺 Free blood pressure checks at all Uganda health facilities.`,
  angina: `**Understanding Angina (Chest Pain on Exertion):**

❤️ **What it is:**
Angina is chest pain caused by reduced blood flow to the heart during activity. It is a warning sign — the heart is not getting enough oxygen when it works hard.

**Recognising angina:**
• Chest tightness, pressure, or squeezing — often described as "something sitting on my chest"
• Triggered by walking, climbing stairs, lifting, or emotional stress
• Usually goes away after 3–5 minutes of rest
• May spread to the left arm, jaw, neck, or back

🚨 **When it becomes an emergency — unstable angina / heart attack:**
• Pain at rest (not triggered by activity)
• Pain lasting more than 5–10 minutes without improvement
• Pain that is getting worse each time
• Pain with sweating, nausea, or feeling faint
➡️ **These are EMERGENCY symptoms — go to hospital immediately**

💊 **Treatment:**
• GTN (glyceryl trinitrate) spray or tablet — taken under the tongue during an episode
• Daily aspirin and beta-blockers
• Statins (reduce cholesterol and plaque buildup)
• Lifestyle: stop smoking, reduce fat, control blood pressure and diabetes

🇺🇬 **Uganda context:** Angina is increasingly common in urban Uganda. Many people describe it as "chest pressure when walking" and assume it will pass. Please see a doctor — it is very manageable but must not be ignored.`,

  heart_attack: `**Understanding Heart Attack (Acute Coronary Syndrome):**

💔 **What happens:**
A blood clot suddenly blocks a coronary artery. Heart muscle begins to die within minutes. Time is everything — every minute of delay causes more permanent heart damage.

🚨 **Warning signs — act IMMEDIATELY if you notice these:**
• Crushing, squeezing, or heavy pressure in the chest
• Pain spreading to the left arm, jaw, neck, or back
• Sweating, nausea, or feeling faint alongside chest pain
• Sudden shortness of breath
• A feeling of doom or extreme anxiety

🏃 **What to do RIGHT NOW:**
1. Call for help — do NOT drive yourself
2. Chew one aspirin (300–325mg) if available — do NOT swallow whole, chew it
3. Sit or lie in a comfortable position
4. Use GTN spray if prescribed
5. Get to Mulago, regional hospital, or nearest emergency unit

⏰ **Time to treatment matters:**
• Within 1 hour: most heart muscle can be saved
• After 6 hours: significant permanent damage
• After 12 hours: severe damage

🇺🇬 **Uganda:** Mulago National Referral Hospital and all major regional hospitals have cardiac units. Transport quickly — this is not a condition to "wait and see."`,

  gerd: `**Understanding GERD / Acid Reflux:**

🔥 **What it is:**
Stomach acid flows back up into the food pipe (oesophagus), causing burning pain in the chest or throat. Very common — affects millions of people and is usually very manageable.

**Typical symptoms:**
• Burning sensation in the chest, especially after meals or when lying down
• Sour or bitter taste in the mouth
• Worse when bending over or lying flat
• Often mistaken for heart pain

🍽️ **Common triggers in Uganda:**
• Spicy food (pilau, rolex, matoke with groundnut sauce)
• Fried foods, fatty foods
• Coffee and strong tea
• Large late-night meals
• Alcohol and soda
• Eating quickly and lying down immediately after

💊 **What helps:**
✅ Antacids (sodium bicarbonate, aluminum hydroxide) — immediate relief
✅ Omeprazole (20mg) — taken before breakfast, most effective for regular symptoms
✅ Ranitidine — also widely available
✅ Eat smaller meals more frequently
✅ Wait 2–3 hours after eating before lying down
✅ Raise the head of your bed by 15–20cm

🚨 **See a doctor if:** Difficulty swallowing, weight loss, vomiting blood, or symptoms more than twice a week despite medication.`,

  asthma: `**Understanding Asthma:**\n\n💨 **Triggers in Uganda:**\nSmoke (cooking fires, biomass fuel, cigarettes), dust, pollen, mould, cold air, exercise, respiratory infections, strong smells.\n\n**Symptoms:**\n• Wheezing (high-pitched whistling)\n• Shortness of breath, chest tightness\n• Cough (worse at night)\n\n**Inhalers:**\n🔵 **Blue (Reliever — salbutamol):** Opens airways during attack. Use for symptoms.\n🔴 **Red/Brown (Preventer — corticosteroid):** Reduces inflammation. Use DAILY even when well.\n\n**Attack management:**\n1. Sit upright\n2. Use reliever inhaler (up to 10 puffs, 1 at a time)\n3. Call for help if no improvement in 15 min\n4. Hospital if still struggling after 2 rounds`,
}

// ── Mental health ─────────────────────────────────────────────
const MENTAL = {
  depression: `**Depression — Real, Common, Treatable:**\n\nDepression is not weakness or lack of faith. It involves real changes in brain chemistry.\n\n**Symptoms (5+ for 2+ weeks):**\n• Persistent sadness or emptiness\n• Loss of interest in things you used to enjoy\n• Fatigue and loss of energy\n• Difficulty concentrating or deciding\n• Sleep changes (too much or too little)\n• Feelings of worthlessness or guilt\n• Thoughts of death\n\n**In Uganda:** Often expressed as headaches, fatigue, body pains.\n\n**What helps:**\n✅ Physical exercise — as effective as antidepressants for mild-moderate\n✅ Social connection — isolation amplifies depression\n✅ Structured daily routine — depression thrives in unstructured time\n✅ Reducing alcohol — it's a depressant that worsens depression\n✅ Counselling — available at district hospitals\n✅ Antidepressants for moderate-severe cases\n\n🏥 **Help in Uganda:** Butabika National Hospital. Mental health units at all regional hospitals.`,
  anxiety: `**Anxiety — Understanding and Managing It:**\n\nAnxiety is your body's alarm system firing too often or intensely.\n\n**Symptoms:**\n• Excessive worry you can't control\n• Restlessness, feeling on edge\n• Heart racing, chest tightness, shortness of breath\n• Sweating, dizziness, stomach upset\n• Sleep difficulties\n• Avoidance of triggers\n\n**Panic attacks:** Sudden intense fear with physical symptoms — terrifying but never dangerous. Always pass.\n\n**What helps:**\n✅ **Controlled breathing:** In 4 counts, hold 4, out 4. Activates calming nervous system.\n✅ **Exercise:** Reduces cortisol and adrenaline — as effective as medication.\n✅ **Reduce caffeine and alcohol** — both worsen anxiety.\n✅ **CBT (therapy):** Most effective psychological treatment.\n✅ **Medication:** SSRIs for severe anxiety.`,
  sleep: `**Sleep — Why It's Medical, Not Optional:**\n\n**Adults need 7–9 hours. Consistently less than 6:**\n• Doubles risk of diabetes and hypertension\n• Impairs immune function\n• Increases depression and anxiety risk\n• Reduces concentration like being drunk\n\n**Evidence-based sleep hygiene:**\n✅ Same wake time every day (even weekends)\n✅ Dark, cool, quiet room\n✅ No screens 30–60 min before bed (blue light suppresses melatonin)\n✅ No caffeine after 2pm\n✅ Exercise during the day, not late evening\n✅ If awake 20+ min — get up, do something calm, return when sleepy\n✅ Avoid alcohol — disrupts sleep quality even if it helps you fall asleep\n\n💡 CBT for insomnia (CBT-I) is more effective than sleeping tablets long-term.`,
}

// ── Sexual health ─────────────────────────────────────────────
const SEXUAL = {
  contraception: `**Family Planning Options — All Free at Uganda Government Facilities:**\n\n💊 **Combined Oral Pill (COC):** Daily, same time. 99% effective if correct. Not for smokers over 35 or history of blood clots.\n\n💊 **Progestogen-Only Pill (POP):** Safer for breastfeeding mothers. Must take within same 3-hour window daily.\n\n💉 **Depo-Provera (3-month injection):** Very popular — convenient. Can cause irregular periods or none. Fertility may take 18 months to return.\n\n🩹 **Implant (Implanon/Jadelle):** Inserted under skin of upper arm. Lasts 3–5 years. Over 99.9% effective. Can cause irregular bleeding.\n\n🔩 **IUD:** Copper IUD — non-hormonal, lasts 10 years. Also effective emergency contraception if inserted within 5 days.\n\n♂️ **Male Condom:** Only method protecting against HIV and STIs. 85–98% effective. Free at all facilities and pharmacies.`,
  menstrual: `**Menstrual Health:**\n\n📅 **Normal cycle:** 21–35 days, 3–7 day periods.\n\n**See a doctor for:**\n• Heavy periods (soaking 1+ pad per hour, passing clots)\n• Periods lasting more than 7 days\n• Severe pain that stops you functioning\n• No period for 3+ months (not pregnant)\n• Bleeding between periods or after sex\n\n**Period pain relief:**\n• Ibuprofen (400–600mg) at FIRST sign of pain — better than paracetamol for period pain\n• Start the day before if pain is predictably severe\n• Heat pack on lower abdomen\n• Exercise reduces pain long-term\n• Combined pill can be prescribed for severe cases`,
  sti: `**STIs — Symptoms and What to Do:**\n\n🔴 **Gonorrhoea:** Yellow/green discharge, painful urination, pelvic pain. Often silent in women.\n🟡 **Syphilis:** Painless sore on genitals/mouth. Later: rash on palms/soles. Dangerous in pregnancy.\n🟠 **Chlamydia:** Often silent. Major cause of infertility if untreated.\n🔵 **Trichomoniasis:** Frothy, foul-smelling discharge (women). Often silent in men.\n🟣 **Herpes (HSV-2):** Painful blisters on genitals. Recurs. Antivirals reduce outbreaks.\n\n**Important:**\n• Don't self-treat — different infections need different antibiotics\n• Treat partners at the same time — reinfection is common\n• All STIs increase HIV transmission risk\n• Test for HIV whenever you have an STI`,
}

// ── First aid situation detection ─────────────────────────────
function detectFirstAidSituation(lower) {
  const map = {
    burn: ['burn','scalded','fire','hot water','boiling'],
    bleeding: ['bleed','blood','cut','wound','laceration'],
    choking: ['choke','choking',"can't breathe",'swallowed','blocked throat'],
    snake_bite: ['snake','bitten by snake','venom'],
    fainting: ['fainted','collapsed','unconscious','passed out'],
    seizure: ['seizure','fit','convulsion','epilepsy'],
    fracture: ['fracture','broken bone','broken arm','broken leg'],
    drowning: ['drowned','drowning','near drowning'],
    head_injury: ['head injury','hit head','concussion'],
    eye_injury: ['eye injury','something in eye','chemical eye'],
    allergic_reaction: ['allergic reaction','anaphylaxis','bee sting'],
    poisoning: ['poisoning','swallowed poison','ingested'],
    heart_attack: ['heart attack','chest pain arm','arm pain chest','jaw pain chest',
      'chest pain collapse','crushing chest','squeezing chest','chest pain not going away',
      'chest pain sweating','heart attack symptoms'],
    stroke: ['stroke','face drooping','arm weak sudden','speech slurred'],
  }
  for (const [situation, keywords] of Object.entries(map)) {
    if (keywords.some(kw => lower.includes(kw))) return situation
  }
  return null
}

function buildFirstAidResponse(situation, empathy) {
  const data = getFirstAid(situation) || firstAidData.situations?.find(s => s.id === situation)
  if (!data) {
    return {
      type: 'companion',
      message: `${empathy}For detailed first aid guidance, please open the **First Aid** section of the app. I have step-by-step guides for all emergency situations.`,
      suggestions: ['Open First Aid Guide','Burn first aid','Choking first aid','Snake bite first aid'],
    }
  }
  let msg = `${empathy}${data.severity === 'emergency' ? '🚨 **EMERGENCY — Call for help while doing this:**\n\n' : '⚠️ **First Aid — Step by Step:**\n\n'}`
  data.steps.slice(0,6).forEach((step,i) => { msg += `**${i+1}.** ${step}\n\n` })
  if (data.do_not?.length) msg += `\n❌ **DO NOT:**\n${data.do_not.slice(0,3).map(d => `• ${d}`).join('\n')}\n\n`
  msg += `\n🏥 **When to go to hospital:** ${data.when_to_seek_help}`
  return { type: 'companion', message: msg, suggestions: ['More first aid','Emergency numbers Uganda','While waiting for help'] }
}

function buildConditionResponse(found, empathy) {
  const { key, cond } = found
  let msg = `${empathy}**${cond.name}**\n\n`
  if (cond.description) msg += `${cond.description}\n\n`
  if (cond.body_mechanism) msg += `🔬 **How it works:** ${cond.body_mechanism}\n\n`
  if (cond.required_symptoms?.length) msg += `**Main symptoms:**\n${cond.required_symptoms.slice(0,5).map(s => `• ${s.replace(/_/g,' ')}`).join('\n')}\n\n`
  if (cond.action_plan?.immediate?.length) msg += `**What to do:**\n${cond.action_plan.immediate.slice(0,3).map(a => `• ${a}`).join('\n')}\n\n`

  // Pull real medications from KnowledgeMerger
  const meds = getMedsForCondition(key)
  if (meds.length > 0) {
    msg += `💊 **Medications used:**\n`
    meds.slice(0,3).forEach(med => {
      const brands = med.brand_names?.slice(0,2).join(' / ') || ''
      msg += `• **${med.name}**${brands ? ` (${brands})` : ''} — ${med.adult_dose || 'as directed'}\n`
    })
    msg += '\n'
  }

  // Pull real remedies from KnowledgeMerger
  const remedies = getRemediesForCondition(key)
  if (remedies.length > 0) {
    msg += `🌿 **Natural remedies:**\n`
    remedies.slice(0,2).forEach(r => {
      const howTo = Array.isArray(r.how_to_use) ? r.how_to_use[0] : r.how_to_use
      msg += `• **${r.name}** — ${howTo || ''}\n`
      if (r.safety) msg += `  ⚠️ ${r.safety}\n`
    })
    msg += '\n'
  }

  if (cond.see_doctor_if?.length) msg += `🏥 **See a doctor if:**\n${cond.see_doctor_if.slice(0,3).map(s => `• ${s}`).join('\n')}\n\n`
  if (cond.local_context) msg += `🇺🇬 **In Uganda:** ${cond.local_context}`
  return { type: 'companion', message: msg, suggestions: [`How to prevent ${cond.name}`,`${cond.name} treatment`,`Is ${cond.name} serious?`,'Similar conditions'] }
}

function buildDrugResponse(drug, text, empathy) {
  const lower = text.toLowerCase()
  let msg = `${empathy}**${drug.name}**`
  if (drug.brand_names?.length) msg += ` *(${drug.brand_names.slice(0,3).join(' / ')})*`
  msg += '\n\n'
  msg += `📋 **Used for:** ${(drug.uses||[]).join(', ')}\n\n`
  if (drug.how_it_works) msg += `🔬 **How it works:** ${drug.how_it_works}\n\n`
  msg += `💊 **Adult dose:** ${drug.adult_dose||'As directed by your doctor'}\n`
  if (drug.child_dose) msg += `👶 **Child dose:** ${drug.child_dose}\n`
  if (drug.max_dose) msg += `⚠️ **Maximum:** ${drug.max_dose}\n`
  msg += '\n'
  const warnings = drug.key_warnings || drug.warnings || []
  if (warnings.length) msg += `⚠️ **Important warnings:**\n${warnings.slice(0,4).map(w => `• ${w}`).join('\n')}\n\n`
  const sideEffects = drug.side_effects || []
  if (sideEffects.length) msg += `😮 **Common side effects:** ${sideEffects.slice(0,4).join(', ')}\n\n`
  const interactions = drug.interactions || []
  if (interactions.length) msg += `⚡ **Interactions:** ${interactions.slice(0,3).join(', ')}\n\n`
  const avail = drug.local_availability || drug.availability || 'Available in Uganda'
  msg += `🏥 **Availability:** ${avail}\n`
  const preg = drug.safe_in_pregnancy ?? drug.pregnancy_safety
  if (preg !== undefined) {
    if (typeof preg === 'boolean') {
      msg += `🤰 **In pregnancy:** ${preg ? '✅ Generally safe' : '❌ Avoid — ask health worker for alternatives'}\n`
    } else if (typeof preg === 'string') {
      msg += `🤰 **In pregnancy:** ${preg}\n`
    }
  }
  if (drug.safe_in_children !== undefined) msg += `👶 **For children:** ${drug.safe_in_children ? '✅ Can be used (dose by weight)' : '⚠️ Use with caution — confirm with health worker'}\n`
  return { type: 'companion', message: msg, suggestions: [`${drug.name} side effects`,`${drug.name} and food`,`Alternatives to ${drug.name}`,'Other medication questions'] }
}

function buildNutritionResponse(text, lower, empathy) {
  if (lower.includes('anaemia')||lower.includes('anemia')||lower.includes('iron')||lower.includes('low blood')) {
    const plan = nutritionData.plans?.find(p => p.id==='anaemia')
    if (plan) return { type:'companion', message:`${empathy}**Nutrition for Anaemia:**\n\n${plan.intro}\n\n**✅ Best iron-rich foods:**\n${plan.eat.slice(0,6).map(f=>`• ${f}`).join('\n')}\n\n**💡 Key tip:** ${plan.key_tip}\n\n**🇺🇬 Affordable in Uganda:**\n${plan.local_options}`, suggestions:['Iron supplements','Anaemia symptoms','Vitamin C and iron','Foods to avoid with anaemia'] }
  }
  if (lower.includes('diabetes')||lower.includes('blood sugar')||lower.includes('glucose')) {
    return { type:'companion', message:`${empathy}**Diabetes Nutrition:**\n\n✅ **Eat more:**\n• Beans and lentils — low glycaemic index\n• Vegetables — dark greens, cabbage\n• Whole grains — finger millet, whole maize\n• Fish — protein without blood sugar impact\n• Avocado — healthy fat slows glucose absorption\n• Bitter gourd/karela — has evidence for blood sugar reduction\n\n🚫 **Reduce:**\n• White rice, white bread, white posho\n• Sugar and sugary drinks (soda, juice, sweetened tea)\n• Fried foods and processed snacks\n• Alcohol\n\n⏰ **Eat 3 smaller meals + 2 snacks** at consistent times. Never skip meals.`, suggestions:['Diabetes medications Uganda','Blood sugar monitoring','Exercise and diabetes','Diabetes complications'] }
  }
  if (lower.includes('hypertension')||lower.includes('blood pressure')||lower.includes('high bp')) {
    return { type:'companion', message:`${empathy}**DASH Diet for High Blood Pressure:**\n\n🧂 **Reduce salt** — #1 dietary change. Most Ugandans eat 2–3× healthy amount. Avoid stock cubes, packet noodles, salted fish.\n\n✅ **Eat more:**\n• Potassium: bananas, sweet potato, beans, avocado, spinach\n• Calcium: milk, simsim, small fish with bones\n• Magnesium: dark green vegetables, groundnuts\n\n🚫 **Reduce:** Alcohol, caffeine (max 2 cups coffee/day), red meat, fried foods\n\n**Combined with 30 min exercise daily:** Can lower blood pressure 8–14 mmHg — as much as some medications.`, suggestions:['Hypertension medications','Exercise for blood pressure','Stroke prevention','Blood pressure monitoring'] }
  }
  if (lower.includes('pregnant')||lower.includes('pregnancy')||lower.includes('antenatal')) {
    return { type:'companion', message:`${empathy}${PREGNANCY.nutrition}`, suggestions:['Iron supplements pregnancy','Folic acid','Pregnancy danger signs','Breastfeeding nutrition'] }
  }
  if (lower.includes('baby')||lower.includes('infant')||lower.includes('6 month')||lower.includes('weaning')) {
    return { type:'companion', message:`${empathy}${CHILD_HEALTH.feeding}`, suggestions:['Exclusive breastfeeding','Best foods for toddlers','Child nutrition Uganda','Growth monitoring'] }
  }
  if (lower.includes('weight loss')||lower.includes('lose weight')||lower.includes('slim')||lower.includes('overweight')) {
    return { type:'companion', message:`${empathy}**Healthy Weight Management:**\n\n**The only thing that works:** Create a modest, sustainable calorie deficit.\n\n✅ **Eat less of:**\n• Reduce posho/ugali portions — replace half with beans or vegetables\n• Avoid sugary drinks entirely — soda, juice, beer have empty calories\n• Reduce frying — boil, roast, or steam instead\n• Smaller portions of white rice and bread\n\n✅ **Eat more of:**\n• Vegetables — fill half your plate\n• Beans — protein and fibre keep you full longer\n• Water before meals — reduces hunger\n\n🏃 **Move more:** 30–45 min brisk walking daily.\n\n**Safe rate:** 0.5–1 kg per week. Faster loss means muscle loss.\n\n❌ **What doesn't work:** Meal skipping, extreme dieting, weight-loss supplements.`, suggestions:['Healthy foods Uganda','Exercise for weight loss','Managing diabetes with diet','Body mass index'] }
  }
  if (lower.includes('gain weight')||lower.includes('too thin')||lower.includes('underweight')||lower.includes('malnutrition')) {
    return { type:'companion', message:`${empathy}**Healthy Weight Gain:**\n\n⚠️ **First rule out:** TB, HIV, diabetes, cancer, worms, thyroid problems causing weight loss.\n\n**High-nutrition foods:**\n• 🥑 Avocado — calorie and nutrient dense\n• 🥜 Groundnuts — protein, healthy fat, calories\n• 🍌 Ripe bananas — energy-dense\n• 🥚 Eggs — complete protein, affordable\n• 🫘 Beans — protein and carbohydrate\n• 🌿 Moringa — adds iron, calcium, protein to any food\n• 🐟 Mukene — cheap, very nutritious\n\n**Strategy:** Eat 5–6 smaller meals. Add oil, groundnut paste, or avocado to increase calories. Deworm every 6 months.\n\n🏥 **For thin children:** Take to a health facility — free therapeutic food is available.`, suggestions:['Malnutrition treatment Uganda','Protein foods Uganda','Child malnutrition','Moringa uses'] }
  }
  return { type:'companion', message:`${empathy}**Nutrition for Health:**\n\nI can give you personalised guidance for:\n\n🩸 **Anaemia** — iron-rich foods\n💉 **Diabetes** — blood sugar control\n❤️ **Hypertension** — DASH diet\n🤰 **Pregnancy** — complete guide\n👶 **Infant feeding** — birth to 2 years\n⚖️ **Weight loss** — sustainable approach\n💪 **Weight gain** — building healthy weight\n🌿 **General wellness** — Uganda healthy plate\n\nWhich would you like guidance on?`, suggestions:['Nutrition for anaemia','Diabetes diet Uganda','Pregnancy nutrition','Foods for high blood pressure'] }
}

// ── Main Companion Session ────────────────────────────────────
export class CompanionSession {
  constructor(userProfile = {}) {
    this.user = userProfile
    this.history = []
    this.emotionHistory = []
    this.sessionTopics = new Set()
    this.messageCount = 0
  }

  respond(userText) {
    this.messageCount++
    this.history.push({ role:'user', text:userText, time:Date.now() })

    if (detectSelfHarmRisk(userText)) {
      const response = getSelfHarmResponse()
      this.history.push({ role:'ai', text:response.message, time:Date.now() })
      return response
    }

    const redFlag = detectRedFlag(userText, this.user?.lang || 'en')
    if (redFlag) {
      const response = { type: 'emergency', message: redFlag.message, urgency: redFlag.urgency }
      this.history.push({ role:'ai', text:response.message, time:Date.now() })
      return response
    }

    const emotion = detectEmotion(userText)
    this.emotionHistory.push(emotion)
    const empathy = getEmpathyPrefix(emotion)
    const topic = detectTopic(userText)
    this.sessionTopics.add(topic)

    const response = this._generateResponse(userText, topic, emotion, empathy)
    this.history.push({ role:'ai', text:response.message, time:Date.now() })
    return response
  }

  _generateResponse(text, topic, emotion, empathy) {
    const lower = text.toLowerCase()
    const name = this.user?.name || ''

    // Greeting
    if (topic === 'greeting') {
      const greetFn = GREETINGS[this.messageCount % GREETINGS.length] || GREETINGS[0]
      return { type:'companion', message:greetFn(name), suggestions:['What is malaria?','What should I eat for anaemia?','How do I treat a burn?','Tell me about paracetamol'] }
    }

    // Farewell
    if (topic === 'farewell') {
      return { type:'companion', message:FAREWELLS[Math.floor(Math.random()*FAREWELLS.length)] }
    }

    // Medication
    if (topic === 'medication') {
      const drug = findDrugInText(text)
      if (drug) return buildDrugResponse(drug, text, empathy)
      if (lower.includes('antibiotic')&&(lower.includes('resist')||lower.includes('stop working'))) {
        return { type:'companion', message:`${empathy}**Antibiotic Resistance — A Serious Global Crisis:**\n\nAntibiotic resistance occurs when bacteria evolve to survive antibiotics.\n\n**Why it happens:**\n• Taking antibiotics for viral infections (colds, flu) — they don't work against viruses\n• Not completing the full prescribed course\n• Using leftover antibiotics\n• Sharing antibiotics\n\n**Consequences:** Common infections becoming untreatable. Drug-resistant TB already a major problem in Uganda.\n\n**Your role:**\n✅ Only take antibiotics for confirmed bacterial infections\n✅ Always complete the full course — even when feeling better\n✅ Never share or use leftover antibiotics\n✅ Only use antibiotics prescribed for YOUR current illness`, suggestions:['Which infections need antibiotics?','Viral vs bacterial infection','When to see a doctor','Common antibiotics Uganda'] }
      }
      return { type:'companion', message:`${empathy}I have detailed information on all common medications in Uganda — dosages, warnings, pregnancy safety, and interactions. Which medicine would you like to know about?\n\nI have info on: paracetamol, ibuprofen, aspirin, amoxicillin, cotrimoxazole, metronidazole, Coartem, ORS, zinc, omeprazole, metformin, salbutamol, and many more.`, suggestions:['Paracetamol dosage','Coartem for malaria','Is ibuprofen safe in pregnancy?','Tell me about ORS'] }
    }

    // First aid
    if (topic === 'first_aid') {
      const situation = detectFirstAidSituation(lower)
      if (situation) return buildFirstAidResponse(situation, empathy)
      return { type:'companion', message:`${empathy}I have step-by-step first aid guidance for all emergencies:\n\n🩹 Burns and scalds\n🩸 Serious bleeding\n😮 Choking (adult and child)\n🐍 Snake and animal bites\n💫 Fainting and loss of consciousness\n⚡ Seizures/convulsions\n🦴 Fractures and sprains\n🌊 Drowning/near-drowning\n🧠 Head injuries\n👁️ Eye injuries\n🤧 Severe allergic reaction\n☠️ Poisoning\n❤️ Heart attack and stroke\n\nWhat situation do you need help with?`, suggestions:['Burn first aid','Choking first aid','Snake bite first aid','How to stop bleeding'] }
    }

    // Nutrition
    if (topic === 'nutrition') return buildNutritionResponse(text, lower, empathy)

    // Sexual health
    if (topic === 'sexual_health') {
      if (lower.includes('contraception')||lower.includes('family planning')||lower.includes('birth control')||lower.includes('pill')||lower.includes('injection')||lower.includes('implant')||lower.includes('condom')) {
        return { type:'companion', message:`${empathy}${SEXUAL.contraception}`, suggestions:['Depo-Provera side effects','Implant vs IUD','Condoms and STI prevention','Natural family planning'] }
      }
      if (lower.includes('period')||lower.includes('menstrual')||lower.includes('menstruation')||lower.includes('cycle')) {
        return { type:'companion', message:`${empathy}${SEXUAL.menstrual}`, suggestions:['Period pain relief','Heavy periods causes','PCOS symptoms','Endometriosis Uganda'] }
      }
      if (lower.includes('sti')||lower.includes('std')||lower.includes('gonorrhoea')||lower.includes('syphilis')||lower.includes('discharge')||lower.includes('itching')||lower.includes('sore')) {
        return { type:'companion', message:`${empathy}${SEXUAL.sti}`, suggestions:['STI testing Uganda','Treating gonorrhoea','Protecting your partner','HIV and STIs'] }
      }
      return { type:'companion', message:`${empathy}Sexual and reproductive health is an important part of overall health — I can help without embarrassment:\n\n• 💊 **Family planning** — all methods free in Uganda\n• 🩸 **Menstrual health** — period pain, heavy periods, irregularity\n• 🔬 **STIs** — symptoms, treatment, prevention\n• 🤰 **Pregnancy** — planning and antenatal care\n• 🛡️ **HIV/STI prevention** — condoms, PrEP, testing\n\nWhat would you like to know?`, suggestions:['Family planning Uganda','STI symptoms','Period pain treatment','Fertility and conception'] }
    }

    // Chronic disease
    if (topic === 'chronic_disease') {
      if (lower.includes('diabetes')||lower.includes('blood sugar')||lower.includes('glucose')||lower.includes('insulin')||lower.includes('metformin')) {
        return { type:'companion', message:`${empathy}${CHRONIC.diabetes}`, suggestions:['Diabetes diet','Metformin information','Blood sugar monitoring','Diabetes complications'] }
      }
      if (lower.includes('hypertension')||lower.includes('blood pressure')||lower.includes('high bp')) {
        return { type:'companion', message:`${empathy}${CHRONIC.hypertension}`, suggestions:['Blood pressure medications','Diet for hypertension','Stroke signs','Exercise and blood pressure'] }
      }
      if (lower.includes('asthma')||lower.includes('inhaler')||lower.includes('wheez')||lower.includes('salbutamol')) {
        return { type:'companion', message:`${empathy}${CHRONIC.asthma}`, suggestions:['Salbutamol inhaler use','Asthma triggers Uganda','Asthma attack management','Preventer inhaler'] }
      }
      // Fallback for other chronic conditions
      const condMatch = findConditionInText(text)
      if (condMatch) return buildConditionResponse(condMatch, empathy)
      return { type:'companion', message:`${empathy}**Living with a Chronic Condition:**\n\nChronic diseases require long-term management but can be well-controlled with the right approach.\n\nI have detailed information on:\n\n🩸 **Diabetes** — blood sugar control, diet, medication\n❤️ **Hypertension** — blood pressure management, lifestyle\n💨 **Asthma** — triggers, inhalers, attack management\n🫀 **Heart disease** — prevention, medication, lifestyle\n🫁 **TB** — treatment, completing your course\n🧬 **HIV** — ART, living well, prevention\n🦴 **Arthritis** — pain management, mobility\n🩺 **Kidney disease** — protecting kidney function\n\nTell me which condition you'd like to understand better, and I'll give you detailed, practical guidance.`, suggestions:['Diabetes management Uganda','Blood pressure control','Asthma inhalers','HIV and ART Uganda'] }
    }

    // Pregnancy
    if (topic === 'pregnancy') {
      if (lower.includes('danger')||lower.includes('warning')||lower.includes('emergency')||lower.includes('bleeding')||lower.includes('eclampsia')) {
        return { type:'companion', message:`${empathy}${PREGNANCY.danger_signs}`, suggestions:['Normal pregnancy symptoms','Antenatal care Uganda','Pre-eclampsia treatment','Labour signs'] }
      }
      if (lower.includes('breastfeed')||lower.includes('breast milk')||lower.includes('lactation')) {
        return { type:'companion', message:`${empathy}${PREGNANCY.breastfeeding}`, suggestions:['When to start solid foods','Breastfeeding problems','HIV and breastfeeding','Breast milk supply'] }
      }
      if (lower.includes('antenatal')||lower.includes('clinic')||lower.includes('visit')) {
        return { type:'companion', message:`${empathy}${PREGNANCY.antenatal}`, suggestions:['Pregnancy nutrition','Danger signs pregnancy','Safe delivery Uganda','Postnatal care'] }
      }
      return { type:'companion', message:`${empathy}**Pregnancy Health Guide:**\n\n${PREGNANCY.antenatal}\n\nAsk me about nutrition, danger signs, breastfeeding, or any specific pregnancy concern.`, suggestions:['Pregnancy nutrition','Pregnancy danger signs','Antenatal visits Uganda','Breastfeeding guide'] }
    }

    // Child health
    if (topic === 'child_health') {
      if (lower.includes('vaccin')||lower.includes('immunis')||lower.includes('jab')||lower.includes('epi')) {
        return { type:'companion', message:`${empathy}${CHILD_HEALTH.immunisation}`, suggestions:['Measles vaccine side effects','Missed vaccination','Vitamin A child','Child health clinic'] }
      }
      if (lower.includes('danger')||lower.includes('emergency')||lower.includes('very sick')||lower.includes('hospital child')) {
        return { type:'companion', message:`${empathy}${CHILD_HEALTH.danger_signs}`, suggestions:['Child fever management','Malaria in children','Child diarrhoea treatment','Child nutrition'] }
      }
      if (lower.includes('fever')||lower.includes('hot child')||lower.includes('temperature')) {
        return { type:'companion', message:`${empathy}**Fever in Children:**\n\n🌡️ **Management:**\n• Paracetamol (15mg/kg every 6 hours) — syrup for young children\n• Tepid sponging with lukewarm water (not cold or alcohol)\n• Keep hydrated — breastfeed frequently\n• Do NOT bundle in blankets — helps cooling\n• TEST for malaria if fever lasts more than 24 hours\n\n🚨 **Go to hospital if:**\n• Baby under 3 months with any fever\n• Fever with seizures/fits\n• Fever with stiff neck or rash\n• Cannot drink or breastfeed\n• Fever not responding to paracetamol\n• Concerned`, suggestions:['Malaria test for children','Paracetamol child dose','When to go to hospital child','Child diarrhoea'] }
      }
      return { type:'companion', message:`${empathy}**Child Health — I'm here to help:**\n\n💉 Vaccines — full Uganda EPI schedule\n🍼 Feeding — breastfeeding through complementary foods\n📏 Growth — milestones and warning signs\n🌡️ Common illnesses — fever, malaria, diarrhoea, cough\n⚠️ Danger signs — when to go to hospital immediately\n\nHow old is the child, and what are you concerned about?`, suggestions:['Uganda vaccine schedule','Child feeding 6 months','Child fever treatment','When to go to hospital child'] }
    }

    // Mental health
    if (topic === 'mental_health') {
      if (lower.includes('depress')||lower.includes('hopeless')||lower.includes('no motivation')||lower.includes('no interest')||lower.includes('worthless')) {
        return { type:'companion', message:`${empathy}${MENTAL.depression}`, suggestions:['Mental health help Uganda','Exercise and mood','Talking to someone','Depression vs sadness'] }
      }
      if (lower.includes('anxious')||lower.includes('anxiety')||lower.includes('panic')||lower.includes('worry')||lower.includes('nervous')) {
        return { type:'companion', message:`${empathy}${MENTAL.anxiety}`, suggestions:['Breathing techniques','Panic attack management','CBT therapy','Anxiety and lifestyle'] }
      }
      if (lower.includes('sleep')||lower.includes('insomnia')||lower.includes("can't sleep")||lower.includes('waking up')) {
        return { type:'companion', message:`${empathy}${MENTAL.sleep}`, suggestions:['Melatonin for sleep','Sleep and health','Stress and sleep','Best sleep environment'] }
      }
      return { type:'companion', message:`${empathy}Mental health is real health — and it deserves care. In Uganda, mental health challenges are common but often stigmatised.\n\nI can help you understand:\n💙 **Depression** — what it is, why it happens, what helps\n😰 **Anxiety** — types, symptoms, evidence-based management\n😴 **Sleep problems** — why sleep matters, how to fix it\n😮‍💨 **Stress** — chronic effects and relief strategies\n😢 **Grief** — the process of loss\n\n**Getting help in Uganda:**\n• Butabika National Hospital\n• Mental health units at regional hospitals\n• Counsellors at district hospitals\n\nWhat would you like to talk about?`, suggestions:['Depression symptoms','Anxiety management','How to sleep better','Mental health help Uganda'] }
    }

    // HIV/TB
    if (topic === 'hiv_tb') {
      if (lower.includes('tb')||lower.includes('tuberculosis')||lower.includes('cough blood')||lower.includes('night sweat')) {
        return { type:'companion', message:`${empathy}**Tuberculosis (TB) — Complete Guide:**\n\n🦠 **Spread:** Through the air when infected people cough — needs prolonged close contact.\n\n**Symptoms:**\n• Cough for 2–3+ weeks — most important sign\n• Coughing blood\n• Drenching night sweats (soaking clothes/sheets)\n• Unexplained weight loss\n• Persistent low fever, fatigue\n• Chest pain\n\n🔬 **Diagnosis:** GeneXpert sputum test + chest X-ray — FREE at district hospitals. Results within hours.\n\n💊 **Treatment:**\n• 6-month antibiotic course — COMPLETELY FREE at government facilities\n• CURABLE with complete treatment\n• NEVER stop early — even when feeling 100% better\n• Stopping creates drug-resistant TB (much harder to treat)\n\n🤝 HIV and TB often occur together. All TB patients should test for HIV.`, suggestions:['TB symptoms','TB treatment Uganda','Drug-resistant TB','HIV and TB together'] }
      }
      return { type:'companion', message:`${empathy}**HIV — Complete Guide:**\n\n🔬 **Transmission:**\n• Unprotected sex\n• Blood-to-blood (shared needles, razors, unscreened transfusions)\n• Mother-to-child (preventable with ART)\n\n✅ **NOT transmitted by:** Hugging, sharing food, mosquitoes, toilet seats, coughing.\n\n🧪 **Testing:** Free, confidential at ALL Uganda health facilities. Same-day results.\n\n💊 **ART (free at all government facilities):**\n• Take every day at the same time — never skip\n• Reduces viral load to undetectable\n• U=U: Undetectable = Untransmittable\n• People on effective ART live normal, healthy, long lives\n\n⚡ **PEP:** Exposed in last 72 hours? Go to hospital NOW.\n💊 **PrEP:** HIV-negative and at ongoing risk? Ask your facility.`, suggestions:['HIV symptoms','ART treatment Uganda','HIV testing','PEP Uganda'] }
    }

    // Malaria
    if (topic === 'malaria') {
      return { type:'companion', message:`${empathy}**Malaria in Uganda — Complete Guide:**\n\n🦟 **Transmission:** Female Anopheles mosquitoes, mainly biting dusk to dawn.\n\n**Symptoms (7–14 days after bite):**\n• Fever (often cyclical)\n• Chills and shaking\n• Headache, muscle pain\n• Nausea and vomiting\n• Fatigue\n\n🧪 **NEVER treat without testing first.** RDT (Rapid Diagnostic Test) is cheap and widely available.\n\n💊 **Treatment:**\n• Coartem (artemether-lumefantrine) — first line, FREE at government facilities\n• Take with food (fatty food increases absorption)\n• Complete the full 3-day course even if feeling better\n\n🚨 **Emergency signs — hospital immediately:**\n• High fever with confusion\n• Convulsions\n• Dark/cola-coloured urine\n• Cannot stand or sit\n• Vomiting all medication\n\n${PREVENTION.malaria.text}`, suggestions:['Coartem dosage','Malaria in pregnancy','Malaria prevention','Malaria test Uganda'] }
    }

    // Prevention
    if (topic === 'prevention') {
      for (const [disease, info] of Object.entries(PREVENTION)) {
        if (lower.includes(disease.replace('_',' '))||lower.includes(disease)) {
          return { type:'companion', message:`${empathy}${info.text}`, suggestions:info.suggestions }
        }
      }
      const tip = WELLNESS_TIPS[Math.floor(Math.random()*WELLNESS_TIPS.length)]
      return { type:'companion', message:`${empathy}**Prevention is the best medicine.**\n\n💡 ${tip}\n\nI have specific prevention guides for:\n• 🦟 Malaria\n• 🦠 HIV\n• 💧 Typhoid and cholera\n• 🫁 TB\n• 💉 Diabetes\n• ❤️ Hypertension\n• 🎗️ Cancer\n\nWhat would you like to focus on?`, suggestions:['Malaria prevention','HIV prevention','Diabetes prevention','Cancer prevention Uganda'] }
    }

    // Water/hygiene
    if (topic === 'water_hygiene') {
      return { type:'companion', message:`${empathy}**Safe Water and Hygiene:**\n\n💧 **Making water safe:**\n• **Boiling** — most effective, 1 minute rolling boil\n• **Chlorination** — 2 drops household bleach per litre, wait 30 min\n• **Water Guard** — follow packet instructions\n• **SODIS** — clear plastic bottles in full sun for 6 hours\n\n🙌 **The 5 critical handwashing moments:**\n1. Before eating\n2. Before preparing food\n3. After toilet use\n4. After changing nappies\n5. After handling sick persons\n\n**Technique:** Soap + 20 seconds rubbing all surfaces + clean water rinse.\n\n🚽 **Sanitation:** Latrine use prevents typhoid, cholera, hepatitis A, and worm infections.`, suggestions:['Cholera prevention','Typhoid prevention','Making safe water','Child diarrhoea prevention'] }
    }

    // Condition info
    if (topic === 'condition_info') {
      const found = findConditionInText(text)
      if (found) return buildConditionResponse(found, empathy)
    }

    // General wellness
    if (topic === 'general_wellness') {
      const tip = WELLNESS_TIPS[Math.floor(Math.random()*WELLNESS_TIPS.length)]
      return { type:'companion', message:`${empathy}**Health & Wellness:**\n\n💡 ${tip}\n\nI can give you in-depth guidance on wellness, lifestyle, diet, exercise, sleep, stress management, or disease prevention. What would you like to explore?`, suggestions:['Healthy lifestyle tips','Exercise benefits','Better sleep','Stress management'] }
    }

    // Direct condition match
    const conditionMatch = findConditionInText(text)
    if (conditionMatch) return buildConditionResponse(conditionMatch, empathy)

    // Remedy match
    const remedyMatch = findRemedyInText(text)
    if (remedyMatch) {
      const r = remedyMatch
      let msg = `${empathy}**${r.name}** (${r.local_names.slice(0,2).join(' / ')})\n\n`
      if (r.description) msg += `${r.description}\n\n`
      if (r.helps_with?.length) msg += `**✅ Helps with:** ${r.helps_with.join(', ')}\n\n`
      if (r.how_to_use) msg += `**💊 How to use:** ${r.how_to_use}\n\n`
      if (r.cautions?.length) msg += `**⚠️ Cautions:** ${r.cautions.slice(0,2).join(', ')}\n\n`
      msg += `**Evidence:** ${r.evidence_label||r.evidence_rating}`
      return { type:'companion', message:msg, suggestions:[`${r.name} dosage`,`${r.name} safety`,'Other natural remedies','Evidence for natural medicine'] }
    }

    // ── Symptom-specific handlers ─────────────────────────────
    // These give real clinical guidance before falling back to
    // "use the symptom checker" — so users always get a useful answer
    if (topic === 'symptoms') {
      // ── CHEST PAIN — triage first (most clinically critical) ─────
      if (/chest pain|chest tight|chest pressure|chest discomfort|heart pain|pain in chest|kifuba kinuma|ekifuba kinuma/i.test(lower)) {
        const leftArm   = /left arm|arm pain|arm numb|jaw pain|jaw hurt/i.test(lower)
        const crushing  = /crush|squeezing|squeeze|heavy on chest|something sitting|heavy chest/i.test(lower)
        const afterEating = /after eating|after food|after meal|lying down|heartburn|burning/i.test(lower)
        const breathing = /when breath|breathing|breathe in|sharp.*breath|breath.*sharp|inhaling/i.test(lower)
        const onExertion = /walking|climbing|stairs|exercise|exertion|when i walk|when walking/i.test(lower)

        if (leftArm || crushing) {
          return { type:'companion', message:`${empathy}⚠️ **This sounds like it could be a HEART ATTACK — a medical emergency.**

🚨 **If the chest pain is severe and spreading to your arm or jaw, please:**
1. **Stop all activity immediately** — sit or lie down right now
2. **Call for someone to take you to hospital NOW** — do NOT drive yourself
3. **Chew one aspirin (300mg)** if available — chew it, do not swallow whole
4. Use GTN spray if you have been prescribed it

**Heart attacks are survivable when treated quickly. Every minute matters.**

🏥 In Uganda: Mulago emergency unit or your nearest regional hospital.

If you are experiencing this right now — please get help immediately.`, suggestions:['Heart attack warning signs','Aspirin in heart attack','Angina vs heart attack','CPR basics'] }
        }

        if (afterEating) {
          return { type:'companion', message:`${empathy}**Chest burning or pain after eating** is most commonly caused by **acid reflux (GERD)** — stomach acid flowing back up the food pipe.

**Signs it is acid reflux:**
• Burning in chest or throat after meals
• Sour or acidic taste in the mouth
• Worse when lying down or bending
• Relieved by cold water, milk, or antacids

**Immediate relief:**
• Sit upright — do not lie down
• Drink cold water or milk slowly
• Antacid from any pharmacy (sodium bicarbonate in water also works)

**Best treatment:** Omeprazole 20mg taken before breakfast — available at all pharmacies in Uganda without prescription.

🚨 See a doctor if: you have difficulty swallowing, are losing weight, or symptoms are severe or frequent.`, suggestions:['Omeprazole dosage Uganda','Foods to avoid acid reflux','GERD vs heart pain','Antacids available Uganda'] }
        }

        if (breathing) {
          return { type:'companion', message:`${empathy}**Sharp chest pain that gets dramatically worse when you breathe deeply** is called pleuritic pain — it typically means the lining around the lung (pleura) is inflamed.

**Most likely causes:**
🫁 **Pleuritis (pleurisy)** — inflamed lung lining, often after a respiratory infection
🫁 **Pneumonia** — fever, cough, and chest pain together
🦠 **Tuberculosis** — in Uganda, cough lasting 2+ weeks with chest pain = TB until proven otherwise
💪 **Pulled chest muscle** — from heavy lifting, coughing, or twisting

**Most important:** This needs a health worker to examine you. In Uganda, always ask about TB.

🔬 **TB GeneXpert test** is free at all district hospitals — results within a few hours.`, suggestions:['TB symptoms','Pneumonia treatment','Pleurisy causes','TB test Uganda free'] }
        }

        if (onExertion) {
          return { type:'companion', message:`${empathy}**Chest tightness or pain that comes on during physical activity** — walking, climbing stairs, carrying heavy things — and goes away when you rest is the classic pattern of **angina pectoris**.

Angina means the heart muscle is not getting enough blood flow when it works hard. It is a warning sign of coronary artery disease.

**What angina feels like:**
• Pressure, heaviness, or tightness — "something sitting on my chest"
• Comes on predictably with exertion
• Goes away within 3–5 minutes of rest
• May spread to the left arm or jaw

**This needs medical assessment — do not ignore it.** An ECG will help confirm it.

🚨 **Emergency signs:** Pain at rest, lasting over 10 minutes, with sweating — go to hospital immediately.

🇺🇬 Cardiac services available at Mulago, Mbarara, Gulu, and all regional referral hospitals.`, suggestions:['Angina treatment Uganda','GTN spray use','Heart disease prevention','Angina vs heart attack'] }
        }

        // General chest pain — triage guide
        return { type:'companion', message:`${empathy}Chest pain has several important causes — let me help you narrow it down.

**Is this an emergency? Yes, if:**
🚨 Pain is crushing, squeezing, or heavy — go to hospital NOW
🚨 Pain spreads to your left arm, jaw, or neck — emergency
🚨 Pain with sweating and feeling faint — emergency

**Common causes I can help you understand:**
❤️ **Angina** — tightness triggered by walking/exercise, goes away with rest
💔 **Heart attack** — crushing pain at rest, with arm/jaw pain, sweating
🔥 **Acid reflux (GERD)** — burning after meals, worse lying down, sour taste
🫁 **Pleuritis** — sharp pain that worsens with deep breathing
🦴 **Costochondritis** — chest wall pain reproduced by pressing with a finger
😰 **Anxiety** — tightness with racing heart and breathlessness under stress

**Tell me more about when it happens — after eating? During activity? When breathing deeply?** This helps me guide you better.`, suggestions:['Chest pain after eating','Chest pain on exertion','Sharp chest pain breathing','Crushing chest pain emergency'] }
      }
      // ── COUGH ──────────────────────────────────────────────
      if (lower.includes('cough') || lower.includes('coughing') || lower.includes('enkuba') || lower.includes('okunuba')) {
        if (lower.includes('blood') || lower.includes('haemoptysis')) {
          return { type:'companion', message:`${empathy}⚠️ **Coughing blood is a serious warning sign** that always needs medical attention.\n\n**Most likely causes:**\n• **Tuberculosis (TB)** — most important in Uganda. Free GeneXpert test at district hospitals.\n• Severe bronchitis or pneumonia\n• Lung injury or abscess (rare)\n\n**What to do right now:**\n1. Go to your nearest health facility today — don't wait\n2. Tell them you are coughing blood — you'll get priority\n3. GeneXpert sputum test is free and gives results within hours\n\n🏥 **TB treatment in Uganda is completely free** and highly effective when started early.`, suggestions:['TB symptoms','TB diagnosis Uganda','TB treatment free','Pneumonia symptoms'] }
        }
        if (lower.includes('night sweat') || lower.includes('weight loss') || lower.includes('losing weight')) {
          return { type:'companion', message:`${empathy}🔴 **Cough + night sweats or weight loss — please get tested for TB.**\n\nThis combination is the classic presentation of Tuberculosis in Uganda. The good news:\n\n✅ **GeneXpert sputum test is FREE** at all district hospitals — results in hours\n✅ **TB treatment is FREE** — 6-month course that is highly effective\n✅ Most people feel significantly better within 2–4 weeks of starting treatment\n\n**While waiting for your test:**\n• Cover your mouth when coughing\n• Ventilate your room — open windows\n• Avoid prolonged close contact with young children\n\nHave you had a cough for more than 2–3 weeks?`, suggestions:['TB diagnosis Uganda','TB treatment course','TB and HIV','Night sweats causes'] }
        }
        if (lower.includes('breath') || lower.includes('wheez') || lower.includes('chest tight') || lower.includes('shortness')) {
          return { type:'companion', message:`${empathy}**Cough with breathing difficulty** needs to be taken seriously.\n\n**Most likely causes:**\n\n💨 **Asthma** — especially if you hear a whistling wheeze, worsens at night, or triggered by smoke/dust/cold air\n🫁 **Pneumonia** — especially with fever, fast breathing, or feeling very unwell\n🌫️ **COPD** — if you smoke or are exposed to smoke/biomass fumes regularly\n\n**Seek care today if:**\n🚨 Breathing very fast (more than 30 breaths/min)\n🚨 Lips or fingernails look bluish\n🚨 Cannot complete a sentence without stopping to breathe\n\n**For mild wheeze right now:** If you have a salbutamol (blue) inhaler — use it. Sit upright, breathe slowly.\n\nHow long have you had this cough, and do you hear any wheezing?`, suggestions:['Asthma symptoms and treatment','Pneumonia signs','Salbutamol inhaler use','When to go to hospital'] }
        }
        return { type:'companion', message:`${empathy}**Understanding your cough:**\n\nMost coughs are not serious, but the duration and pattern matter a lot.\n\n⏱️ **How long?**\n• **Under 3 weeks** — almost always viral. No antibiotics needed.\n• **3–8 weeks** — post-viral or sinusitis. Monitor closely.\n• **Over 8 weeks (chronic)** — needs investigation. **TB must be ruled out in Uganda.**\n\n💊 **What actually helps:**\n• Honey in warm water — as effective as cough syrup (evidence-backed)\n• Steam inhalation — loosens mucus and soothes airways\n• Stay well hydrated — thins secretions\n• Avoid smoke and dust\n\n🚫 **Antibiotics don't help** viral coughs — which is nearly all of them.\n\n🚨 **See a doctor urgently if:**\n• Coughing blood\n• Cough + weight loss + night sweats (test for TB)\n• High fever with fast breathing\n• Child under 2 with cough and fast breathing\n\nHow long have you had the cough, and is it dry or bringing up phlegm?`, suggestions:['TB screening Uganda','Asthma treatment','Cough in children','Honey for cough evidence'] }
      }

      // ── FEVER ───────────────────────────────────────────────
      if (lower.includes('fever') || lower.includes('temperature') || lower.includes('hot body') || lower.includes('febulo') || lower.includes('omusujja')) {
        if (lower.includes('child') || lower.includes('baby') || lower.includes('infant') || /\d+\s*(month|year)s? old/.test(lower)) {
          return { type:'companion', message:`${empathy}**Fever in a child — key steps:**\n\n🌡️ **Manage the fever:**\n• Paracetamol syrup: 15mg per kg every 6 hours (e.g. 10kg child = 150mg)\n• Tepid sponging with lukewarm water\n• Keep well hydrated\n• Do NOT bundle in blankets\n\n🦟 **Test for malaria if fever lasts more than 24 hours** — RDT is available everywhere in Uganda\n\n🚨 **Go to hospital immediately if:**\n• Child under 3 months with any fever\n• Fever with convulsions\n• Stiff neck or rash with fever\n• Cannot drink, very drowsy, or not responding normally\n• Breathing very fast\n\nHow old is the child, and how high is the fever?`, suggestions:['Malaria test for children','Paracetamol child dose','Child danger signs','When to go to hospital child'] }
        }
        if (lower.includes('malaria') || lower.includes('chills') || lower.includes('shaking')) {
          return { type:'companion', message:`${empathy}**Possible malaria — here's what to do:**\n\n🧪 **Test first — never treat without testing**\nRDT is available at most pharmacies and all health centres.\n\n💊 **If RDT is positive:**\n• **Coartem** — first-line, FREE at government facilities\n• Take with food — fatty food doubles absorption\n• Complete the full 3-day course even if you feel better\n• Paracetamol for fever — NOT aspirin\n\n🚨 **Emergency — hospital immediately:**\n• Confusion or inability to wake up\n• Convulsions\n• Dark/cola-coloured urine\n• Cannot keep fluids down\n\nHave you been able to test yet?`, suggestions:['Coartem dosage adult','Malaria in pregnancy','Malaria prevention','Severe malaria signs'] }
        }
        return { type:'companion', message:`${empathy}**Fever guide:**\n\n**Common causes in Uganda:**\n🦟 Malaria — always test first if fever lasts >24 hours\n🦠 Typhoid — sustained fever, headache, stomach pain\n🤧 Flu/viral illness — body aches, sore throat, runny nose\n🦠 UTI — fever with burning urination\n🫁 Pneumonia — fever with cough and fast breathing\n\n**Managing at home:**\n• Paracetamol 500mg–1g every 6 hours (adults)\n• Stay well hydrated — fever increases fluid loss\n• Light clothing — helps body cool\n\n🧪 **Always test for malaria if fever lasts more than 24 hours**\n\n🚨 **Hospital urgently for:** fever with confusion, stiff neck, severe headache, difficulty breathing, or temperature above 40°C\n\nHow long have you had the fever and are there other symptoms?`, suggestions:['Malaria test Uganda','Typhoid symptoms','Paracetamol dosage','Fever in children'] }
      }

      // ── HEADACHE ────────────────────────────────────────────
      if (lower.includes('headache') || lower.includes('head pain') || lower.includes('head hurts') || lower.includes('head is paining') || lower.includes('omutwe')) {
        if (lower.includes('fever') || lower.includes('malaria') || lower.includes('chills')) {
          return { type:'companion', message:`${empathy}**Headache + fever — malaria must be ruled out first.**\n\n🧪 Get an RDT malaria test today — available at pharmacies and health centres.\n\n**Key differences:**\n🦟 **Malaria headache** — comes WITH fever, chills, body aches, cyclical pattern\n💊 **Tension headache** — no fever, band-like pressure, builds during the day\n🧠 **Migraine** — throbbing, one side, nausea, worsened by light\n\n⚠️ **Danger signs — hospital immediately:**\n• Severe headache with stiff neck (meningitis)\n• Headache with confusion or vision changes\n• Sudden worst headache of your life (possible bleed)\n• Headache with face/arm weakness (stroke)\n\nHave you tested for malaria yet?`, suggestions:['Malaria test Uganda','Meningitis signs','Migraine treatment','Paracetamol dosage'] }
        }
        return { type:'companion', message:`${empathy}**Understanding your headache:**\n\n😣 **Tension headache** (most common)\n• Tight band around head, both sides, dull pressure\n• Caused by: stress, dehydration, poor sleep, eye strain\n• Relief: paracetamol, rest, 2 glasses of water\n\n⚡ **Migraine**\n• Throbbing, usually one side, nausea, light/noise sensitivity\n• Relief: ibuprofen early, dark quiet room, sleep\n\n🦟 **Malaria headache**\n• Always comes WITH fever — test for malaria if you also have fever\n\n🩸 **Hypertension headache**\n• Morning pain at back of head — check your blood pressure if over 30\n\n💡 **Quick relief:** Drink 2 glasses of water first — dehydration causes most headaches. Then paracetamol 1g.\n\n🚨 **URGENT: headache + stiff neck + fever = hospital now** (possible meningitis)\n\nIs there fever with the headache, and where exactly is the pain?`, suggestions:['Migraine treatment','Malaria and headache','Hypertension Uganda','Paracetamol vs ibuprofen'] }
      }

      // ── STOMACH / GI ────────────────────────────────────────
      if (lower.includes('stomach') || lower.includes('abdomen') || lower.includes('belly') || lower.includes('nausea') || lower.includes('vomit') || lower.includes('diarrhoea') || lower.includes('diarrhea') || lower.includes('running stomach') || lower.includes('stooling')) {
        if (lower.includes('diarrhoea') || lower.includes('diarrhea') || lower.includes('running stomach') || lower.includes('loose stool') || lower.includes('stooling')) {
          return { type:'companion', message:`${empathy}**Diarrhoea — preventing dehydration is the priority.**\n\n💧 **Start ORS immediately:**\n• FREE at all Uganda health centres\n• Homemade: 1 litre clean water + 6 teaspoons sugar + ½ teaspoon salt\n• Drink a cup after every loose stool\n\n🧒 **Children under 5:** Also give zinc tablets (FREE at health centres)\n• Under 6 months: 10mg daily for 10–14 days\n• Over 6 months: 20mg daily for 10–14 days\n\n🚨 **Hospital urgently if:**\n• Blood or mucus in stool\n• Signs of severe dehydration (sunken eyes, dry mouth, no urine 8+ hrs, very drowsy)\n• Infant under 6 months\n• Rice-water stools (possible cholera)\n• High fever with diarrhoea\n\n🚫 Do NOT take antibiotics for most diarrhoea.\n\nIs there blood in the stool, and how long has this been going on?`, suggestions:['ORS preparation','Cholera signs','Zinc for children','Food poisoning treatment'] }
        }
        return { type:'companion', message:`${empathy}**Stomach/abdominal symptoms** — location and pattern matter:\n\n📍 **Where is the pain?**\n• **Upper middle** — gastritis or peptic ulcer. Worse on empty stomach, helped by food or antacids.\n• **Lower right** — appendicitis (with fever and nausea — hospital urgently)\n• **Lower centre** — UTI, period pain, or bowel issues\n• **All over + fever + vomiting** — food poisoning or typhoid\n\n💊 **For gastritis/acidity:**\n• Omeprazole 20mg before breakfast\n• Avoid ibuprofen/aspirin on empty stomach\n• Eat small regular meals\n\n🚨 **Hospital urgently:** severe pain with fever, lower right pain worsening, vomiting blood, or board-rigid abdomen\n\nWhere exactly is the pain, and does it improve or worsen after eating?`, suggestions:['Gastritis treatment','Appendicitis signs','Typhoid symptoms','Period pain relief'] }
      }

      // ── FATIGUE / TIREDNESS / WEAKNESS ──────────────────────
      if (lower.includes('tired') || lower.includes('fatigue') || lower.includes('exhausted') || lower.includes('weak') || lower.includes('no energy') || lower.includes('body is weak') || lower.includes('obunafu') || lower.includes('maanyi')) {
        return { type:'companion', message:`${empathy}**Fatigue and tiredness** — very common, but the cause matters a lot in Uganda.\n\n**Most common causes:**\n🩸 **Anaemia** — most common cause in Uganda. Symptoms: pale inner eyelids, pale lips/nails, dizzy on standing, shortness of breath. Free blood test at any health centre.\n🦟 **Malaria** — always test if you also have fever, chills, or body aches.\n🪱 **Intestinal worms** — extremely common. Albendazole 400mg single dose, cheap and available everywhere.\n💧 **Dehydration** — drink 8–10 glasses of water daily.\n🦠 **TB or HIV** — if fatigue with weight loss and night sweats, please test for both (FREE at government facilities).\n💉 **Diabetes** — fatigue is often the first sign. Get a fasting blood sugar test.\n\n🚨 **See a doctor if:** fatigue with shortness of breath at rest, chest pain, very pale skin, or lasting more than 2 weeks with no clear cause.\n\nIs there any fever, weight loss, or other symptoms alongside the tiredness?`, suggestions:['Anaemia symptoms Uganda','Malaria test','Worm treatment Uganda','HIV symptoms'] }
      }

      // ── RASH / SKIN SYMPTOMS ─────────────────────────────────
      if (lower.includes('rash') || lower.includes('itching') || lower.includes('itch') || lower.includes('bumps on skin') || lower.includes('spots on skin') || lower.includes('hives') || lower.includes('blisters')) {
        if (lower.includes('fever') || lower.includes('child') || lower.includes('baby')) {
          return { type:'companion', message:`${empathy}**Rash with fever** — this combination needs careful attention.\n\n🚨 **Go to hospital urgently if the rash:**\n• Is spreading fast and looks like bruising (petechiae/purpura) — possible meningitis\n• Covers large areas with blistering\n• Is in a child under 5 who looks very unwell\n\n**Common causes:**\n🔴 **Measles** — starts at head/face, spreads downward, with fever and red eyes. Highly contagious.\n🐔 **Chickenpox** — itchy blisters all over, starts on trunk.\n💊 **Drug reaction** — did you recently start a new medication?\n🦟 **Dengue fever** — rash with high fever and severe bone pain (Uganda border areas).\n\nHow old is the patient, and where on the body did the rash start?`, suggestions:['Measles symptoms Uganda','Chickenpox treatment','Dengue fever Uganda','Meningitis rash signs'] }
        }
        return { type:'companion', message:`${empathy}**Skin rash and itching** — very common in Uganda, usually treatable.\n\n**Common causes:**\n🌿 **Scabies** — intense itching especially at night, between fingers and at waist. Treat the whole household at once with permethrin cream.\n🍄 **Fungal infection (ringworm/tinea)** — circular scaly patches. Clotrimazole cream 2x daily for 2 weeks.\n🌞 **Heat rash** — tiny bumps in skin folds from sweat. Cool water, loose clothing.\n🐛 **Insect bites / allergic reaction** — raised itchy bumps. Chlorpheniramine (antihistamine) for relief.\n💊 **Drug allergy** — widespread rash after starting a new medication. Stop it and see a doctor.\n\n**Treating itch now:** Cool water compress, calamine lotion, or oral chlorpheniramine 4mg.\n\n🚨 **Hospital urgently if:** difficulty breathing, swollen tongue or lips, or widespread blistering.\n\nIs the rash in a specific location, and is it itchy or painful?`, suggestions:['Scabies treatment Uganda','Fungal skin infection','Allergic reaction treatment','Itching in pregnancy'] }
      }

      // ── DIZZINESS / VERTIGO ──────────────────────────────────
      if (lower.includes('dizzy') || lower.includes('dizziness') || lower.includes('spinning') || lower.includes('vertigo') || lower.includes('light headed') || lower.includes('lightheaded') || lower.includes('room spinning')) {
        return { type:'companion', message:`${empathy}**Dizziness** — the type of dizziness points to the cause.\n\n**"Room is spinning" (true vertigo):**\n🦻 **Inner ear problem (BPPV)** — most common. Worse when turning head. Specific head repositioning exercises (Epley manoeuvre) cure it.\n\n**"Feeling faint / light-headed":**\n🩸 **Anaemia** — most common cause in Uganda. Check for pale inner eyelids.\n💧 **Dehydration** — drink water immediately.\n🧂 **Low blood pressure on standing** — stand slowly, especially in heat.\n💊 **Medication side effect** — blood pressure drugs are a common cause.\n🦟 **Malaria** — dizziness with fever always needs a malaria test.\n\n**Right now:** Sit or lie down immediately. Drink fluids. Move slowly when getting up.\n\n🚨 **Hospital urgently if:** dizziness with one-sided weakness, slurred speech, severe headache, or loss of consciousness — these are stroke warning signs.`, suggestions:['Anaemia treatment Uganda','Low blood pressure causes','BPPV vertigo exercises','Dizziness and malaria'] }
      }

      // ── SWELLING / OEDEMA ────────────────────────────────────
      if (lower.includes('swollen') || lower.includes('swelling') || lower.includes('oedema') || lower.includes('edema') || lower.includes('puffy') || lower.includes('leg swelling') || lower.includes('foot swelling') || lower.includes('ankle swelling')) {
        return { type:'companion', message:`${empathy}**Swelling** — location and context help identify the cause.\n\n**Leg / ankle / foot swelling:**\n❤️ **Heart failure** — swelling that worsens during the day and improves overnight, often with breathlessness.\n🩸 **Anaemia** — especially in pregnant women.\n🤰 **Pregnancy** — mild ankle swelling is normal in the third trimester. Sudden or severe facial/hand swelling = pre-eclampsia (URGENT).\n💊 **Medication** — calcium channel blockers (e.g. amlodipine) commonly cause ankle swelling.\n🍃 **Low protein / malnutrition** — generalised soft puffiness.\n\n**Face / eye swelling:**\n💊 Allergic reaction — sudden swelling = treat as emergency.\n🫁 Kidney disease — morning puffiness around eyes.\n\n🚨 **Hospital urgently if:** sudden severe swelling in pregnancy, swelling with difficulty breathing, or swelling with chest pain.\n\nWhere is the swelling, and does it pit when you press it with your finger?`, suggestions:['Heart failure signs Uganda','Swelling in pregnancy pre-eclampsia','Anaemia and swelling','Malnutrition oedema'] }
      }

      // ── BODY PAIN / JOINT ACHES ──────────────────────────────
      if (lower.includes('body pain') || lower.includes('body ache') || lower.includes('body is paining') || lower.includes('whole body') || lower.includes('joint pain') || lower.includes('joints hurt') || lower.includes('muscle pain') || lower.includes('bone pain')) {
        return { type:'companion', message:`${empathy}**Body pain and aches** — widespread pain points to a few key causes.\n\n**With fever — test for these first:**\n🦟 **Malaria** — body aches + fever + chills. Get an RDT test now.\n🦠 **Typhoid** — sustained fever with headache, stomach pain, and severe fatigue.\n🦠 **Dengue** — intense bone/joint pain with high fever (earning its nickname "breakbone fever").\n🤧 **Flu / viral illness** — body aches with sore throat and runny nose.\n\n**Without fever:**\n🦴 **Arthritis** — joint-specific pain, worsens with activity. More common with age.\n🩸 **Anaemia** — generalised weakness and aching.\n😴 **Overexertion or poor sleep** — temporary and self-resolving.\n\n**Relief now:** Paracetamol 1g (adults) every 6 hours, or ibuprofen 400mg with food.\n\n🧪 **If there is any fever, test for malaria before anything else.**\n\nIs there fever alongside the pain, and which parts of the body hurt most?`, suggestions:['Malaria test Uganda','Typhoid symptoms treatment','Arthritis pain management','Flu treatment'] }
      }

      // ── BACK PAIN ────────────────────────────────────────────
      if (lower.includes('back pain') || lower.includes('back hurts') || lower.includes('waist pain') || lower.includes('lower back') || lower.includes('backache') || lower.includes('back is paining')) {
        return { type:'companion', message:`${empathy}**Back pain** — most cases resolve within a few weeks.\n\n**Common causes:**\n🦴 **Muscle strain** — most common. Overexertion, heavy lifting, poor posture. Usually resolves with rest and pain relief.\n🚽 **UTI / kidney infection** — back pain with burning urination and fever. Needs antibiotics promptly.\n🤰 **Pregnancy** — lower back pain very common from the second trimester.\n💉 **Kidney stones** — severe cramping pain from the back radiating to the groin, often with blood in urine.\n\n**Self-care:** Paracetamol or ibuprofen (with food), gentle movement, warm compress, posture correction. Strict bed rest actually delays recovery.\n\n🚨 **Hospital urgently if:** back pain with leg numbness or weakness, loss of bladder/bowel control, fever with back pain, or sudden severe pain.`, suggestions:['Back pain exercises','UTI symptoms Uganda','Kidney stones symptoms','Paracetamol vs ibuprofen'] }
      }

      // ── Generic symptom fallback ─────────────────────────────
      return { type:'companion', message:`${empathy}I'm here to help. To give you the most useful guidance, tell me:\n\n• **What are you feeling exactly?** (cough, fever, headache, stomach pain, etc.)\n• **How long has this been going on?**\n• **Any other symptoms alongside it?**\n• **Severity on a scale of 1–10?**\n\nThe more detail you share, the more specific and useful my guidance will be.\n\n🔬 For a full AI-powered symptom assessment, tap the **Symptom Checker** (stethoscope icon) — it walks you through a structured evaluation.\n\n🚨 **Hospital urgently for:** difficulty breathing, chest pain, confusion, severe headache with stiff neck, or any symptom that feels like an emergency.`, suggestions:['Start symptom checker','Common causes of fever','Malaria symptoms','When to see a doctor'] }
    }

    // Catch-all
    const wellness = WELLNESS_TIPS[Math.floor(Math.random()*WELLNESS_TIPS.length)]
    return {
      type:'companion',
      message:`${empathy}I'm Yolanda, and your health questions matter to me. I have deep knowledge across all health topics:\n\n🏥 **Diseases** — malaria, TB, HIV, diabetes, hypertension, anaemia, and 100+ more\n💊 **Medications** — dosages, side effects, safety, interactions\n🥗 **Nutrition** — specific diets for every health condition\n🩹 **First aid** — step-by-step emergency guides\n🤰 **Maternal & child health** — pregnancy through childhood\n💙 **Mental health** — depression, anxiety, sleep, stress\n🔬 **Prevention** — vaccines, hygiene, lifestyle\n🌿 **Natural remedies** — evidence-based plant medicines\n❤️ **Sexual health** — family planning, STIs, menstrual health\n\nAsk me anything — I'll give you a detailed, honest answer.\n\n💡 *${wellness}*`,
      suggestions:['What is malaria?','Paracetamol dosage','Pregnancy nutrition','HIV prevention'],
    }
  }

  getHistory() { return this.history }
  clearHistory() { this.history = []; this.messageCount = 0; this.sessionTopics = new Set() }
}

export { PERSONALITY, WELLNESS_TIPS }

// ═══════════════════════════════════════════════════════════════
// SPRINT 8 — LUGANDA LOCALISATION LAYER
// Full Yolanda responses in Oluganda
// ═══════════════════════════════════════════════════════════════

// ── Luganda greeting variants ─────────────────────────────────
const GREETINGS_LG = [
  (name) => `Oli otya${name ? ', ' + name : ''}! 😊 Nze Yolanda, mukwano wo ow'obulamu. Ndiwo ku ssawa yonna — obutayagala inneti — okukuleetela obwangu bw'obulamu. Nkitegeera obulamu mu Uganda bulungi. Nnyambirira ku bikolwa byawe, eddagala, okulya, obulamu bw'abaana, obulamu bw'ettima, oba ekibuuzo kyona ekikuzibu. Kyekola kili?`,
  (name) => `Karibu${name ? ' ' + name : ''}! 💚 Nze Yolanda. Obulamu busobola okusoomooza era obuwundu bwoba — ndi owano okuyamba. Oyagala okumanya ki ku bulamu bwo leero?`,
  (name) => `Wasuze otya${name ? ' ' + name : ''}! 🌿 Nze Yolanda wa SayMyDoc. Ntwala obwangu obungi bw'ebyobulamu — bwona buli ku simu yo, butereevu, obutayagala inneti. Bikolwa, eddagala, okulya, obulamu bw'omwana, HIV, TB, omusujja — nkitegeera byona. Nkubuuza ki?`,
  (name) => `Nkusanyukira${name ? ', ' + name : ''}! 💙 Nze Yolanda. Ngamba butereevu, nnali bweru, era nkutwala obulamu bwo obw'omwerere. Ndina obwangu ku binyumu byona, eddagala, okulya, obulamu bw'omwana, HIV, TB, omusujja n'ebirala bingi. Wazuza ki?`,
]

// ── Luganda farewell variants ─────────────────────────────────
const FAREWELLS_LG = [
  'Weebale ennyo! Obuze bulamu bwo bw\'omwerere. Ndiwo naawe buli kiseera. 🌿',
  'Nkusanyukira okukolagana nawe. Jaga ddwaliro singa ebikolwa byakomya. Obulamu bwo ni bw\'omuwendo. 💚',
  'Webale! Nawe wano buli kiseera owebwa okuyamba. Nywa amazzi mangi, sinya bulungi! 🌟',
  'Tulabagane! Omubiri gwo nguwa — tewagalika. 💙',
]

// ── Luganda topic patterns ────────────────────────────────────
const LG_TOPIC_PATTERNS = {
  greeting: ['oli otya', 'nkulamusizza', 'wasuze', 'osiibye', 'otuuse', 'nkusanyukira', 'hello', 'hi', 'heey', 'karibu'],
  malaria:  ['omusujja', 'malaariya', 'nfuna omusujja', 'febulo', 'enkuba y\'omusujja', 'coartem'],
  headache: ['omutwe', 'omutwe gunuma', 'omutwe gunjuma', 'omutwe gunafu'],
  stomach:  ['ekibaala', 'olubuto', 'okusesema', 'okufuwa', 'okwefuula'],
  cough:    ['enkuba', 'okunuba', 'okufuuba'],
  fever:    ['febulo', 'omusujja', 'mubiri gujjudde omuliro', 'mubiri gwaaka'],
  fatigue:  ['obunafu', 'maanyi gaggwaawo', 'okuviiirika', 'sirina maanyi'],
  medication: ['eddagala', 'paracetamol', 'coartem', 'amoxicillin', 'ibuprofen', 'obungi bw\'eddagala'],
  nutrition: ['ndya ki', 'ebyokulya', 'okulya', 'anaemia', 'okwanguka', 'obungi'],
  pregnancy: ['ndi embuto', 'nbeera embuto', 'okubeera embuto', 'omwana mu lubuto'],
  child:    ['omwana', 'abaana', 'omuwere', 'mwana wange', 'omusomi'],
  mental:   ['okutya', 'okubuusabuusa', 'ennaku', 'okujja obwezibu', 'sisinza'],
  hiv:      ['hiv', 'aids', 'silimu', 'art', 'viral load'],
  tb:       ['tb', 'tuberculosis', 'enkuba y\'omusaayi', 'enkuba y\'obuwanvu'],
  firstaid: ['obujjanjabi', 'otulo', 'omusaayi', 'embwa', 'okuzimba', 'omuliro'],
  wellness: ['obulamu obulungi', 'obukuumirizi', 'maanyi', 'ekifo', 'enjoloba'],
  farewell: ['webale', 'weebale', 'tulabagane', 'bye', 'nkusanyukira', 'asante'],
}

function detectTopicLuganda(text) {
  const lower = text.toLowerCase()
  const scores = {}
  for (const [topic, patterns] of Object.entries(LG_TOPIC_PATTERNS)) {
    const score = patterns.filter(p => lower.includes(p)).length
    if (score > 0) scores[topic] = score
  }
  if (!Object.keys(scores).length) return null
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]
}

// ── Luganda response library ──────────────────────────────────
const YOLANDA_LG = {
  malaria: () => ({
    message: `**Omusujja (Malaria) mu Uganda:**\n\n🛏️ **Sinya mu ttimba ery'emiti** buli kiro — kuno kwe kukwekkereza okw'omuwendo. Ennungu zuma kukka.\n🏠 **Sala amazzi ag'eddondo** ku maali gago — tampu, ebipipa, enku.\n🧴 **Wanikira obusujju bw'ennungu** (DEET) ku mubiri gwo ekiro.\n🪟 **Teeka amateetemba** ku bwonko singa bisoboka.\n🤰 **Abakazi abeembuto:** Genda ku nnyumba y'obulamu buli kiseera kw'okubeera embuto — eddagala ly'omutanda liweebwa butereevu.\n🧪 **Ofuna febulo?** Keba mangu ne RDT — togamba bulungi okulwanyisa obutayagala kubaza.\n\n💊 **Okuwangula:** Coartem (artemether-lumefantrine) — eyasooka, EWEEBWA BUTEREEVU mu nnyumba z'obulamu za gavumenti. Kirya ne mmere. Mala ennaku 3.`,
    suggestions: ['Ebikolwa by\'omusujja', 'Coartem engeri gy\'okugozesa', 'Omusujja mu okubeera embuto', 'Omusujja gw\'omwana'],
  }),
  headache: () => ({
    message: `**Omutwe mu Uganda:**\n\n🦟 **Omutwe gw'omusujja** gujja ne febulo era okunaku — keba omusujja ne RDT mangu!\n💧 **Okugwa amazzi mangi:** Obunafu obunene bw'amazzi mu Uganda buteesezza omutwe. Mwa amazzi 8-10 buli lunaku.\n😴 **Otulo totulunuwa:** Kigwa otulo mu kiseera kimu buli kiro kukweka omutwe.\n☀️ **Omuliro gw'enjuba:** Mu Uganda's omusana, kigwa omutwe mangu — labba enkubo ku mutwe.\n⚠️ **Genda ku ddwaliro mangu singa:** Omutwe gujja mangu nyo, okuraba obugwagwa, okuzimba, oba gw'okumawereza woona.`,
    suggestions: ['Omutwe ne febulo', 'Paracetamol engeri gy\'okugozesa', 'Omutwe gw\'omusujja', 'Amazzi n\'obulamu'],
  }),
  fever: () => ({
    message: `**Febulo / Omusujja:**\n\n🌡️ **Ekyanguyiriza ekyakusooka:** Keba omusujja ne RDT — mu Uganda, ekiwaangula ekyabusanafu omusujja gujja.\n\n**Okola leero:**\n• Keba omusujja ne RDT mu kliniki eya kumpi\n• Nywa amazzi mangi\n• Wanikira ekitambala ekikoole ku nnyendo\n• Gozesa paracetamol singa efuna 38°C oba wusira\n\n**Genda ku ddwaliro mangu singa:**\n• Omwana mulala asuka emyaka 5 afuna febulo\n• Febulo esuka 3 ennaku\n• Okuzimba, obuteetegeera, okuraba obugwagwa`,
    suggestions: ['Omusujja w\'omwana', 'RDT kwa nnyumba', 'Paracetamol dosage', 'Ebikolwa by\'omusujja'],
  }),
  stomach: () => ({
    message: `**Ekibaala / Olubuto Lunuma:**\n\n🤢 **Olubuto olunnuma** lusobola okujja olw'ebimuli, obutamira mmere, oba okulwana.\n\n**Bika bye n'okukolera:**\n• Nywa amazzi mangi — ORS singa ofuna okusesema\n• Sirya ebyokulya ebisafu\n• Yimirira okunywa amazzi ag'obute obuwanvu\n\n**Bikolwa ebisobola okujja ne olubuto:**\n• Omusujja oguddukira — Keba omusujja\n• Okusesema okuvaayo (diarrhea) ne okufuwa — Keba cholera/okuzimba\n• Enjuba y'olubuto — Genda ku ddwaliro singa esuka ennaku 3`,
    suggestions: ['ORS engeri gy\'okuteeka', 'Ekibaala n\'omusujja', 'Cholera prevention', 'Stomach pain children'],
  }),
  cough: () => ({
    message: `**Enkuba (Cough):**\n\n🫁 **Enkuba ey'obudde obuwanvu** (esuka wiiki 2-3) mu Uganda, kigwa okuba TB — keba mangu!\n\n**Engeri ez'enkuba:**\n• **Enkuba entono** — obusajja obwa mubiri, ekirwadde kya lunwe\n• **Enkuba n'omusujja** — omusujja, keba omusujja ne RDT\n• **Enkuba n'omusaayi** — Genda ku ddwaliro mangu — TB\n• **Enkuba ey'obudde obuwanvu** ne kwanguka, akutulo obu'buwufu — Keba TB\n\n⚠️ **Keba:** Enkuba n'omusaayi oba esuka emyezi 2 — genda ku ddwaliro.`,
    suggestions: ['TB ebikolwa', 'Enkuba n\'omwana', 'Enkuba ey\'obuddde obuwanvu', 'Pneumonia ebikolwa'],
  }),
  fatigue: () => ({
    message: `**Obunafu / Maanyi Gaggwaawo:**\n\n💤 **Obunafu** mu Uganda busobola okujja olw'ebintu bingi:\n\n🩸 **Anaemia** — ekiwaangula ekyabusanafu mu Uganda, okutuuka ku bakazi. Ebikolwa: okulira, amaso gatuufu.\n🦟 **Omusujja** — Ekiwaangula ekyakusooka keba omusujja ne RDT.\n🪱 **Enyiike** — Enyiike z'olubuto ziba ebyokulya, ziteesa obunafu. Kwata enyiike buli myezi 6.\n💧 **Amazzi mangi** — Obunafu bw'amazzi buteeseza obunafu.\n\n**Singa ofuna obunafu n'enkuba, kwanguka, oba akutulo obu'buwufu — keba TB.**`,
    suggestions: ['Anaemia mu Uganda', 'Enkuba n\'obunafu', 'Enyiike okuwangula', 'Amazzi n\'obulamu'],
  }),
  pregnancy: () => ({
    message: `**Okubeera Embuto mu Uganda:**\n\n🤰 **Ebyokulya eby'omuwendo:**\n• Omwavu (folic acid) — okwekkereza ebizibu bya omongo\n• Icayi (iron) — mpisa, bunyebwa, envu z'obukulu\n• Protein — amagi, enva, nyama\n• Omuzinga (moringa) — olumonde lw'ebyokulya olulungi, olukuuma\n\n🏥 **Genda ku nnyumba y'obulamu:**\n• Ku bikuto ebisatu: omulundi ogumu buli kikuto\n• Enkingo ey'omusujja mu okubeera embuto (IPTp) — eweebwa butereevu\n\n⚠️ **Genda ku ddwaliro mangu singa:**\n• Omusaayi okuvaayo\n• Ebito ez'omwana tekukyusanya\n• Omutwe munene, amaso gatuufu`,
    suggestions: ['Enkingo mu okubeera embuto', 'Omwavu n\'folic acid', 'Ebirala eby\'obuwundu', 'Okulisa omwana'],
  }),
  child: () => ({
    message: `**Obulamu bw'Omwana mu Uganda:**\n\n💉 **Endagiriro y'enkingo (Uganda):**\n• Okuzaalibwa: BCG, OPV0, Hepatitis B\n• Wiiki 6: DPT-HepB-Hib, OPV, Rotavirus, PCV\n• Wiiki 10 & 14: enkingo ezo ez'okusembeza\n• Myezi 9: Measles-Rubella, Meningitis A, Yellow Fever\n• Myezi 18: Measles-Rubella okusembeza\n\n🍼 **Okulisa:**\n• Lisa omwana amazzi g'amabeere bokka okumala myezi 6\n• Tandika ebyokulya eby'enjawulo mu myezi 6\n\n⚠️ **Genda ku ddwaliro mangu singa omwana:**\n• Afuna febulo era alala\n• Agaana kulya oba atuufu\n• Atafuuba bulungi`,
    suggestions: ['Enkingo ezimu', 'Omusujja gw\'omwana', 'Okulisa omwana', 'Anaemia mu abaana'],
  }),
  mental: () => ({
    message: `**Obulamu bw'Ettima:**\n\n💙 Nkuwa ekitegeero n'okukuwa obwangu.\n\nObulamu bw'ettima bukyalwa mu Uganda n'okutegeera obwakyalwa — kyokka n'obulamu bwa mubiri, obulamu bw'ettima bubuulirwa.\n\n**Bika by'obuzibu bw'ettima:**\n• **Okubuusabuusa / Okutya** — okufudde, omusaayi guyimirizibwa, obutusinzirira\n• **Ennaku (Depression)** — okujja obwezibu, obutayagala kintu, obunafu\n• **Obuzibu bw'okusinzirira** — okutambuza obudde, okutya bwangu\n\n🤝 **Omuyamba wa mazima:**\n• Yogera ne muntu gwe weetegera\n• Genda ku kliniki — abaamu b'obulamu bw'ettima basalawo\n• Nkabagize mu Mulago oba Butabika Hospital`,
    suggestions: ['Okusinzirira', 'Okubuusabuusa', 'Ennaku (depression)', 'Obulamu bw\'ettima okuyamba'],
  }),
  hiv: () => ({
    message: `**HIV ne TB mu Uganda:**\n\n🛡️ **HIV — Okukwekkereza:**\n• Kozesa condom buli kiseera — kukwekkereza HIV ne STI enzibu ennyo\n• Keba HIV butereevu — mu nnyumba z'obulamu zonna mu Uganda\n• PrEP (ekiyoto buli lunaku) — kubulibwa mu nnyumba nyingi mu Uganda\n• PEP: Singa ofunye HIV mu ssawa 72 — genda ku ddwaliro MANGU\n\n💊 **ART (Antiretroviral):**\n• Eweebwa butereevu mu Uganda yonna\n• Goza buli lunaku — ne nga gafa obulwadde bwatinda\n• Viral load ya pootela eteekebwa mako ku okubeera\n\n🫁 **TB:**\n• Tumiira omukka — fungula emirimu buli lunaku\n• Mala eddagala lya TB okutuuka ku nkamalirizo — TOGGYAKO mangu`,
    suggestions: ['HIV testing Uganda', 'ART eddagala', 'TB ebikolwa', 'HIV n\'okubeera embuto'],
  }),
  firstaid: () => ({
    message: `**Obujjanjabi (First Aid) mu Uganda:**\n\n🩹 Ndi n'ekulembeka ey'obujjanjabi eri ebintu bya mazima byona:\n\n• 🔥 **Otulo / Okulumwa amaanyi** — amazzi ag'obutugumu bwangu bwangu\n• 🩸 **Omusaayi okuvaayo** — kakasa, nyiga omusaayi\n• 😮 **Okuzimba (choking)** — Heimlich maneuver\n• 🐍 **Enswera / Embwa** — yimirirra okuyegenda, genda ku ddwaliro\n• 💫 **Okugwa obwebwa** — teeka mu side, vitalu\n• ⚡ **Okuzimba / Okufita** — teeka mu side, kkiriza\n• 🦴 **Okumenya omuggwa** — yimirirra okugenda, teeka kiwongoyeo\n\nKyanguyiriza ki?`,
    suggestions: ['Otulo — engeri', 'Omusaayi okuvaayo', 'Enswera okuma', 'Okufita omwana'],
  }),
  medication: () => ({
    message: `**Eddagala mu Uganda:**\n\nNdi n'ebimu ku eddagala ery'enjawulo mu Uganda — obungi, okulabula, obukuumi mu okubeera embuto:\n\n💊 Paracetamol, Ibuprofen, Aspirin\n🦟 Coartem (omusujja), ORS (okusesema)\n💉 Amoxicillin, Cotrimoxazole, Metronidazole\n🫁 Salbutamol (asthma)\n🩸 Folic acid, Iron supplements\n💊 Metformin (diabetes), Omeprazole\n\nBuuza ku eddagala lye oyagala okumanya!`,
    suggestions: ['Paracetamol obungi', 'Coartem engeri', 'Amoxicillin omwana', 'Eddagala mu okubeera embuto'],
  }),
  nutrition: () => ({
    message: `**Okulya Obulungi mu Uganda:**\n\nNkuwa endagiriro y'okulya ku:\n\n🩸 **Anaemia** — ebyokulya ebiri n'icayi\n💉 **Diabetes** — okukwekkereza obutamya omusaayi\n❤️ **Omusaayi omuwanvu** — DASH diet\n🤰 **Okubeera embuto** — ekulembeka ey'okumalirira\n👶 **Okulisa omwana** — okuzaalibwa okutuuka emyaka 2\n⚖️ **Okwanguka omubiri** — engeri ezyobere\n💪 **Okunafu omubiri** — okuzimba omubiri w'obulamu\n\nKayambibwako ku ki?`,
    suggestions: ['Anaemia ebyokulya', 'Diabetes diet Uganda', 'Okubeera embuto okulya', 'Omusaayi omuwanvu okulya'],
  }),
  wellness: () => ({
    message: `**Obulamu Obulungi mu Uganda:**\n\n💧 **Amazzi:** Mwa ebikopo 8-10 buli lunaku. Mu Uganda's omusana, amazzi g'obunafu gakuleetela omutwe, obunafu, oba okusaasira kwa bude.\n\n😴 **Otulo:** Sinzira essawa 7-8 buli kiro. Omubiri gwo oteekera n'okukolagana kw'obulamu mu busiro bw'otulo.\n\n🏃 **Okulimba:** Tambula eddakiika 30 buli lunaku. Okubala omusaayi, okukwekkereza diabetes, hypertension, n'ennaku.\n\n🙌 **Okwoza emikono:** Twala ssabbuuni n'amazzi nga bwe oyagala kulya. Kugwamya obulwadde bungi ennyo.\n\n🌿 **Moringa:** Kola mu Uganda yonna — ya tinkirivu ebyokulya. Gwangako mu mmere yo.`,
    suggestions: ['Amazzi n\'obulamu', 'Okulimba obulamu', 'Otulo obulungi', 'Obukuumirizi bwa mazima'],
  }),
}

// ── Luganda-aware CompanionSession extension ──────────────────
// Extend the existing CompanionSession.respond() to check lang first
const _originalRespond = CompanionSession.prototype.respond

CompanionSession.prototype.respond = function(userText) {
  const lang = this.user?.lang || 'en'

  // If Luganda, try Luganda routing first
  if (lang === 'lg') {
    const lgTopic = detectTopicLuganda(userText)

    if (lgTopic === 'farewell') {
      const msg = FAREWELLS_LG[Math.floor(Math.random() * FAREWELLS_LG.length)]
      this.history.push({ role: 'ai', text: msg, time: Date.now() })
      this.messageCount++
      return { type: 'companion', message: msg, suggestions: [] }
    }

    if (lgTopic === 'greeting') {
      const name = this.user?.name || ''
      const greetFn = GREETINGS_LG[this.messageCount % GREETINGS_LG.length] || GREETINGS_LG[0]
      this.messageCount++
      const msg = greetFn(name)
      this.history.push({ role: 'ai', text: msg, time: Date.now() })
      return {
        type: 'companion',
        message: msg,
        suggestions: ['Ebikolwa by\'omusujja', 'Ndya ki okwangula anaemia?', 'Ngamba otulo ku kuluma?', 'Nnyambirira ku paracetamol'],
      }
    }

    const responderMap = {
      malaria: YOLANDA_LG.malaria,
      headache: YOLANDA_LG.headache,
      fever: YOLANDA_LG.fever,
      stomach: YOLANDA_LG.stomach,
      cough: YOLANDA_LG.cough,
      fatigue: YOLANDA_LG.fatigue,
      pregnancy: YOLANDA_LG.pregnancy,
      child: YOLANDA_LG.child,
      mental: YOLANDA_LG.mental,
      hiv: YOLANDA_LG.hiv,
      tb: YOLANDA_LG.hiv,
      firstaid: YOLANDA_LG.firstaid,
      medication: YOLANDA_LG.medication,
      nutrition: YOLANDA_LG.nutrition,
      wellness: YOLANDA_LG.wellness,
    }

    const responder = lgTopic && responderMap[lgTopic]
    if (responder) {
      this.messageCount++
      this.sessionTopics.add(lgTopic)
      const resp = responder()
      this.history.push({ role: 'ai', text: resp.message, time: Date.now() })
      return { type: 'companion', ...resp }
    }

    // Unrecognised Luganda — give a helpful fallback in Luganda
    if (lgTopic === null && /[aeiou]{2,}|gg|kk|ww|ng[^o]|nny|mba|mbi|mbu|nju|njo/i.test(userText)) {
      this.messageCount++
      const fallback = `Nkubuuza obuzibu okukitegeera bulungi. Nyamba okukuyambirira — nnyambirira ebigambo byawe eby'olungereza oba Oluganda, era ndimba okuddamu.\n\nWabuuza ku ki? Bikolwa, eddagala, okulya, oba ekirala?`
      this.history.push({ role: 'ai', text: fallback, time: Date.now() })
      return {
        type: 'companion',
        message: fallback,
        suggestions: ['Ebikolwa byange', 'Eddagala', 'Okulya obulungi', 'Obujjanjabi'],
      }
    }
  }

  // Fall through to original English handler
  return _originalRespond.call(this, userText)
}

export { YOLANDA_LG, GREETINGS_LG, FAREWELLS_LG, LUGANDA_SYMPTOMS }
