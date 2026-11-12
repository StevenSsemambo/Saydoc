// ── Emotional Intelligence Engine v2 ──────────────────────────
// v2 improvements:
//  - Expanded self-harm patterns (Ugandan expressions)
//  - Better emotion detection for indirect language
//  - Crisis-level triage with numbered hotlines
//  - Compassion-first wording for all crisis responses

const EMOTION_PATTERNS = {
  anxious: [
    'scared','afraid','worried','fear','terrified','nervous','panic',
    'could this be','is this serious','am i going to','what if','please help',
    "i don't know what",'so worried','really scared','i am afraid','i am scared',
    'very worried','i am nervous','anxious','is it dangerous',
  ],
  distressed: [
    'terrible','horrible','awful','suffering','unbearable',"can't take it",
    'so much pain','really bad','getting worse','not getting better','days now',
    'weeks now','months now','nobody helps',"doctor doesn't know",
    'in so much pain','this is too much','cannot bear it','i am suffering',
    'going through a lot','burden','hopeless','dark thoughts','no reason to live',
    'feel like dying','want to die','end my life','better off dead',
  ],
  confused: [
    'confused',"don't understand",'what is','can you explain','what does',
    "i don't know",'not sure','what should i','what do i do','help me understand',
    'i am confused','how do i know','i cannot understand','what does this mean',
  ],
  frustrated: [
    'frustrating','annoying','tired of','sick of','keeps coming back','again',
    'still happening','nothing works','tried everything','useless','not helping',
    'no improvement','back again','recurring','keeps recurring',
    'it keeps coming','nothing is working',
  ],
  relieved: [
    'thank you','that helps','makes sense','i understand now','feeling better',
    'good to know','reassuring','thanks','appreciate','helpful','now i understand',
    'that makes sense','clear now',
  ],
  hopeful: [
    'hope','maybe','could be','hoping','fingers crossed','will try',
    'going to try','sounds good','ok i will','i will do that',
  ],
  dismissive: [
    'probably nothing',"it's fine",'just checking','not that bad','minor',
    'slight','small','maybe just tired','not serious',
  ],
}

export function detectEmotion(text) {
  const lower = text.toLowerCase()
  const scores = {}
  for (const [emotion, patterns] of Object.entries(EMOTION_PATTERNS)) {
    let score = 0
    for (const pattern of patterns) { if (lower.includes(pattern)) score++ }
    if (score > 0) scores[emotion] = score
  }
  if (!Object.keys(scores).length) return 'neutral'
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]
}

const EMPATHY_RESPONSES = {
  anxious: [
    "I hear that you're worried — that's completely understandable. Let me help you make sense of this. ",
    "It's okay to feel concerned. I'm going to help you understand what might be happening. ",
    "Your concern is valid. Let me work through this with you carefully. ",
  ],
  distressed: [
    "I can hear that you've been really suffering with this. I'm sorry — let me give you the most useful guidance I can. ",
    "That sounds genuinely difficult, and I want to help as much as possible. ",
    "I understand this has been really hard. Let's figure out what's going on together. ",
  ],
  confused: [
    "No need to worry — I'll explain this clearly, step by step. ",
    "Let me break this down in a way that makes sense. ",
    "Good question — let me help you understand this properly. ",
  ],
  frustrated: [
    "I understand your frustration — recurring or persistent health issues are genuinely exhausting. ",
    "I hear you. Let's look at this from a fresh angle and see if we can find something useful. ",
    "That sounds really tiring. Let me try to give you something more concrete and actionable. ",
  ],
  relieved: [
    "I'm really glad that's helpful! ",
    "That's great to hear. ",
  ],
  hopeful: ["That's the right attitude. ", ""],
  dismissive: ["Even small or mild symptoms are worth understanding properly. ", ""],
  neutral: [""],
}

export function getEmpathyPrefix(emotion) {
  const options = EMPATHY_RESPONSES[emotion] || EMPATHY_RESPONSES.neutral
  return options[Math.floor(Math.random() * options.length)]
}

export function getEmotionalIntensity(text) {
  const lower = text.toLowerCase()
  let intensity = 0
  const intensifiers = ['very','really','extremely','so','terribly','incredibly','absolutely']
  const exclamations = (text.match(/!/g) || []).length
  const uppercase = (text.match(/[A-Z]{2,}/g) || []).length
  const ellipsis = (text.match(/\.\.\./g) || []).length
  intensifiers.forEach(w => { if (lower.includes(w)) intensity += 1 })
  intensity += exclamations * 1.5
  intensity += uppercase * 2
  intensity += ellipsis * 0.5
  return Math.min(10, Math.round(intensity))
}

