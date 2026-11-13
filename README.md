# 🩺 SayMyDoc — Intelligent Health Companion

**Created by SayMyTech Developers | Kampala, Uganda**
*Because understanding your health is a human right.*

---

## What Is SayMyDoc?

SayMyDoc is a fully offline, AI-powered personal health companion PWA built for Africa and the world. Describe your symptoms in plain language and the AI helps you understand what your body is telling you — with zero internet required.

---

## Features (Sprint 1)

- 🧠 **AI Symptom Inference Engine** — forward-chaining rule-based AI with confidence scoring
- 💬 **Conversational Symptom Chat** — real conversation, not a form
- 📚 **8 Conditions at Launch** — Migraine, Tension Headache, Malaria, Typhoid, Flu, Gastritis, UTI, Anxiety, Asthma
- 📖 **Health Journal** — daily mood, sleep, water, stress and symptom tracking
- 📋 **Session History** — all past symptom checks saved locally
- 🏠 **Health Library** — browse conditions and learn about your body
- 🚨 **Emergency Detection** — flags life-threatening symptom patterns instantly
- 🔒 **100% Offline** — all data on your device, nothing uploaded anywhere
- 📱 **PWA** — installable from browser, works like a native app

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Offline DB | Dexie.js (IndexedDB) |
| PWA | VitePWA + Workbox |
| AI Engine | Pure JavaScript (no APIs) |
| Knowledge Base | Structured JSON |

---

## Getting Started

### Development
```bash
npm install
npm run dev
```
Open http://localhost:5173

### Production Build
```bash
npm run build
```
Deploy the `dist/` folder to Netlify by drag-and-drop.

### Deploy to Netlify
1. Run `npm run build`
2. Drag the `dist/` folder to https://app.netlify.com/drop
3. Done — your app is live and offline-capable

---

## Project Structure

```
src/
├── engine/
│   ├── InferenceEngine.js   # Core AI — forward-chaining inference
│   ├── NLPProcessor.js      # Text → symptom extraction
│   └── WorkingMemory.js     # Session state manager
├── knowledge/
│   └── conditions.json      # Full medical knowledge base
├── db/
│   └── database.js          # Dexie.js schema + helpers
├── pages/
│   ├── Home.jsx             # Dashboard
│   ├── Chat.jsx             # Symptom chat interface
│   ├── Journal.jsx          # Daily health journal
│   ├── History.jsx          # Past sessions
│   ├── Profile.jsx          # User settings
│   ├── Onboarding.jsx       # First-time setup
│   └── ConditionDetail.jsx  # Full condition page
├── components/
│   ├── layout/BottomNav.jsx
│   ├── chat/ConditionResult.jsx
│   └── ui/LoadingScreen.jsx
└── context/
    └── AppContext.jsx        # Global user state
```

---

## Sprint Roadmap

- ✅ **Sprint 1** — Foundation, AI Engine, Core Chat, Journal, History (THIS BUILD)
- 🔜 **Sprint 2** — Soul Engine, Pattern Detection, Trigger Analysis
- 🔜 **Sprint 3** — 40+ conditions, Body Map, Medication Reference
- 🔜 **Sprint 4** — Luganda language, Emotional Intelligence, PDF export
- 🔜 **Sprint 5** — Health Worker Mode, Community Features

---

## About

**SayMyTech Developers** builds offline-first, African-context technology.
Founder: Ssemambo Steven | Kampala, Uganda | 2026

> "If this conversation was valuable to you — imagine what a structured, intelligent app version would do for someone with no access to this kind of information."

---

## 🤖 Online AI (Gemini → Groq → offline engine)

SayMyDoc answers with a real LLM when the person is online and falls back to the
built-in offline rule engine when they are not, or when the AI services fail.

```
Browser ──► /.netlify/functions/ai-chat ──► Gemini Flash (primary)
                                      └──► Groq          (fallback if Gemini errors / hits its limit)
   └── offline or both failed ──► built-in rule-based engine (always works)
```

API keys live **only** in Netlify environment variables and are used by the
Netlify Function. They are never sent to the browser.

### Netlify environment variables

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | yes | Primary AI (Google AI Studio key) |
| `GROQ_API_KEY` | yes | Fallback AI (Groq console key) |
| `GEMINI_MODEL` | no | Default `gemini-3.8-flash` |
| `GROQ_MODEL` | no | Default `llama-3.3-70b-versatile` |

Set them in Netlify → Site configuration → Environment variables, then redeploy.
Check the setup by opening `/.netlify/functions/ai-chat` — it shows which keys are
configured (never the keys themselves).

### Local development
`npm run dev` does not run Netlify Functions (the app then simply stays in offline mode).
To test the AI locally use `npx netlify dev` with the variables in a `.env` file (never commit it).

### Tests
`npm test` runs the function tests (provider fallback, key safety, input validation).
