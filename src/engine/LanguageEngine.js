// ── SayMyDoc Language System v2 ─────────────────────────────
// Supports: English (en), Luganda (lg), Swahili (sw)
// Sprint 8: Full Luganda coverage — UI, AI, Companion, NLP topics

export const LANGUAGES = {
  en: { name: 'English',   native: 'English',   flag: '🇬🇧' },
  lg: { name: 'Luganda',   native: 'Oluganda',  flag: '🇺🇬' },
  sw: { name: 'Swahili',   native: 'Kiswahili', flag: '🌍' },
}

const translations = {
  'nav.home':     { en: 'Home',     lg: 'Awaka',    sw: 'Nyumbani' },
  'nav.check':    { en: 'Check',    lg: 'Kebera',   sw: 'Angalia' },
  'nav.library':  { en: 'Library',  lg: 'Akatabo',  sw: 'Maktaba' },
  'nav.yolanda':  { en: 'Yolanda',  lg: 'Yolanda',  sw: 'Yolanda' },
  'nav.insights': { en: 'Insights', lg: 'Amagezi',  sw: 'Ufahamu' },
  'nav.profile':  { en: 'Profile',  lg: 'Ebikungu', sw: 'Wasifu' },

  'home.greeting.morning':   { en: 'Good morning',   lg: 'Wasuze otya',  sw: 'Habari ya asubuhi' },
  'home.greeting.afternoon': { en: 'Good afternoon', lg: 'Osiibye otya', sw: 'Habari ya mchana' },
  'home.greeting.evening':   { en: 'Good evening',   lg: 'Otuuse otya',  sw: 'Habari ya jioni' },
  'home.cta.title':          { en: 'How are you feeling?', lg: 'Olimutya?', sw: 'Hujisikiaje?' },
  'home.cta.sub':            { en: 'Describe your symptoms to our AI', lg: 'Gamba ebikolwa byawe eri AI yaffe', sw: 'Eleza dalili zako kwa AI yetu' },
  'home.cta.label':          { en: 'START SYMPTOM CHECK', lg: 'TANDIKA OKUKEBERA', sw: 'ANZA UKAGUZI' },
  'home.tip.label':          { en: 'HEALTH TIP OF THE DAY', lg: 'OBUKUUMIRIZI BWA LEERO', sw: 'USHAURI WA AFYA WA LEO' },
  'home.library.all':        { en: 'All', lg: 'Byona', sw: 'Zote' },
  'home.recent':             { en: 'Recent Checks', lg: 'Okukeberebwa Okwasubi', sw: 'Ukaguzi wa Hivi Karibuni' },
  'home.see.all':            { en: 'See all', lg: 'Laba byona', sw: 'Ona zote' },
  'home.companion.label':    { en: 'AI COMPANION', lg: 'OMUVUBUKA WA AI', sw: 'MSAIDIZI WA AI' },
  'home.companion.desc':     { en: 'Chat with Yolanda', lg: 'Yogera ne Yolanda', sw: 'Zungumza na Yolanda' },
  'home.symptom.label':      { en: 'SYMPTOM CHECK', lg: 'OKUKEBERA EBIKOLWA', sw: 'UKAGUZI WA DALILI' },
  'home.symptom.desc':       { en: 'Check your symptoms', lg: 'Kebera ebikolwa byawe', sw: 'Angalia dalili zako' },

  'chat.placeholder':        { en: 'Describe how you feel...', lg: 'Gamba ebikolwa byawe...', sw: 'Eleza unavyohisi...' },
  'chat.ai.name':            { en: 'SayMyDoc AI', lg: 'SayMyDoc AI', sw: 'SayMyDoc AI' },
  'ai.status.online':        { en: '● AI online', sw: '● AI mtandaoni' },
  'ai.status.offline':       { en: '● Offline mode', sw: '● Hali ya nje ya mtandao' },
  'chat.online':             { en: '● Offline-ready', lg: '● Tobuze kutandiika', sw: '● Iko tayari bila mtandao' },
  'chat.new.check':          { en: 'New Check', lg: 'Okukebera Okupya', sw: 'Ukaguzi Mpya' },
  'chat.start.new':          { en: 'Start New Symptom Check', lg: 'Tandika Okukebera Okupya', sw: 'Anza Ukaguzi Mpya wa Dalili' },
  'chat.emergency.title':    { en: 'Emergency Alert', lg: "Obulaamu Obw'engeri", sw: 'Tahadhari ya Dharura' },
  'chat.answer.yes':         { en: 'Yes', lg: 'Weewaawo', sw: 'Ndiyo' },
  'chat.answer.no':          { en: 'No', lg: 'Nedda', sw: 'Hapana' },
  'chat.intro':              {
    en: "Tell me how you're feeling and I'll help you understand your symptoms.",
    lg: 'Nnyambirira ebikolwa byawe ne nkuyambe okubitegeera.',
    sw: 'Niambie unavyohisi nami nikuambie kuhusu dalili zako.'
  },

  'companion.header.name':   { en: 'Yolanda — Health AI', lg: "Yolanda — Omuvubuka w'Obulamu", sw: 'Yolanda — AI ya Afya' },
  'companion.header.status': { en: '● Always here for you', lg: '● Ndiwo buli kiseera', sw: '● Niko hapa wakati wote' },
  'companion.new.chat':      { en: 'New Chat', lg: 'Okwogera Okupya', sw: 'Mazungumzo Mapya' },
  'companion.what.know':     { en: 'WHAT WOULD YOU LIKE TO KNOW?', lg: 'OBA KIKI KYE OYAGALA OKUMANYA?', sw: 'UNGEPENDA KUJUA NINI?' },
  'companion.input.hint':    { en: 'Ask me anything about health...', lg: 'Nzuza ekibuuzo kyona ku bulamu...', sw: 'Niulize chochote kuhusu afya...' },
  'companion.disclaimer':    {
    en: 'Yolanda provides health guidance, not medical diagnosis.',
    lg: "Yolanda atawa obukuumirizi, si obusawo bw'eddagala.",
    sw: 'Yolanda inatoa mwongozo wa afya, si utambuzi wa kimatibabu.'
  },

  'topic.symptoms':    { en: 'Symptoms',       lg: 'Ebikolwa',             sw: 'Dalili' },
  'topic.medications': { en: 'Medications',    lg: 'Eddagala',             sw: 'Dawa' },
  'topic.nutrition':   { en: 'Nutrition',      lg: 'Okulya',               sw: 'Lishe' },
  'topic.firstaid':    { en: 'First Aid',      lg: 'Obujjanjabi',          sw: 'Msaada wa Kwanza' },
  'topic.pregnancy':   { en: 'Pregnancy',      lg: 'Okubeera Embuto',      sw: 'Ujauzito' },
  'topic.child':       { en: 'Child Health',   lg: "Obulamu bw'Omwana",    sw: 'Afya ya Mtoto' },
  'topic.malaria':     { en: 'Malaria',        lg: 'Omusujja',             sw: 'Malaria' },
  'topic.wellness':    { en: 'Wellness',       lg: 'Obulamu Obulungi',     sw: 'Afya Njema' },
  'topic.mental':      { en: 'Mental Health',  lg: "Obulamu bw'Ettima",    sw: 'Afya ya Akili' },
  'topic.hiv':         { en: 'HIV & TB',       lg: 'HIV ne TB',            sw: 'HIV na TB' },
  'topic.water':       { en: 'Safe Water',     lg: 'Amazzi Amalongoofu',   sw: 'Maji Salama' },
  'topic.family':      { en: 'Family Planning',lg: 'Okuteeka Embaga',      sw: 'Uzazi wa Mpango' },

  'journal.title':           { en: 'Health Journal', lg: "Ekitabo Ky'Obulamu", sw: 'Jarida la Afya' },
  'journal.subtitle':        { en: 'Track daily to discover your patterns', lg: 'Kuba ne okukulembeka buli lunaku', sw: 'Fuatilia kila siku kugundua mifumo yako' },
  'journal.today':           { en: 'Today', lg: 'Leero', sw: 'Leo' },
  'journal.history':         { en: 'History', lg: 'Ebyafaayo', sw: 'Historia' },
  'journal.mood':            { en: 'How are you feeling?', lg: 'Olimutya?', sw: 'Hujisikiaje?' },
  'journal.sleep':           { en: 'Sleep', lg: 'Otulo', sw: 'Usingizi' },
  'journal.water':           { en: 'Water', lg: 'Amazzi', sw: 'Maji' },
  'journal.stress':          { en: 'Stress Level', lg: "Obuzibu Obw'Ettima", sw: 'Kiwango cha Msongo' },
  'journal.symptoms':        { en: 'Any Symptoms Today?', lg: 'Waliwo Ebikolwa Leero?', sw: 'Kuna Dalili Leo?' },
  'journal.notes':           { en: 'Notes (optional)', lg: 'Ebiwandiiko (bikyali)', sw: 'Maelezo (si lazima)' },
  'journal.save':            { en: "Save Today's Journal", lg: 'Zachira Ekitabo Kya Leero', sw: "Hifadhi Jarida la Leo" },
  'journal.saved':           { en: 'Saved!', lg: 'Ekizachiriwa!', sw: 'Imehifadhiwa!' },
  'journal.hours':           { en: 'hours', lg: 'essawa', sw: 'masaa' },
  'journal.glasses':         { en: 'glasses', lg: 'bikopo', sw: 'vikombe' },
  'journal.energy':          { en: 'Energy', lg: 'Amaanyi', sw: 'Nguvu' },
  'journal.log.reminder':    {
    en: 'Logging for 5 days unlocks personalised health insights.',
    lg: 'Okulembeka ennaku 5 kukugulawo amagezi g\'obulamu bwo.',
    sw: 'Kurekodi siku 5 kunafungua ufahamu wa afya uliobinafsishwa.'
  },

  'sym.headache':  { en: 'Headache',     lg: 'Omutwe',      sw: 'Maumivu ya kichwa' },
  'sym.fever':     { en: 'Fever',        lg: 'Omusujja',    sw: 'Homa' },
  'sym.nausea':    { en: 'Nausea',       lg: 'Okwefuula',   sw: 'Kichefuchefu' },
  'sym.fatigue':   { en: 'Fatigue',      lg: 'Obunafu',     sw: 'Uchovu' },
  'sym.dizziness': { en: 'Dizziness',    lg: 'Okutetemera', sw: 'Kizunguzungu' },
  'sym.stomach':   { en: 'Stomach pain', lg: 'Ekibaala',    sw: 'Maumivu ya tumbo' },
  'sym.cough':     { en: 'Cough',        lg: 'Enkuba',      sw: 'Kikohozi' },
  'sym.backpain':  { en: 'Back pain',    lg: 'Emabega',     sw: 'Maumivu ya mgongo' },
  'sym.anxiety':   { en: 'Anxiety',      lg: 'Okutya',      sw: 'Wasiwasi' },

  'insights.title':         { en: 'Health Insights', lg: "Amagezi G'Obulamu", sw: 'Ufahamu wa Afya' },
  'insights.subtitle':      { en: 'Patterns discovered from your journal data', lg: 'Engeri ezitondebwa mu makulu go', sw: 'Mifumo iliyogunduliwa kutoka data yako' },
  'insights.no.data':       { en: 'Not enough data yet', lg: 'Ebikugu bibiire bimala', sw: 'Data haitoshi bado' },
  'insights.no.data.sub':   { en: 'Log your health for at least 5 days to unlock insights', lg: 'Kowola obulamu bwo okumala ennaku 5 okusuulira amagezi', sw: 'Rekodi afya yako kwa siku 5 kupata ufahamu' },
  'insights.weekly.score':  { en: 'WEEKLY HEALTH SCORE', lg: "AMANGU G'OBULAMU OBW'ESABBIITI", sw: 'ALAMA YA AFYA YA WIKI' },
  'insights.patterns':      { en: 'DISCOVERED PATTERNS', lg: 'ENGERI EZITONDEBWA', sw: 'MIFUMO ILIYOGUNDULIWA' },
  'insights.best.days':     { en: 'YOUR BEST DAYS', lg: "ENNAKU ZAWE EZ'OBULUNGI", sw: 'SIKU ZAKO BORA' },
  'insights.loading':       { en: 'Analysing your health patterns...', lg: "Tukennaganya engeri z'obulamu bwo...", sw: 'Inachambua mifumo yako ya afya...' },
  'insights.freq.symptoms': { en: 'YOUR MOST FREQUENT SYMPTOMS', lg: 'EBIKOLWA BYO EBY\'ENJAWULO', sw: 'DALILI ZAKO ZA KAWAIDA' },

  'library.title':    { en: 'Health Library', lg: "Akatabo K'Obulamu", sw: 'Maktaba ya Afya' },
  'library.search':   { en: 'Search conditions...', lg: 'Noonya obulwadde...', sw: 'Tafuta hali za afya...' },
  'library.conditions': { en: 'CONDITION', lg: 'OBULWADDE', sw: 'HALI YA AFYA' },

  'cond.overview':      { en: 'Overview',    lg: 'Ekyolesebwa',   sw: 'Muhtasari' },
  'cond.action':        { en: 'Action Plan', lg: 'Ebyokukolera',  sw: 'Mpango wa Hatua' },
  'cond.remedies':      { en: 'Remedies',    lg: 'Eddagala',      sw: 'Tiba' },
  'cond.warning':       { en: 'See Doctor',  lg: 'Yako Omusawo',  sw: 'Ona Daktari' },
  'cond.what':          { en: 'What is it?', lg: 'Kiki?',         sw: 'Ni nini?' },
  'cond.why':           { en: 'Why It Happens In Your Body', lg: 'Lwaki Kigenda Mu Mubiri Gwo', sw: 'Kwa Nini Inatokea Mwilini Mwako' },
  'cond.context':       { en: '🇺🇬 East Africa Context', lg: "🇺🇬 Omukutu w'Afrika Ey'Ebuvanjuba", sw: '🇺🇬 Muktadha wa Afrika Mashariki' },
  'cond.do.now':        { en: 'Do Right Now', lg: 'Kola Kati', sw: 'Fanya Sasa Hivi' },
  'cond.short.term':    { en: 'Short Term', lg: 'Mu Kiseera Ekimpi', sw: 'Muda Mfupi' },
  'cond.long.term':     { en: 'Long Term Prevention', lg: 'Okukwekkereza Obudde Obuwanvu', sw: 'Kinga ya Muda Mrefu' },
  'cond.see.doctor.if': { en: 'See a Doctor If...', lg: "Yako Omusawo Bw'...", sw: 'Ona Daktari Ikiwa...' },
  'cond.home.remedies': { en: 'Home & Natural Remedies', lg: "Eddagala Ly'Awaka", sw: 'Tiba za Nyumbani na Asili' },
  'cond.learn.more':    { en: 'Learn More About', lg: 'Manya Obulungi Ku', sw: 'Jifunze Zaidi Kuhusu' },
  'cond.most.likely':   { en: 'Most Likely', lg: 'Kisinga Okuba', sw: 'Inayowezekana Zaidi' },
  'cond.also.considered': { en: 'Also considered', lg: 'Naakitegeera nawe', sw: 'Pia ilizingatiwa' },

  'profile.title':       { en: 'Profile', lg: 'Ebikungu', sw: 'Wasifu' },
  'profile.export':      { en: 'Export Health Report', lg: "Sumulula Ripoti Y'Obulamu", sw: 'Hamisha Ripoti ya Afya' },
  'profile.export.sub':  { en: 'Download PDF with your health history', lg: "Pakula PDF y'ebyafaayo by'obulamu bwo", sw: 'Pakua PDF na historia yako ya afya' },
  'profile.generating':  { en: 'Generating PDF...', lg: 'Tukola PDF...', sw: 'Inaunda PDF...' },
  'profile.downloaded':  { en: 'Downloaded! Check your files', lg: 'Epakuuliddwa! Kebera amafaili go', sw: 'Imepakuliwa! Angalia faili zako' },
  'profile.privacy':     { en: 'Privacy First', lg: 'Obuggya Nga Bwa Mazima', sw: 'Faragha Kwanza' },
  'profile.privacy.desc':{ en: 'All your health data is stored only on your device. Nothing is shared.', lg: "Ebikugu by'obulamu byo byonka ebyo ku kifaananyi kyo. Terabirako kintu.", sw: 'Data yote ya afya yako imehifadhiwa kwenye kifaa chako tu.' },
  'profile.offline':     { en: '100% Offline', lg: '100% Obutayagala Inneti', sw: '100% Bila Mtandao' },
  'profile.disclaimer':  { en: 'Medical Disclaimer', lg: "Okutegeeza Kw'Eddagala", sw: 'Kanusho la Matibabu' },

  'onboard.intro':          { en: 'Introducing', lg: 'Tukuwa', sw: 'Kuanzisha' },
  'onboard.tagline':        { en: 'The first fully offline AI health companion built for Africa', lg: "Omuvubuka wa mazima ow'obulamu ow'AI atabuuza mwanvu ogutengedde Afrika", sw: 'Msaidizi wa kwanza wa afya wa AI bila mtandao ulioundwa kwa Afrika' },
  'onboard.name':           { en: 'Your Name', lg: 'Erinnya Lyo', sw: 'Jina Lako' },
  'onboard.age':            { en: 'Age', lg: 'Emyaka', sw: 'Umri' },
  'onboard.sex':            { en: 'Sex', lg: 'Ekyoto', sw: 'Jinsia' },
  'onboard.location':       { en: 'Location', lg: 'Ekifo', sw: 'Mahali' },
  'onboard.male':           { en: 'Male', lg: 'Omusajja', sw: 'Mwanaume' },
  'onboard.female':         { en: 'Female', lg: 'Omukazi', sw: 'Mwanamke' },
  'onboard.other':          { en: 'Other', lg: 'Okirala', sw: 'Kingine' },
  'onboard.start':          { en: 'Start Using SayMyDoc', lg: 'Tandika Okozesa SayMyDoc', sw: 'Anza Kutumia SayMyDoc' },
  'onboard.profile.title':  { en: 'Tell me about yourself', lg: 'Nnyambirira ebikungu byo', sw: 'Niambie kuhusu wewe' },
  'onboard.profile.sub':    { en: 'This helps me give you personalised health guidance', lg: "Kino kinnambira okuwa obukuumirizi bw'obulamu bwo", sw: 'Hii inisaidia kukupa mwongozo wa afya uliobinafsishwa' },
  'onboard.step1.title':    { en: 'Welcome to SayMyDoc', lg: 'Tukukiriza mu SayMyDoc', sw: 'Karibu SayMyDoc' },
  'onboard.step1.sub':      { en: 'Your intelligent health companion — always offline, always with you.', lg: "Omuvubuka wo ow'amagezi w'obulamu — bulijjo obutayagala inneti, bulijjo naawe.", sw: 'Msaidizi wako wa akili wa afya — bila mtandao kila wakati, nawe kila wakati.' },
  'onboard.step2.title':    { en: 'Smart Health AI', lg: "AI ey'Amagezi y'Obulamu", sw: 'AI ya Afya ya Akili' },
  'onboard.step2.sub':      { en: 'Describe your symptoms and our AI will help you understand what your body is telling you.', lg: 'Gamba ebikolwa byawe ne AI yaffe ikuyambe okutegeera bye mubiri gwo ogugamba.', sw: 'Eleza dalili zako na AI yetu itakusaidia kuelewa anachokwambia mwili wako.' },
  'onboard.step3.title':    { en: 'Your Privacy, Always', lg: 'Obuggya Bwo, Bulijjo', sw: 'Faragha Yako, Kila Wakati' },
  'onboard.step3.sub':      { en: 'All your health data stays on your phone. Nothing goes to the cloud. Nothing is shared.', lg: "Ebikugu by'obulamu byo byona bisigala ku simu yo. Tewaliwo kikyuuka. Terabirako kintu.", sw: 'Data yote ya afya yako inabaki kwenye simu yako. Hakuna kinachokwenda kwa wingu.' },
  'onboard.step4.title':    { en: 'Works Completely Offline', lg: 'Ekola Butereevu Obutayagala Inneti', sw: 'Inafanya Kazi Bila Mtandao Kabisa' },
  'onboard.step4.sub':      { en: 'No internet needed. SayMyDoc works anywhere, anytime — even with no signal.', lg: 'Tewetagisa inneti. SayMyDoc ekola kuli wonna, buli kiseera — ne nga tewaliiwo siginali.', sw: 'Hakuna mtandao unaohitajika. SayMyDoc inafanya kazi popote, wakati wowote.' },
  'onboard.cta.setup':      { en: 'Set Up Profile', lg: 'Teeka Ebikungu', sw: 'Weka Wasifu' },
  'onboard.cta.continue':   { en: 'Continue', lg: 'Endeera', sw: 'Endelea' },
  'onboard.cta.start':      { en: 'Get Started', lg: 'Tandika', sw: 'Anza' },

  'emergency.banner.title': { en: 'Emergency Reminder', lg: 'Okujjukuza Obulaamu', sw: 'Ukumbusho wa Dharura' },
  'emergency.banner.text':  {
    en: 'Sudden severe headache, chest pain, difficulty breathing, or one-sided weakness — go to hospital immediately.',
    lg: 'Omutwe ogujja mangu, obuzibu mu kifuba, obutayinza kufuuba, oba obutasobola kunne — genda ku ddwaliro mangu.',
    sw: 'Maumivu ya kichwa ghafla, maumivu ya kifua, ugumu wa kupumua, au udhaifu wa upande mmoja — nenda hospitalini mara moja.'
  },

  'ui.back':         { en: '← Back', lg: '← Subira', sw: '← Rudi' },
  'ui.loading':      { en: 'Loading...', lg: 'Tuteekawo...', sw: 'Inapakia...' },
  'ui.save':         { en: 'Save', lg: 'Zachira', sw: 'Hifadhi' },
  'ui.cancel':       { en: 'Cancel', lg: 'Sazaamu', sw: 'Ghairi' },
  'ui.certainty.good':       { en: 'Good match', sw: 'Inalingana vizuri' },
  'ui.certainty.moderate':   { en: 'Moderate match', sw: 'Inalingana kiasi' },
  'ui.certainty.low':        { en: 'Low certainty', sw: 'Uhakika mdogo' },
  'ui.possibility.note':     { en: 'This is a possibility based on what you told me, not a diagnosis. A test or a health worker can confirm it. Go to a clinic urgently if you get worse.', sw: 'Hii ni uwezekano kulingana na ulichoeleza, si utambuzi. Kipimo au mhudumu wa afya anaweza kuthibitisha. Nenda kliniki haraka ukizidiwa.' },
  'ui.confidence':   { en: 'confidence', lg: 'okutegeera', sw: 'uhakika' },
  'ui.most.likely':  { en: 'Most Likely', lg: 'Kisinga Okuba', sw: 'Inayowezekana Zaidi' },
  'ui.also.considered': { en: 'Also considered', lg: 'Naakitegeera nawe', sw: 'Pia ilizingatiwa' },
  'ui.do.right.now': { en: 'Do Right Now', lg: 'Kola Kati', sw: 'Fanya Sasa Hivi' },
  'ui.short.term':   { en: 'Short Term', lg: 'Mu Kiseera Ekimpi', sw: 'Muda Mfupi' },
  'ui.health.check': { en: 'Health Check', lg: "Okukeberebwa Kw'Obulamu", sw: 'Ukaguzi wa Afya' },
  'ui.today':        { en: 'today', lg: 'leero', sw: 'leo' },
  'ui.log.today':    { en: 'Log today', lg: 'Kola leero', sw: 'Rekodi leo' },
  'ui.sessions':     { en: 'sessions', lg: 'emitendera', sw: 'vikao' },
  'ui.search':       { en: 'Search...', lg: 'Noonya...', sw: 'Tafuta...' },
  'ui.see.doctor':   { en: 'See a doctor', lg: 'Yako omusawo', sw: 'Ona daktari' },
  'ui.disclaimer':   {
    en: 'SayMyDoc provides health guidance, not medical diagnosis. Always consult a qualified healthcare professional.',
    lg: "SayMyDoc etawa obukuumirizi, si obusawo bw'eddagala. Buulira omusawo omulongoofu buli kiseera.",
    sw: 'SayMyDoc inatoa mwongozo wa afya, si utambuzi wa kimatibabu. Daima shauriana na mtaalamu wa afya.'
  },

  'ai.greeting': {
    en: "Hi {name}! 👋 I'm your SayMyDoc health companion. Tell me what you're feeling and I'll help you understand it.",
    lg: "Oli otya {name}! 👋 Nze mukwano wo ow'obulamu wa SayMyDoc. Nnyambirira ebikolwa byo ne nkuyambe okubimannya.",
    sw: "Habari {name}! 👋 Mimi ni msaidizi wako wa afya wa SayMyDoc. Niambie unavyohisi nami nikuambie kuhusu hilo."
  },
  'ai.clarify': {
    en: 'I want to make sure I understand you. Could you tell me more — where is the pain, how long have you had it, and how severe is it (1-10)?',
    lg: 'Njagala okumanya nga nkutegeera bulungi. Nnyambirira obulungi — obuzibu buli wa, obudde wa obikowedde, era bunafu butya (1-10)?',
    sw: 'Nataka kuhakikisha ninakuelewa. Unaweza kunieleza zaidi — maumivu yako yako wapi, umeyapata kwa muda gani, na ni makali kiasi gani (1-10)?'
  },
  'ai.more.info': {
    en: 'Could you describe your main symptom in more detail?',
    lg: 'Nnyambirira obulungi ekirala ekikulu?',
    sw: 'Unaweza kuelezea dalili yako kuu kwa undani zaidi?'
  },
  'ai.followup.duration': {
    en: 'How long have you had this symptom?',
    lg: 'Obudde bwa nganga obirowedde ekirala kino?',
    sw: 'Umekuwa na dalili hii kwa muda gani?'
  },
  'ai.followup.severity': {
    en: 'How severe is it on a scale of 1 to 10?',
    lg: 'Bunafu butya ku kiwero kya 1 okutuuka ku 10?',
    sw: 'Ni kali kiasi gani kwa kiwango cha 1 hadi 10?'
  },
  'ai.emergency.go': {
    en: 'This sounds serious. Please go to a hospital or health centre immediately.',
    lg: 'Kino kisoomooza. Genda ku ddwaliro oba ku kifo ky\'obulamu mangu mangu.',
    sw: 'Hii inasikika kuwa mbaya. Tafadhali nenda hospitalini au kituo cha afya mara moja.'
  },

  'tip.water': {
    en: 'Drinking 8-10 glasses of water daily prevents headaches, fatigue, and poor focus.',
    lg: "Okumwa amazzi 8-10 olunaku kukuuma omutwe, obunafu, n'okubuusabuusa.",
    sw: 'Kunywa glasi 8-10 za maji kila siku kuzuia maumivu ya kichwa, uchovu, na kukosa umakini.'
  },
  'tip.sleep': {
    en: 'Consistent sleep and wake times dramatically reduces migraine frequency.',
    lg: 'Okugwa otulo ku kiseera kimu buli kiro kukweka omutwe.',
    sw: 'Nyakati za kulala na kuamka zinazofanana hupunguza sana mara za maumivu ya kichwa.'
  },
  'tip.malaria': {
    en: 'Malaria headaches come with fever. Migraine headaches come with light sensitivity.',
    lg: "Omutwe gw'omusujja gujja ne febulo. Omutwe gwa migraine gujja n'okutaabirira ekitangaala.",
    sw: 'Maumivu ya kichwa ya malaria huja na homa. Maumivu ya kipandauso huja na unyeti wa mwanga.'
  },
  'tip.handwash': {
    en: "Washing hands with soap before eating prevents more disease than almost any other single habit.",
    lg: 'Okwoza emikono ne ssabbuuni nga bwe oyagala kulya kukwema obulwadde obungi ennyo.',
    sw: 'Kunawa mikono kwa sabuni kabla ya kula kunazuia magonjwa zaidi kuliko tabia nyingine yoyote.'
  },
  'tip.moringa': {
    en: "Moringa grows throughout Uganda and is one of the world's most nutritious plants — add it to food for iron, calcium, and vitamins.",
    lg: "Omuzinga ekola mu Uganda yonna era ye muti ogw'ebyokulya ogulungi ennyo — giwangako mu mmere okufuna icayi, calcium, n'vitamin.",
    sw: 'Moringa inakua kote Uganda na ni moja ya mimea yenye lishe zaidi duniani — iongeze kwenye chakula kwa chuma, kalsiamu, na vitamini.'
  },
  'tip.malariaint': {
    en: 'Test for malaria immediately when you have fever. Never assume and self-treat without an RDT.',
    lg: 'Keba omusujja mangu nga bwe ofuna febulo. Togamba bulungi okweddagalira wabula RDT.',
    sw: 'Pima malaria mara moja unapopata homa. Usifikirie tu na kujidawa bila RDT.'
  },
  'tip.bp': {
    en: 'High blood pressure has no symptoms until it causes a stroke. Check yours at least once a year after age 30.',
    lg: 'Omusaayi omuwanvu teguwa bimenyekanyi okutuuka nga guleese sitirooku. Kebera ekibiibiivu kyo omulundi gumu buli mwaka nga otuuse emyaka 30.',
    sw: 'Shinikizo la juu la damu halina dalili mpaka linaposababisha kiharusi. Pima lako angalau mara moja kwa mwaka baada ya miaka 30.'
  },
  'tip.deworming': {
    en: 'Deworm every 6 months. Intestinal worms steal nutrients, cause anaemia, and impair school performance.',
    lg: "Kwata enyiike buli myezi 6. Enyiike ey'olubuto ziiba ebyokulya, ziteeka anaemia, era zimanyisa abaana obukuzunguzungu.",
    sw: 'Tibu minyoo kila miezi 6. Minyoo ya utumbo inapora virutubisho, husababisha anemia, na kuathiri utendaji wa shuleni.'
  },

  'meds.title':          { en: 'Medication Guide', lg: 'Ekulembeka Eddagala', sw: 'Mwongozo wa Dawa' },
  'meds.subtitle':       { en: 'Common medicines in Uganda — uses, doses, warnings', lg: "Eddagala ery'enjawulo mu Uganda", sw: 'Dawa za kawaida Uganda — matumizi, kipimo, onyo' },
  'meds.search':         { en: 'Search by name or condition...', lg: 'Noonya erinnya oba obulwadde...', sw: 'Tafuta kwa jina au hali...' },
  'meds.used.for':       { en: 'USED FOR', lg: 'EKOLEDDWAKO', sw: 'INATUMIKA KWA' },
  'meds.how.works':      { en: 'HOW IT WORKS', lg: "ENGERI GY'EKOLA", sw: 'JINSI INAVYOFANYA KAZI' },
  'meds.dosage':         { en: 'DOSAGE', lg: "OBUNGI BW'EDDAGALA", sw: 'KIPIMO' },
  'meds.warnings':       { en: 'IMPORTANT WARNINGS', lg: 'OKULABULA OKUKULU', sw: 'MAONYO MUHIMU' },
  'meds.adult':          { en: 'Adult', lg: 'Omuntu Omukulu', sw: 'Mtu Mzima' },
  'meds.child':          { en: 'Children', lg: 'Abaana', sw: 'Watoto' },
  'meds.safe.pregnancy': { en: 'Safe in pregnancy', lg: 'Salama mu kubeera embuto', sw: 'Salama wakati wa ujauzito' },
  'meds.avoid.pregnancy':{ en: 'Avoid in pregnancy', lg: 'Weewale mu kubeera embuto', sw: 'Epuka wakati wa ujauzito' },
  'meds.safe.children':  { en: 'Safe for children', lg: 'Salama ku baana', sw: 'Salama kwa watoto' },
  'meds.adults.only':    { en: 'Adults only', lg: 'Abantu abakulu bokka', sw: 'Watu wazima tu' },
  'meds.availability':   { en: '🇺🇬 Uganda Availability', lg: '🇺🇬 Obulabiri mu Uganda', sw: '🇺🇬 Upatikanaji Uganda' },

  'remedy.title':       { en: 'Natural Remedies', lg: "Eddagala Ly'Endalo", sw: 'Tiba za Asili' },
  'remedy.subtitle':    { en: 'African plants and home remedies — evidence-rated', lg: "Ebimera by'Afrika n'eddagala ly'awaka", sw: 'Mimea ya Afrika na tiba za nyumbani' },
  'remedy.helps.with':  { en: 'HELPS WITH', lg: 'EPONYA', sw: 'INASAIDIA NA' },
  'remedy.compounds':   { en: 'ACTIVE COMPOUNDS', lg: 'EBINTU EBIKOLA', sw: 'VIPENGELE VINAVYOFANYA KAZI' },
  'remedy.how.to.use':  { en: 'HOW TO USE', lg: "ENGERI GY'OKOZESA", sw: 'JINSI YA KUTUMIA' },
  'remedy.safety':      { en: 'SAFETY', lg: 'OBUKUUMI', sw: 'USALAMA' },
  'remedy.science':     { en: '🔬 What the research says', lg: '🔬 Bye bwekwaso bwogera', sw: '🔬 Utafiti unasema nini' },

  'bodymap.title':    { en: 'Body Map', lg: "Ekifananyi Ky'Omubiri", sw: 'Ramani ya Mwili' },
  'bodymap.subtitle': { en: 'Tap where it hurts to start your assessment', lg: 'Nyiga awo obuwundu buliwo okuddirira okukeberebwa', sw: 'Gonga mahali ambapo inakuuma kuanza tathmini yako' },
  'bodymap.front':    { en: 'Front', lg: 'Amazzi', sw: 'Mbele' },
  'bodymap.back':     { en: 'Back', lg: 'Emabega', sw: 'Nyuma' },
  'bodymap.selected': { en: 'Selected', lg: 'Kitondeddwa', sw: 'Imechaguliwa' },
  'bodymap.assess':   { en: 'Assess Symptoms', lg: 'Kebera Ebikolwa', sw: 'Tathmini Dalili' },

  'history.title':      { en: 'Health History', lg: 'Ebyafaayo Bya Obulamu', sw: 'Historia ya Afya' },
  'history.no.history': { en: 'No history yet', lg: 'Tewaliiwo ebyafaayo', sw: 'Hakuna historia bado' },
  'history.checks':     { en: 'symptom checks recorded', lg: 'okukeberebwa okuteekeddwa', sw: 'ukaguzi wa dalili zilizorekodiwa' },

  'hw.title':          { en: 'Health Worker Mode', lg: "Engeri ya Omukozi w'Obulamu", sw: 'Hali ya Mfanyakazi wa Afya' },
  'hw.subtitle':       { en: 'Enhanced clinical detail for community health workers', lg: "Ebisingayo ku baakiizi b'obulamu", sw: 'Maelezo ya kliniki yaliyoboreshwa kwa wafanyakazi wa afya wa jamii' },
  'hw.patient.id':     { en: 'Patient ID / Name', lg: "Erinnya ly'Omulwadde", sw: 'Kitambulisho / Jina la Mgonjwa' },
  'hw.age.sex':        { en: 'Age & Sex', lg: "Emyaka n'Ekyoto", sw: 'Umri na Jinsia' },
  'hw.clinical.notes': { en: 'Clinical Notes', lg: "Ebiwandiiko by'Omusawo", sw: 'Maelezo ya Kliniki' },
  'hw.referral':       { en: 'Referral Guidance', lg: "Okulabula Okw'Okugyibwa", sw: 'Mwongozo wa Rufaa' },
  'hw.icd.code':       { en: 'ICD-10 Code', lg: 'Namba ya ICD-10', sw: 'Nambari ya ICD-10' },

  'settings.title':    { en: 'Settings', lg: 'Ebivaamu', sw: 'Mipangilio' },
  'settings.subtitle': { en: 'Customise your SayMyDoc experience', lg: 'Teekateeka okozesa kwo kwa SayMyDoc', sw: 'Binafsisha uzoefu wako wa SayMyDoc' },
  'settings.language': { en: 'Language', lg: 'Olulimi', sw: 'Lugha' },
  'settings.language.sub': { en: 'Choose your preferred language', lg: 'Londawo olulimi lwo', sw: 'Chagua lugha unayopendelea' },
  'settings.health.worker': { en: 'Health Worker Mode', lg: "Engeri ya Omukozi w'Obulamu", sw: 'Hali ya Mfanyakazi wa Afya' },
  'settings.health.worker.sub': { en: 'Enable enhanced clinical features', lg: "Yongereza ebirala by'omusawo", sw: 'Wezesha vipengele vya kliniki vilivyoboreshwa' },
  'settings.notifications': { en: 'Health Reminders', lg: 'Okujjukuza Obulamu', sw: 'Vikumbusho vya Afya' },
  'settings.lang.luganda.note': {
    en: 'Full translation of all UI and AI responses',
    lg: "Okukyusa kw'ebigambo byona n'okuddamu kw'AI",
    sw: 'Tafsiri kamili ya UI yote na majibu ya AI'
  },
}