// ── Self-harm / Crisis Detection v2 ──────────────────────────
// Expanded to cover Ugandan English expressions and indirect signals
const SELF_HARM_PATTERNS = [
  // Direct
  'want to die','want to hurt myself','end my life','kill myself',
  'suicide','self harm','cut myself','harm myself','not worth living',
  'give up on life','no reason to live','better off dead',
  // Indirect / indirect Ugandan English
  'i am tired of living','tired of this life','no reason to wake up',
  'what is the point of living','life has no meaning','i want to end it',
  'thinking of ending it','thinking of ending everything','i should just die',
  'everyone would be better without me','nobody would miss me',
  'i feel like disappearing','wish i could disappear','wish i was not here',
  'wish i was dead','i am useless to everyone','no reason to continue',
  'cannot continue like this','i cannot go on','i do not want to continue',
  "don't want to continue",'feel like a burden to everyone',
  // High concern signals (not necessarily immediate risk but flag)
  'hopeless and tired','everything is dark','trapped','no way out',
]

export function detectSelfHarmRisk(text) {
  const lower = text.toLowerCase()
  return SELF_HARM_PATTERNS.some(p => lower.includes(p))
}

export function getSelfHarmResponse() {
  return {
    type: 'crisis',
    message: `I want you to know that what you're feeling is real, and it matters deeply.\n\nYou don't have to face this alone — please reach out to someone who can support you right now:\n\n🇺🇬 **Uganda Mental Health Support:**\n• **Butabika Hospital:** +256-41-4287988 (24 hours)\n• **Mental Health Uganda (MHUGA):** +256-800-212121 (toll-free)\n• **Lifeline Uganda:** +256-800-111-199\n\n💙 **Right now:** Tell someone near you how you are feeling — a family member, friend, neighbour, or religious leader. You deserve support.\n\nI'm here too. Tell me what's been happening, and let's talk.`,
    priority: 'crisis',
  }
}

export function adaptToneForSession(emotionHistory) {
  if (!emotionHistory?.length) return 'standard'
  const recentEmotions = emotionHistory.slice(-5)
  const distressCount = recentEmotions.filter(e => ['distressed','anxious','frustrated'].includes(e)).length
  const positiveCount = recentEmotions.filter(e => ['relieved','hopeful'].includes(e)).length
  if (distressCount >= 3) return 'highly_supportive'
  if (distressCount >= 2) return 'supportive'
  if (positiveCount >= 3) return 'encouraging'
  return 'standard'
}

const CONDITION_EMPATHY = {
  migraine: "I know migraines are genuinely debilitating — not 'just a headache'. ",
  depression: "I want you to know that reaching out about this takes courage. ",
  anxiety: "Anxiety is real and can be exhausting to live with. ",
  tb: "A TB diagnosis can feel overwhelming, but it is completely curable. ",
  hiv_symptoms: "Whatever your status, you deserve care and support — not judgment. ",
  chronic_pain: "Living with chronic pain takes real strength. ",
}

export function getConditionEmpathy(conditionKey) {
  return CONDITION_EMPATHY[conditionKey] || ''
}

export function getSupportiveClosing(emotion, conditionKey) {
  const closings = {
    anxious: "You did the right thing by seeking information. Understanding your health is the first step.",
    distressed: "I hope this has given you some clarity and a path forward. You deserve to feel better.",
    frustrated: "I know this hasn't been easy. Please try the steps above and see if they help.",
    confused: "I hope that made things clearer. Don't hesitate to ask if you need more explanation.",
    neutral: "Take care of yourself.",
  }
  return closings[emotion] || closings.neutral
}

export function analyseEmotionalTrend(journalEntries) {
  if (!journalEntries || journalEntries.length < 5) return null
  const recent = journalEntries.slice(0, 7)
  const avgMood = recent.reduce((s, e) => s + (e.mood || 3), 0) / recent.length
  const avgStress = recent.reduce((s, e) => s + (e.stress || 3), 0) / recent.length
  let state = 'stable'
  let message = null
  if (avgMood <= 2 && avgStress >= 4) {
    state = 'concerning'
    message = "Your journal shows consistently low mood and high stress this week. This pattern is worth paying attention to. Consider talking to someone you trust."
  } else if (avgMood <= 2) {
    state = 'low_mood'
    message = "Your mood has been low this week. Even small steps — a walk, talking to a friend, or sunlight — can help shift this."
  } else if (avgStress >= 4) {
    state = 'high_stress'
    message = "Your stress levels have been high this week. High stress is a known trigger for many health conditions. Prioritise rest and decompression."
  } else if (avgMood >= 4) {
    state = 'positive'
    message = "Your mood has been good this week — keep doing what you're doing!"
  }
  return { state, message, avg_mood: avgMood, avg_stress: avgStress }
}
