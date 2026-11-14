# 🩺 SayMyDoc — Intelligent Health Companion

**Created by SayMyTech Developers | Kampala, Uganda**
*Because understanding your health is a human right.*

SayMyDoc is an offline-first health companion PWA built for Uganda and East Africa.
Describe how you feel in plain language (English, Luganda or Swahili) and get clear,
cautious guidance — with real AI when you're online, and a built-in rule-based
engine that always works when you're not.

> SayMyDoc gives health **information**, not medical diagnosis. It never replaces a
> clinician. In an emergency, go to the nearest health facility.

---

## Features

- 🧠 **Symptom checker** — rule-based inference engine over ~102 conditions, with follow-up
  questions chosen for maximum information gain, emergency detection, and *calibrated*
  confidence (never claims certainty; max 90%)
- 🤖 **Online AI** — Gemini Flash with Groq fallback, then the offline engine (see below)
- 💬 **Yolanda, the health companion** — Q&A on conditions, medicines, first aid, nutrition
- 💊 **Medication reference + reminders** — 44 medicines, alarms that work with the app closed
- 🩹 **First aid** — 26 step-by-step situations
- 🌿 **Remedy library** — 24 traditional remedies with an evidence rating
- 🏥 **Nearby clinics** — 293 Ugandan facilities, works offline
- 📖 **Journal, insights, history, PDF health report** (all offline)
- 🧑‍⚕️ **Health-worker mode**
- 🌍 **English, Luganda, Swahili**
- 🔒 **Your data stays on your device** (IndexedDB). When you are online, AI chat sends your message text
  (plus age and sex, if set) to the AI service via the Netlify Function. Nothing else leaves the device.

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite 8, React Router 7 |
| Styling | Tailwind CSS 3, self-hosted Inter/Poppins (no external fonts) |
| Offline DB | Dexie (IndexedDB) |
| PWA | vite-plugin-pwa (injectManifest) + Workbox; pages are lazy-loaded and precached |
| Offline AI | Pure JavaScript rule engine + JSON knowledge base |
| Online AI | Netlify Function → Gemini → Groq |
| PDF | jsPDF (bundled, loaded on demand) |

## Getting started

```bash
npm install
npm run dev        # app only (stays in offline mode — no Netlify Functions)
npm run build
npm test           # function + engine tests
npm run lint
```

Deploy with Netlify (`netlify.toml` is included). Set the environment variables below.

---

## 🤖 Online AI (Gemini → Groq → offline engine)

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
| `GEMINI_MODEL` | no | Comma-separated, tried first. Defaults: `gemini-3.8-flash` → `gemini-3.5-flash-lite` → `gemini-3.5-flash` |
| `GROQ_MODEL` | no | Comma-separated, tried first. Defaults: `openai/gpt-oss-120b` → `openai/gpt-oss-20b` (Groq removed free Llama models on 2026-08-16) |

Set them in Netlify → Site configuration → Environment variables, then redeploy.
Open `/.netlify/functions/ai-chat` to see which keys are configured (never the keys).
Open `/.netlify/functions/ai-chat?test=1` to run a live self-test: it calls every model once and
shows each one's status (e.g. `404` = model name retired, `429` = quota, `401/403` = bad key).
Model names change often — if a provider stops working, run the self-test first.
Gemini gets at most 4.5 s of the 9 s function budget so Groq can always answer, and a model that just
failed (busy / slow / retired) is skipped for a short while.

To test the AI locally use `npx netlify dev` with the variables in a `.env` file
(git-ignored — never commit it).

### Safety design
- Self-harm and emergency detection run in the **offline** engine first, on-device.
- The AI is instructed never to give doses, never to diagnose definitively, to send
  emergencies to a clinic, and to treat user text as data, not instructions.
- A **red-flag screen** (`src/engine/RedFlags.js`) runs first, on-device, in both the checker and the
  companion: stroke signs, breathing difficulty, heavy bleeding, pregnancy danger signs, seizures, poisoning,
  snakebite, anaphylaxis, coughing/vomiting blood, acute abdomen, infant danger signs, chest pain, meningitis
  signs, head injury and diabetic emergencies escalate immediately. Covered by a regression suite.
- AI text is HTML-escaped before display, and emails/phone numbers are redacted before anything is sent.
- People can switch online AI off in Settings; a one-time notice explains what is sent.

## Notes for maintainers

- The IndexedDB database is still named `YoSymptomDB` (from the app's earlier name).
  Renaming it would orphan existing users' data — write a migration first.
- Content that needs clinical review before wide release: medicine doses
  (`src/knowledge/medications.json`), crisis hotline numbers (`EmotionalEngine.js`),
  and Luganda/Swahili translations.
- 25 conditions have no follow-up questions yet (see `follow_up_keys` in the knowledge files).