// ── Translation function ─────────────────────────────────────
export function t(key, lang = 'en', vars = {}) {
  const entry = translations[key]
  if (!entry) return key
  let text = entry[lang] || entry['en'] || key
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replace('{' + k + '}', v || '')
  })
  return text
}

// ── Health tips in chosen language ───────────────────────────
export function getHealthTips(lang = 'en') {
  return [
    t('tip.water', lang),
    t('tip.sleep', lang),
    t('tip.malaria', lang),
    t('tip.handwash', lang),
    t('tip.moringa', lang),
    t('tip.malariaint', lang),
    t('tip.bp', lang),
    t('tip.deworming', lang),
  ]
}

// ── Localised quick topics for Companion page ─────────────────
export function getQuickTopics(lang = 'en') {
  const prompts = {
    en: {
      symptoms:    'I have a headache and fever',
      medications: 'Tell me about paracetamol dosage',
      nutrition:   'What should I eat for anaemia?',
      firstaid:    'How do I treat a burn?',
      pregnancy:   'Pregnancy nutrition tips',
      child:       'Uganda vaccine schedule for children',
      malaria:     'Tell me about malaria prevention',
      wellness:    'Give me healthy living tips',
      mental:      'Help me with stress and mental health',
      hiv:         'Tell me about HIV and TB in Uganda',
      water:       'How to make safe water at home',
      family:      'Tell me about family planning options',
    },
    lg: {
      symptoms:    'Nfuna ebikolwa ebi: omutwe, febulo',
      medications: 'Nnyambirira ku paracetamol',
      nutrition:   'Nze anaemia, ndya ki?',
      firstaid:    'Ntondera otulo ku kuluma amaanyi?',
      pregnancy:   'Ebikuumiriza mu okubeera embuto',
      child:       'Endagiriro y\'enkingo y\'omwana mu Uganda',
      malaria:     'Nnyambirira okukwekkereza omusujja',
      wellness:    'Mpezza ebyobukuumirizi obulungi',
      mental:      'Mpezza ne okuyamba ku nsongo z\'ettima',
      hiv:         'Nnyambirira ku HIV ne TB mu Uganda',
      water:       'Amazzi amalongoofu — engeri gy\'okuteeka',
      family:      'Nnyambirira ku nguvu ez\'okubyalira',
    },
    sw: {
      symptoms:    'Nina maumivu ya kichwa na homa',
      medications: 'Niambie kuhusu kipimo cha paracetamol',
      nutrition:   'Ninakula nini kwa anemia?',
      firstaid:    'Ninatibu kuchomeka vipi?',
      pregnancy:   'Vidokezo vya lishe wakati wa ujauzito',
      child:       'Ratiba ya chanjo ya mtoto Uganda',
      malaria:     'Niambie kuhusu kuzuia malaria',
      wellness:    'Nipe vidokezo vya maisha yenye afya',
      mental:      'Nisaidie na msongo wa mawazo',
      hiv:         'Niambie kuhusu HIV na TB Uganda',
      water:       'Jinsi ya kutengeneza maji salama nyumbani',
      family:      'Niambie kuhusu uzazi wa mpango',
    },
  }
  const p = prompts[lang] || prompts['en']
  return [
    { icon: '🌡️', labelKey: 'topic.symptoms',    prompt: p.symptoms },
    { icon: '💊', labelKey: 'topic.medications',  prompt: p.medications },
    { icon: '🥗', labelKey: 'topic.nutrition',    prompt: p.nutrition },
    { icon: '🩹', labelKey: 'topic.firstaid',     prompt: p.firstaid },
    { icon: '🤰', labelKey: 'topic.pregnancy',    prompt: p.pregnancy },
    { icon: '👶', labelKey: 'topic.child',        prompt: p.child },
    { icon: '🦟', labelKey: 'topic.malaria',      prompt: p.malaria },
    { icon: '💪', labelKey: 'topic.wellness',     prompt: p.wellness },
    { icon: '🧠', labelKey: 'topic.mental',       prompt: p.mental },
    { icon: '🔴', labelKey: 'topic.hiv',          prompt: p.hiv },
    { icon: '💧', labelKey: 'topic.water',        prompt: p.water },
    { icon: '👨‍👩‍👧', labelKey: 'topic.family',  prompt: p.family },
  ]
}

export function localiseAIGreeting(name, lang = 'en') {
  return t('ai.greeting', lang, { name: name || '' })
}
export function localiseAIClarify(lang = 'en') {
  return t('ai.clarify', lang)
}

export default translations
