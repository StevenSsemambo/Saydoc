// ─────────────────────────────────────────────────────────────
// SayMyDoc — red-flag screen
//
// A small, conservative, on-device check that runs BEFORE symptom
// extraction. If the text describes a life-threatening situation we
// say "go now" immediately — even when the normal engine would not
// recognise any symptom. Over-triggering is acceptable here; missing
// a real emergency is not.
//
// ⚠ Clinical review needed for wording and for the Luganda/Swahili
// patterns before wide release.
// ─────────────────────────────────────────────────────────────

const R = (id, en, sw, ...patterns) => ({ id, en, sw, patterns })

const FLAGS = [
  R('not_breathing',
    'Someone who is unconscious, not responding or not breathing needs help NOW. Call for help and get them to the nearest health facility immediately. If trained, check breathing and start CPR.',
    'Mtu asiyeamka, asiyejibu au asiyepumua anahitaji msaada SASA. Piga simu ya msaada na umpeleke kituo cha afya kilicho karibu mara moja.',
    /\b(unconscious|unresponsive|passed out and|not (?:breathing|responding|waking)|stopped breathing|won'?t wake|cannot be woken|can'?t be woken|collapsed)\b/,
    /\b(amezimia|hapumui|haamki)\b/, /\b(awenyise|takussa)\b/),
  R('stroke',
    'Sudden weakness, a drooping face, or trouble speaking can be a stroke. This is an emergency — go to a hospital IMMEDIATELY. Every minute counts.',
    'Udhaifu wa ghafla, uso kupinda au kushindwa kuongea vinaweza kuwa kiharusi. Hii ni dharura — nenda hospitali MARA MOJA.',
    /\bface (?:is |was )?(?:drooping|droops|dropped|twisted|crooked)\b/,
    /\bdrooping (?:face|mouth)\b/,
    /\b(?:cannot|can'?t|unable to|suddenly) (?:speak|talk)\b/,
    /\bslurred speech\b/,
    /\bsudden(?:ly)? (?:weak|weakness|numb|numbness|paralys\w*)\b/,
    /\b(?:one side|half) of (?:the |my |his |her )?(?:body|face)\b.*\b(?:weak|numb|paraly\w*|dead)\b/,
    /\bcan'?t (?:move|lift) (?:my|his|her) (?:arm|leg)\b/),
  R('breathing_difficulty',
    'Severe difficulty breathing is an emergency. Go to the nearest health facility NOW. Sit upright while you travel.',
    'Kupumua kwa shida sana ni dharura. Nenda kituo cha afya kilicho karibu SASA. Kaa wima ukiwa njiani.',
    /\b(?:cannot|can'?t|unable to|struggling to|difficulty|trouble|hard to) breath\w*\b/,
    /\bgasping\b/, /\bchest (?:is )?(?:pulling|sucking|drawing) in\b/, /\bchest indrawing\b/,
    /\blips?\b.*\b(?:blue|purple)\b/, /\bturning blue\b/, /\bshort(?:ness)? of breath\b.*\b(?:severe|very|resting|rest)\b/,
    /\bnashindwa kupumua\b/, /\bsiwezi kupumua\b/),
  R('heavy_bleeding',
    'Heavy bleeding or bleeding with faintness is an emergency. Press firmly on the wound with a clean cloth, keep the person lying down, and get to a health facility NOW.',
    'Kutokwa na damu nyingi au kuhisi kuzimia ni dharura. Bonyeza jeraha kwa kitambaa safi, mlaze mtu, na uende kituo cha afya SASA.',
    /\bbleeding (?:heavily|a lot|badly|profusely|non-?stop|will not stop|won'?t stop)\b/,
    /\b(?:heavy|severe|profuse) bleeding\b/, /\blosing (?:a lot of )?blood\b/, /\bsoaking (?:through )?(?:pads?|cloths?)\b/,
    /\bdamu nyingi\b/),
  R('pregnancy_danger',
    'Bleeding, severe belly pain, fits, severe headache or reduced baby movement in pregnancy are danger signs. Go to a health facility IMMEDIATELY.',
    'Kutokwa na damu, maumivu makali ya tumbo, kifafa, kichwa kuuma sana au mtoto kutocheza ukiwa mjamzito ni dalili za hatari. Nenda kituo cha afya MARA MOJA.',
    /\b(?:pregnan\w*|expecting|months? pregnant)\b.*\b(?:bleed\w*|blood|fits?|seizure\w*|convuls\w*|severe (?:headache|abdominal|belly|stomach)|not moving|stopped moving|reduced movement|waters? broke)\b/,
    /\b(?:bleed\w*|fits?|seizure\w*|convuls\w*)\b.*\b(?:pregnan\w*|expecting)\b/,
    /\bbaby (?:has )?(?:stopped|not) (?:moving|kicking)\b/,
    /\b(?:ndi|nina) olubuto\b.*\b(?:omusaayi|okuvaamu)\b/),
  R('seizure',
    'A fit (seizure) that lasts more than 5 minutes, repeats, or happens with fever, a head injury or pregnancy is an emergency. Lay the person on their side, put nothing in the mouth, and get to a health facility NOW.',
    'Kifafa kinachozidi dakika 5, kinachojirudia, au chenye homa, jeraha la kichwa au ujauzito ni dharura. Mlaze upande, usiweke kitu mdomoni, na uende kituo cha afya SASA.',
    /\b(?:having|had|is having|keeps having|started having) (?:a |an )?(?:fits?|seizures?|convulsions?)\b/,
    /\b(?:fits?|seizures?|convulsions?)\b.*\b(?:not waking|won'?t wake|unconscious|since|again and again|repeated\w*)\b/,
    /\bshaking uncontrollably\b/, /\bkifafa\b/),
  R('poisoning',
    'Swallowing poison, kerosene, pesticide, chemicals or too many tablets is an emergency. Do NOT make the person vomit. Take the container with you and go to a health facility NOW.',
    'Kumeza sumu, mafuta ya taa, dawa ya kuua wadudu, kemikali au vidonge vingi ni dharura. USIMTAPISHE. Chukua chombo na uende kituo cha afya SASA.',
    /\b(?:swallowed|drank|drunk|ate|ingested|took) (?:\w+ ){0,4}(?:kerosene|paraffin|poison|pesticide|insecticide|bleach|petrol|chemical\w*|acid|rat poison)\b/,
    /\b(?:kerosene|paraffin|poison|pesticide|insecticide|bleach) poisoning\b/,
    /\b(?:overdose\w*|too many (?:tablets|pills))\b/, /\bpoisoned\b/,
    /\b(?:amemeza|amekunywa) (?:sumu|mafuta ya taa)\b/),
  R('snakebite',
    'A snake bite is an emergency even if you feel fine. Keep the person calm and still, keep the bitten limb at heart level, remove rings/tight items, do NOT cut or suck the bite, and go to a health facility with antivenom NOW.',
    'Kuumwa na nyoka ni dharura hata ukijisikia vizuri. Mtuliza mtu, usikate wala kunyonya jeraha, na uende kituo chenye dawa ya sumu ya nyoka SASA.',
    /\b(?:snake|cobra|puff adder|viper|mamba)\b.*\b(?:bit\w*|bite|strike|struck)\b/,
    /\b(?:bit\w*|bite|bitten|struck)\b.*\b(?:snake|cobra|puff adder|viper|mamba)\b/,
    /\bameumwa na nyoka\b/, /\bwamera\b.*\b(?:luma|lumye)\b/),
  R('anaphylaxis',
    'Swelling of the face, lips or tongue, or trouble breathing after a sting, medicine or food may be a severe allergic reaction. This is an emergency — go NOW.',
    'Kuvimba uso, midomo au ulimi, au kushindwa kupumua baada ya kuumwa na mdudu, dawa au chakula kunaweza kuwa mzio mkali. Hii ni dharura — nenda SASA.',
    /\b(?:face|lips?|tongue|throat)\b.*\b(?:swell\w*|swollen)\b/,
    /\b(?:swell\w*|swollen)\b.*\b(?:face|lips?|tongue|throat)\b/,
    /\banaphyla\w*\b/, /\bsevere allergic reaction\b/, /\bthroat (?:is )?closing\b/),
  R('coughing_blood',
    'Coughing up blood, or vomiting blood or black material, needs urgent medical attention. Go to a health facility TODAY — now if there is a lot of blood or you feel faint.',
    'Kukohoa damu au kutapika damu au kitu cheusi kunahitaji matibabu ya haraka. Nenda kituo cha afya LEO — sasa kama damu ni nyingi au unahisi kuzimia.',
    /\b(?:coughing|coughs?|coughed)(?: up)? (?:\w+ ){0,2}blood\b/, /\bblood(?:y)? (?:in|when) (?:my |his |her )?(?:cough|sputum|phlegm)\b/,
    /\b(?:vomit\w*|throwing up|threw up)\b.*\b(?:blood|black|coffee)\b/,
    /\b(?:black|tarry|bloody) (?:stool|stools|poop|vomit)\b/, /\bvomit (?:is )?black\b/,
    /\bnakohoa damu\b/, /\bnatapika damu\b/),
  R('acute_abdomen',
    'Sudden severe belly pain, especially if the belly is hard like a board, needs urgent care. Do not eat or drink and go to a health facility NOW.',
    'Maumivu makali ya ghafla ya tumbo, hasa tumbo likiwa gumu kama ubao, yanahitaji huduma ya haraka. Usile wala kunywa na uende kituo cha afya SASA.',
    /\b(?:belly|abdomen|stomach|tummy)\b.*\b(?:hard|rigid|stiff) (?:like|as) (?:a )?(?:board|wood|stone)\b/,
    /\b(?:rigid|board-?like) (?:belly|abdomen|stomach)\b/,
    /\bsudden(?:ly)? (?:severe|terrible|unbearable|excruciating) (?:pain in (?:my |the )?)?(?:belly|abdom\w*|stomach)\b/,
    /\b(?:severe|unbearable|worst) (?:belly|abdominal|stomach) pain\b.*\b(?:sudden|vomit\w*|cannot move|can'?t move)\b/),
  R('infant_danger',
    'A young baby who is not feeding, is very sleepy or floppy, has a fever, fast breathing, or fits is in danger. Go to a health facility IMMEDIATELY.',
    'Mtoto mchanga asiyenyonya, aliyelala sana au mlegevu, mwenye homa, kupumua haraka au kifafa yuko hatarini. Nenda kituo cha afya MARA MOJA.',
    /\b(?:baby|infant|newborn|toddler|child)\b.*\b(?:not (?:feeding|breastfeeding|sucking|drinking|eating)|refus\w* (?:to )?(?:feed|breast|drink|eat)|very sleepy|too sleepy|floppy|limp|lethargic|hard to wake|not waking|stiff neck|sunken fontanelle)\b/,
    /\b(?:not feeding|can'?t drink|cannot drink|cannot suckle|can'?t suckle)\b.*\b(?:baby|infant|newborn|child)\b/),
  R('chest_pain',
    'Severe chest pain, pain spreading to the arm or jaw, or chest pain with sweating or breathlessness may be a heart emergency. Go to a hospital NOW.',
    'Maumivu makali ya kifua, yanayosambaa mkononi au taya, au yenye jasho au kupumua kwa shida yanaweza kuwa dharura ya moyo. Nenda hospitali SASA.',
    /\b(?:severe|crushing|heavy|tight|terrible|sharp|bad) chest pain\b/, /\bchest pain\b.*\b(?:arm|jaw|sweat\w*|breath\w*|faint\w*)\b/,
    /\b(?:pain|pressure|tightness) in (?:my |the )?chest\b.*\b(?:arm|jaw|sweat\w*|breath\w*)\b/,
    /\bheart attack\b/),
  R('meningitis',
    'Fever with a stiff neck, severe headache, rash or confusion can be meningitis — a medical emergency. Go to a hospital IMMEDIATELY.',
    'Homa na shingo ngumu, kichwa kuuma sana, vipele au kuchanganyikiwa vinaweza kuwa uti wa mgongo — dharura. Nenda hospitali MARA MOJA.',
    /\bstiff neck\b.*\b(?:fever|headache|rash|light)\b/, /\b(?:fever|headache)\b.*\bstiff neck\b/,
    /\b(?:fever|headache)\b.*\bconfus\w*\b/, /\bconfus\w*\b.*\bfever\b/),
  R('severe_burn_head_injury',
    'A serious burn, or a head injury with vomiting, drowsiness, confusion or fits, needs urgent care. Go to a health facility NOW.',
    'Moto mkubwa, au jeraha la kichwa lenye kutapika, usingizi, kuchanganyikiwa au kifafa linahitaji huduma ya haraka. Nenda kituo cha afya SASA.',
    /\bhead injur\w*\b.*\b(?:vomit\w*|sleepy|drows\w*|confus\w*|fits?|bleeding|unconscious)\b/,
    /\b(?:hit|struck|fell on) (?:my |his |her |the )?head\b.*\b(?:vomit\w*|sleepy|drows\w*|confus\w*|unconscious|bleeding)\b/,
    /\b(?:severe|serious|large|extensive) burn\w*\b/, /\bburn\w* (?:over|on) (?:a )?(?:large|big)\b/),
  R('diabetic_emergency',
    'Confusion, fruity-smelling breath, very fast breathing or fainting in a person with diabetes is an emergency. If they can swallow, give sugar; then go to a health facility NOW.',
    'Kuchanganyikiwa, pumzi yenye harufu ya matunda, kupumua haraka sana au kuzimia kwa mtu mwenye kisukari ni dharura. Kama anaweza kumeza mpe sukari; kisha nenda kituo cha afya SASA.',
    /\bdiabet\w*\b.*\b(?:confus\w*|unconscious|faint\w*|fruity|passed out|collapsed|very drowsy)\b/,
    /\b(?:confus\w*|unconscious|faint\w*|collapsed)\b.*\bdiabet\w*\b/),
]

/**
 * @param {string} text   raw user text
 * @param {'en'|'sw'|'lg'} lang
 * @returns {{id:string, message:string, urgency:'emergency'}|null}
 */
export function detectRedFlag(text, lang = 'en') {
  const lower = String(text || '').toLowerCase().replace(/\s+/g, ' ')
  if (!lower) return null
  for (const f of FLAGS) {
    if (f.patterns.some(p => p.test(lower))) {
      const msg = lang === 'sw' ? f.sw : f.en
      return { id: f.id, message: '⚠️ ' + (lang === 'sw' ? 'DHARURA: ' : 'EMERGENCY: ') + msg, urgency: 'emergency' }
    }
  }
  return null
}

export const RED_FLAG_IDS = FLAGS.map(f => f.id)
