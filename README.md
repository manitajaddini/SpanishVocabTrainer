# Spanish Lemma Trainer

A mobile-first vocabulary drill app that lets learners upload their own CSV decks, generate language-model prompts, and receive instant feedback. Prompts and grading are powered by the OpenAI Responses API, while all deck data, progress, and optional API keys live entirely in the browser.

---

## Features

- **Bring your own deck** – Upload a semicolon-delimited CSV with two columns (target language; source language). Headers can be any language names; the app auto-detects them and lets you override in Settings.
- **Strict lemma coverage** – Every lemma appears exactly once per cycle thanks to a deterministic scheduler.
- **Live insights** – Track streaks, recent accuracy, and “focus next” lemmas to guide revision.
- **Resilient UX** – Onboarding wizard, retry/skip controls, and detailed error messages when the LLM is unavailable.
- **Model flexibility** – Choose between `gpt-4o-mini` and `gpt-4o`, or supply any allowed model via the request header.
- **Privacy by design** – All deck data and optional API key stay in localStorage. The backend simply forwards requests to OpenAI.

---

## Prerequisites

- Node.js 18+
- npm 9+
- OpenAI API access to `gpt-4o-mini` (users may supply their own API key inside the app; a default key on the backend is optional but recommended for development).

---

## Installation

```bash
git clone <repo-url>
cd SpanishVocabTrainer
npm install
```

### Development

```bash
npm run dev
```

This starts:

- Backend (Express + OpenAI proxy) on port **3001**
- Frontend (Vite dev server) on port **5173** with `/api` proxied to the backend

Visit http://localhost:5173. Use the onboarding steps to upload a CSV, paste your API key (optional if the backend provides one), and start practicing.

### Production build

```bash
npm run build
npm run start   # serves backend (dist/index.js) + vite preview (port 4173)
```

---

## Environment Variables

| Variable             | Location     | Purpose                                          |
|----------------------|--------------|--------------------------------------------------|
| `OPENAI_API_KEY`     | Backend (`server`) | Default key when requests omit `x-api-key`. Required for backend tests/builds. |
| `VITE_API_BASE_URL`  | Frontend (`frontend`) | Base URL for API requests. Default `/api` during dev; in production set to the deployed backend, e.g. `https://backend.vercel.app/api`. |

---

## Repository Layout

```
SpanishVocabTrainer/
├─ package.json (workspaces root)
├─ scripts/
│  ├─ dev.js      # runs backend + frontend concurrently
│  └─ start.js    # runs backend build output + vite preview
├─ frontend/
│  ├─ package.json, tsconfig.json, vite.config.ts, vitest configs
│  └─ src/
│     ├─ App.tsx, main.tsx, styles
│     ├─ components/ (CsvLoader, QuizCard, ScorePanel, Settings, Onboarding, InsightsPanel, ProgressBar)
│     ├─ lib/ (csv parsing, scheduler, scoring, insights, OpenAI client, storage helpers, evaluation logic)
│     ├─ config/models.ts
│     ├─ types.ts
│     └─ __tests__/ (Vitest suites)
└─ server/
   ├─ package.json, tsconfig.json
   └─ src/ (index.ts, openai.ts, prompts.ts, schemas.ts)
```

---

## CSV Format

- Semicolon (`;`) separator
- Two columns: **target language** first, **source language** second
- First row may be headers in any language (used to auto-label prompts)

Example:

```
Spanish;English
necesitar;"I need"
cocinar;"to cook"
```

On upload, lemmas are lowercased/deduplicated from the target column.

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Run backend + frontend in watch mode |
| `npm run build` | Compile backend TypeScript (`server/dist`) and frontend bundle (`frontend/dist`) |
| `npm run start` | Serve the compiled backend and frontend preview for production testing |
| `npm test` | Run frontend Vitest suite (backend currently has no tests) |
| `npm --workspace frontend run test` | Frontend tests only |
| `npm --workspace server run dev` | Backend dev server only |

---

## Deploying to Vercel

The recommended setup uses **two** Vercel projects pointing to the same repository.

### Frontend project

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://<backend-app>.vercel.app/api`

### Backend project

- Root directory: `server`
- Build command: `npm run build`
- Output directory: `dist`
- Env var: `OPENAI_API_KEY`
- Requests to `/api/generate` and `/api/evaluate` are proxied to OpenAI; `/` will return 404 (expected).

After both deployments, the frontend will call the backend via the configured `VITE_API_BASE_URL`.

---

## Smoke Tests

1. **API**: `curl -X POST https://<backend>/api/generate -H "Content-Type: application/json" -H "x-api-key: <key>" -d '{"lemma":"probar","languages":{"source":"English","target":"Spanish"}}'`
2. **Frontend**: Upload a small CSV, complete at least one prompt, ensure feedback appears and stats update.
3. **Error toast**: Temporarily remove your API key to confirm retry/skip workflow.

---

## Privacy & Storage

- All deck rows, progress, insights, language overrides, and optional API key are stored in `localStorage` with the prefix `svt:*`.
- The backend never logs or stores user prompts/answers; it simply forwards them to OpenAI.
- Resetting progress in Settings clears all localStorage entries (except the saved API key) and re-opens onboarding.

---

## Need the full spec?

See [`REQUIREMENTS.md`](./REQUIREMENTS.md) for an exhaustive rebuild document covering every module, API contract, and validation step.

---

Happy drilling! Upload a deck, paste your key, and keep the lemmas flowing.
